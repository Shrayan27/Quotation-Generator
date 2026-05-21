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

      // Emulate print media to ensure layout matches beautiful CSS print settings and standard table fragmentation
      await page.emulateMediaType('print');

      // Export native PDF binary buffer
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: `
          <div style="font-family: 'DM Sans', Arial, sans-serif; font-size: 10px; color: #444; font-weight: 700; width: 100%; text-align: center; padding-bottom: 4px;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `,
        margin: {
          top: '8mm',
          right: '8mm',
          bottom: '12mm', // Slightly larger bottom margin to accommodate footer perfectly without clipping
          left: '8mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
