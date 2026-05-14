import puppeteer from 'puppeteer';
import { generateQuotationHtml } from '../pdf/template';

export class PdfService {
  /**
   * Renders a highly professional A4 commercial PDF quotation buffer using Puppeteer headless engine.
   */
  static async generateQuotationPdf(quotationData: any): Promise<Buffer> {
    const htmlContent = generateQuotationHtml(quotationData);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // Load raw template string
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
      });

      // Emulate screen media to ensure layout matches beautiful CSS print settings
      await page.emulateMediaType('screen');

      // Export native PDF binary buffer
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
