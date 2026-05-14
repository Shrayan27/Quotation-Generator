import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
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
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('your_api_key_here')) {
      throw new Error('Server Anthropic API Key is not configured correctly.');
    }

    const systemPrompt = `You are a technical product specialist for industrial sensors, instruments, and electronics sold in India. You have deep knowledge of sensor specifications, HSN codes under Indian GST, and technical terminology used in industrial B2B quotations. Respond ONLY in valid JSON. No markdown. No explanation. No extra text.`;

    const userPrompt = `Create a product entry for a sales quotation for this product: "${productName}"

Return ONLY this JSON object:
{
  "description": "Short product name for quotation header (5-8 words max)",
  "specifications": "Full technical specifications, one spec per line. Format each line as: Parameter: Value. Include all relevant specs like range, accuracy, output, power supply, protection rating, operating conditions etc.",
  "hsn_code": "Correct 4 or 8 digit HSN code for this product under Indian GST",
  "tax_rate": 18
}

Rules:
- description must be concise and professional
- specifications must be complete and technically accurate
- hsn_code must be valid for India GST
- tax_rate is usually 18 for sensors/instruments, use 12 or 5 only if you are certain`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      return JSON.parse(cleanJson) as AiSpecResponse;
    } catch (error: any) {
      console.error('Anthropic API Spec Suggestion Error:', error);
      // Fallback response if API fails/rate limited
      return {
        description: `${productName.trim()} (Industrial Grade)`,
        specifications: `Sensor Type: ${productName.trim()}\nOutput: 4-20mA / RS485 Modbus\nPower Supply: 24V DC\nProtection: IP65 / Weatherproof\nMounting: Standard Threaded / Flanged\nAccuracy: ±0.5% F.S.`,
        hsn_code: "9026",
        tax_rate: 18
      };
    }
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
  }): Promise<AiEmailResponse> {
    const systemPrompt = `You are a professional sales representative for Kuchhal Brothers (KB Sensormart), an industrial sensor and instrument company based in Roorkee, Uttarakhand, India. You write warm, professional, concise B2B emails in English. Your tone is polite, confident, and helpful — like a trusted supplier, not a salesperson.`;

    const userPrompt = `Write a professional quotation follow-up email to send to a customer.

Quotation details:
- Quote Number: ${context.quoteNo}
- Customer: ${context.custName}
- Products: 
${context.productSummary}
- Total Amount: ${context.totalAmount}
- Valid Till: ${context.validTill || '30 days from date'}
- Payment Terms: ${context.payTerms}
- Delivery Time: ${context.delivTime}
- Warranty: ${context.warranty}

Write BOTH a subject line and email body. Format your response EXACTLY like this:

SUBJECT: [subject line here]

BODY:
[email body here]

Rules for the email body:
- Start with a warm greeting using the customer name
- Thank them for their inquiry
- Briefly introduce the quotation (quote number, what it covers)
- Mention 1-2 key product highlights in simple language
- State validity, payment terms, delivery time clearly
- End with a friendly call to action (ask them to confirm or reach out with questions)
- Sign off as: Warm regards, / KB Sensormart — Kuchhal Brothers / +91 7017880914 / kuchhalbrothers@gmail.com
- Keep the body between 150 and 200 words
- No markdown formatting in the body`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      
      const subjectMatch = text.match(/SUBJECT:\s*(.+)/i);
      const bodyMatch = text.match(/BODY:\s*([\s\S]+)/i);

      const subject = subjectMatch ? subjectMatch[1].trim() : `Quotation ${context.quoteNo} — KB Sensormart`;
      const body = bodyMatch ? bodyMatch[1].trim() : text.trim();

      return { subject, body };
    } catch (error: any) {
      console.error('Anthropic API Email Draft Error:', error);
      return {
        subject: `Quotation ${context.quoteNo} — KB Sensormart`,
        body: `Dear ${context.custName},\n\nThank you for your valuable inquiry. Please find our commercial offer referenced as ${context.quoteNo} for the industrial sensors/instruments.\n\nTotal Investment: ${context.totalAmount}\nDelivery Schedule: ${context.delivTime}\nPayment Terms: ${context.payTerms}\nWarranty: ${context.warranty}\n\nWe look forward to your confirmation and remain available for any technical clarifications.\n\nWarm regards,\nKB Sensormart — Kuchhal Brothers\n+91 7017880914\nkuchhalbrothers@gmail.com`
      };
    }
  }
}
