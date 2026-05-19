import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface AiSpecResponse {
	description: string;
	specifications: string;
	hsn_code: string;
	tax_rate: number;
}

export interface AiEmailResponse {
	subject: string;
	body: string;
}

export class AiService {
	/**
	 * Securely generates professional industrial specifications and metadata for a given product query.
	 */
	static async suggestSpecs(productName: string): Promise<AiSpecResponse> {
		// BYPASS ANTHROPIC FOR TESTING
		return {
			description: `${productName.trim()} (Industrial Grade)`,
			specifications: `Sensor Type: ${productName.trim()}\nOutput: 4-20mA / RS485 Modbus\nPower Supply: 24V DC\nProtection: IP65 / Weatherproof\nMounting: Standard Threaded / Flanged\nAccuracy: ±0.5% F.S.`,
			hsn_code: "9026",
			tax_rate: 18,
		};
	}

	/**
	 * Generates a concise, highly professional B2B follow-up email draft.
	 */
	static async draftEmail(context: {
		quoteNo: string;
		custName: string;
		productSummary: string;
		totalAmount: string;
		validTill?: string;
		payTerms: string;
		delivTime: string;
		warranty: string;
		freightCharge?: string;
	}): Promise<AiEmailResponse> {
		// BYPASS ANTHROPIC FOR TESTING
		return {
			subject: `Quotation ${context.quoteNo} — KB Sensormart`,
			body: `Dear ${context.custName},\n\nThank you for your valuable inquiry. Please find our commercial offer referenced as ${context.quoteNo} for the industrial sensors/instruments.\n\nTotal Investment: ${context.totalAmount}\nFreight / Transport Charges: ${context.freightCharge || "Extra at actuals"}\nDelivery Schedule: ${context.delivTime}\nPayment Terms: ${context.payTerms}\nWarranty: ${context.warranty}\n\nWe look forward to your confirmation and remain available for any technical clarifications.\n\nWarm regards,\nKB Sensormart — Kuchhal Brothers\n+91 7017880914\nkuchhalbrothers@gmail.com`,
		};
	}
}
