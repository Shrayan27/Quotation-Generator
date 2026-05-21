const OUTLOOK_EMAIL = process.env.OUTLOOK_EMAIL || "Sales@sensormart.co.in";
const OUTLOOK_PASSWORD = process.env.OUTLOOK_APP_PASSWORD || "";
const SENDER_NAME = process.env.SENDER_NAME || "Sales Sensormart";

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || "";
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || "";
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || "";

let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

// Function to request OAuth2 access token from Microsoft Identity Platform for Microsoft Graph
export const getOAuthAccessToken = async (): Promise<string> => {
	const currentTime = Date.now();
	if (cachedToken && currentTime < tokenExpiryTime - 300000) {
		return cachedToken;
	}

	if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
		throw new Error("Missing Azure AD Client ID, Tenant ID, or Client Secret in .env configuration.");
	}

	const url = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
	
	const params = new URLSearchParams({
		client_id: AZURE_CLIENT_ID,
		scope: "https://graph.microsoft.com/.default",
		client_secret: AZURE_CLIENT_SECRET,
		grant_type: "client_credentials",
	});

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const errorText = await response.text();
		if (errorText.includes("AADSTS7000215")) {
			throw new Error(
				"Invalid Azure client secret. You have configured the 'Client Secret ID' (which is a UUID like 'cce2ba79-2bf3-4f27-9d7c-45579c453e19') instead of the actual 'Client Secret Value' in your AZURE_CLIENT_SECRET environment variable. Please go to Azure Portal -> App Registrations -> Certificates & Secrets, generate a new secret, and copy the 'Value' column rather than the Secret ID."
			);
		}
		throw new Error(`Failed to generate Azure OAuth2 token: ${errorText}`);
	}

	const data = (await response.json()) as any;
	cachedToken = data.access_token;
	tokenExpiryTime = currentTime + (data.expires_in * 1000);
	return data.access_token;
};

// Function to send email via Microsoft Graph API
export const sendEmail = async (
	to: string,
	subject: string,
	html: string,
	attachments: any[] = [],
) => {
	try {
		const accessToken = await getOAuthAccessToken();
		const url = `https://graph.microsoft.com/v1.0/users/${OUTLOOK_EMAIL}/sendMail`;

		const formattedAttachments = attachments.map((att: any) => {
			let base64Content = "";
			if (Buffer.isBuffer(att.content)) {
				base64Content = att.content.toString("base64");
			} else if (typeof att.content === "string") {
				const isBase64 = /^[a-zA-Z0-9+/]*={0,2}$/.test(att.content) && att.content.length % 4 === 0;
				base64Content = isBase64 ? att.content : Buffer.from(att.content).toString("base64");
			} else {
				base64Content = Buffer.from(att.content).toString("base64");
			}
			return {
				"@odata.type": "#microsoft.graph.fileAttachment",
				name: att.filename,
				contentType: att.contentType || "application/octet-stream",
				contentBytes: base64Content,
			};
		});

		const emailPayload = {
			message: {
				subject: subject,
				body: {
					contentType: "HTML",
					content: html,
				},
				toRecipients: [
					{
						emailAddress: {
							address: to,
						},
					},
				],
				attachments: formattedAttachments,
			},
			saveToSentItems: "true",
		};

		console.log(`[Email Service] Sending email to ${to} via Microsoft Graph API...`);
		const response = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(emailPayload),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Microsoft Graph SendMail failed: ${errorText}`);
		}

		console.log(`✅ Email successfully sent to ${to} via Microsoft Graph API`);
		return { success: true };
	} catch (error: any) {
		console.error(`❌ Error sending email to ${to} via Graph API:`, error.message || error);
		throw error;
	}
};

// Function to check replies via Microsoft Graph API
export const checkReplies = async (
	customerEmails: string[],
): Promise<string[]> => {
	if (customerEmails.length === 0) return [];

	const useOAuth2 = !!process.env.AZURE_CLIENT_ID;

	if (!useOAuth2) {
		console.warn("[Email Service] AZURE_CLIENT_ID is not configured. Graph API reply check skipped.");
		return [];
	}

	try {
		console.log("[Email Service] Fetching replies using Microsoft Graph API...");
		const accessToken = await getOAuthAccessToken();
		
		// Query unread inbox messages from the mailbox
		const url = `https://graph.microsoft.com/v1.0/users/${OUTLOOK_EMAIL}/mailFolders/inbox/messages?$filter=isRead eq false&$select=from&$top=50`;
		
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Microsoft Graph API request failed: ${errorText}`);
		}

		const data = (await response.json()) as any;
		const messages = data.value || [];

		const repliedEmails: Set<string> = new Set();
		for (const msg of messages) {
			const fromEmail = msg.from?.emailAddress?.address;
			if (fromEmail) {
				repliedEmails.add(fromEmail.toLowerCase().trim());
			}
		}

		const replies = Array.from(repliedEmails);
		// Filter by the customers we care about right now
		const validReplies = replies.filter((email) =>
			customerEmails.map((e) => e.toLowerCase()).includes(email),
		);
		
		console.log(`[Email Service] Microsoft Graph check complete. Found ${validReplies.length} replies.`);
		return validReplies;
	} catch (error: any) {
		console.error("[Email Service] ❌ Microsoft Graph API reply check failed:", error.message || error);
		throw error;
	}
};
