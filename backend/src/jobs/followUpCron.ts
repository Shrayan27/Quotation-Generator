import cron from "node-cron";
import { prisma } from "../database/prisma";
import { checkReplies, sendEmail } from "../services/emailService";
import { generateFollowUpEmail } from "../services/aiFollowUpService";

export const runFollowUpSequenceCheck = async () => {
	console.log("[CRON] Starting Follow-Up Sequence Check...");

	try {
		// 1. Check IMAP for replies for all ACTIVE sequences
		const activeSequences = await prisma.followUpSequence.findMany({
			where: { status: "ACTIVE" },
			include: { quotation: true },
		});

		const enableImap = process.env.ENABLE_IMAP_CHECK === "true";

		if (enableImap && activeSequences.length > 0) {
			const customerEmails = Array.from(
				new Set(activeSequences.map((seq) => seq.customerEmail)),
			);

			try {
				const repliedEmails = await checkReplies(customerEmails);

				for (const email of repliedEmails) {
					// Mark sequences as STOPPED if they replied
					await prisma.followUpSequence.updateMany({
						where: { customerEmail: email, status: "ACTIVE" },
						data: { status: "STOPPED" },
					});
					console.log(`[CRON] Stopped follow-ups for ${email} due to reply.`);
				}
			} catch (imapErr: any) {
				console.log(`[CRON] ℹ️ IMAP replies check skipped (${imapErr.message || imapErr}). SMTP auto-outreach is still fully active.`);
			}
		}

		// 2. Re-fetch active sequences after stopping the replied ones
		const dueSequences = await prisma.followUpSequence.findMany({
			where: {
				status: "ACTIVE",
				nextFollowUpDate: { lte: new Date() },
			},
			include: { quotation: true },
		});

		if (dueSequences.length === 0) {
			console.log("[CRON] No follow-up sequences are currently due.");
		}

		for (const seq of dueSequences) {
			const nextCount = seq.followUpCount + 1;

			// If it's reached max follow-ups (e.g., 3), mark completed
			if (nextCount > 3) {
				await prisma.followUpSequence.update({
					where: { id: seq.id },
					data: { status: "COMPLETED" },
				});
				console.log(`[CRON] Sequence ${seq.id} completed max follow-ups.`);
				continue;
			}

			// Generate AI Email
			const q = seq.quotation;
			const aiEmail = await generateFollowUpEmail(
				q.billName,
				q.quoteNumber,
				q.quoteTitle,
				q.total,
				nextCount,
			);

			// Send Email
			await sendEmail(seq.customerEmail, aiEmail.subject, aiEmail.body);

			// Update Sequence in DB
			const nextDate = new Date();
			nextDate.setMinutes(nextDate.getMinutes() + 5); // Next follow up in 5 minutes

			await prisma.followUpSequence.update({
				where: { id: seq.id },
				data: {
					followUpCount: nextCount,
					nextFollowUpDate: nextDate,
				},
			});

			console.log(
				`[CRON] Sent follow-up #${nextCount} for Quotation ${q.quoteNumber}`,
			);
		}
	} catch (error) {
		console.error("[CRON] Error during follow-up execution:", error);
	}

	console.log("[CRON] Follow-Up Sequence Check Completed.");
};

export const startCronJobs = () => {
	// Run every 5 minutes automatically.
	cron.schedule("*/5 * * * *", async () => {
		await runFollowUpSequenceCheck();
	});

	console.log("[CRON] Scheduler initialized to check every 5 minutes.");
};
