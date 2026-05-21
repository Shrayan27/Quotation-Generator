import { Request, Response, Router } from 'express';
import { prisma } from '../database/prisma';
import { PdfService } from '../services/pdfService';
import { sendEmail } from '../services/emailService';
import { AiService } from '../services/aiService';
import { runFollowUpSequenceCheck } from '../jobs/followUpCron';

export const quotationRouter = Router();


function getFinancialYearCode(): string {
  const today = new Date();
  const month = today.getMonth(); 
  const year  = today.getFullYear();
  const fyStart = month < 3 ? year - 1 : year;
  const fyEnd   = fyStart + 1;
  return `${String(fyStart).slice(2)}${String(fyEnd).slice(2)}`;
}

async function generateNextQuoteNumber(): Promise<string> {
  const fyCode = getFinancialYearCode();
  const prefix = `QUOKBN${fyCode}-`;
  const count = await prisma.quotation.count({
    where: { quoteNumber: { startsWith: prefix } },
  });
  const seq = String(count + 1).padStart(3, '0');
  return `${prefix}${seq}`;
}

/**
 * Generate PDF buffer instantly from volatile payload state (Preview mode)
 */
quotationRouter.post('/preview-pdf', async (req: Request, res: Response) => {
  try {
    const pdfBuffer = await PdfService.generateQuotationPdf(req.body);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Quotation_${req.body.quoteNumber || 'Preview'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.send(pdfBuffer);
  } catch (error: any) {
    console.error('POST /api/quotations/preview-pdf error:', error);
    return res.status(500).json({ error: error.message || 'Error generating dynamic PDF output' });
  }
});

/**
 * Return the next available quote number for the current Financial Year (preview only).
 */
quotationRouter.get('/next-number', async (_req: Request, res: Response) => {
  try {
    const nextNumber = await generateNextQuoteNumber();
    return res.json({ quoteNumber: nextNumber });
  } catch (error: any) {
    console.error('GET /api/quotations/next-number error:', error);
    return res.status(500).json({ error: 'Failed to generate next quote number.' });
  }
});

/**
 * Create and persist a full Quotation historical snapshot alongside customer records
 */
quotationRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // 1. Resolve or Create Customer record
    let customerId = data.customerId;
    if (!customerId && data.billName) {
      // Find matching customer or create fresh entry
      let customer = await prisma.customer.findFirst({
        where: { name: data.billName.trim() },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: data.billName.trim(),
            email: data.billEmail || null,
            phone: data.billPhone || null,
            address: data.billAddr || null,
          },
        });
      }
      customerId = customer.id;
    }

    // 2. Map and filter incoming array items
    const itemsData = Array.isArray(data.items) 
      ? data.items.map((it: any) => ({
          description: it.description || it.desc || '',
          hsn: it.hsn || '',
          qty: parseFloat(it.qty || 1),
          rate: parseFloat(it.rate || 0),
          tax: parseFloat(it.tax || 18),
          photo: it.photo || null,
        }))
      : [];

    // Calculate strict totals server-side to guarantee commercial audit integrity
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    itemsData.forEach((it: any) => {
      const amt = it.qty * it.rate;
      calculatedSubtotal += amt;
      calculatedTax += amt * (it.tax / 100);
    });

    // 3. Persist quotation snapshot
    const savedQuotation = await prisma.quotation.create({
      data: {
        quoteNumber: await generateNextQuoteNumber(),
        customerId: customerId || null,
        
        quoteDate: data.quoteDate || new Date().toISOString().split('T')[0],
        validTill: data.validTill || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        quoteTitle: data.quoteTitle || null,
        projectName: data.projectName || null,
        custRef: data.custRef || null,
        transport: data.transport || null,

        billName: data.billName || 'Valued Customer',
        billContact: data.billContact || null,
        billAddr: data.billAddr || '',
        billPhone: data.billPhone || null,
        billEmail: data.billEmail || null,
        billState: data.billState || null,
        billStateCode: data.billStateCode || null,

        sameAsBill: data.sameAsBill !== false,
        shipName: data.shipName || null,
        shipContact: data.shipContact || null,
        shipAddr: data.shipAddr || null,
        shipPhone: data.shipPhone || null,
        shipEmail: data.shipEmail || null,
        shipState: data.shipState || null,
        shipStateCode: data.shipStateCode || null,

        freightType: data.freightType || 'extra',
        freightAmt: parseFloat(data.freightAmt || 0),
        instType: data.instType || 'extra',
        taxType: data.taxType || 'igst',

        payTerms: data.payTerms || null,
        delivTime: data.delivTime || null,
        warranty: data.warranty || null,
        warrantyStart: data.warrantyStart || null,

        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        total: calculatedSubtotal + calculatedTax,
        isDocComposite: data.isDocComposite === true,
        status: data.status || 'saved',

        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    // Send the initial email with attached Quotation if billing email is provided
    if (savedQuotation.billEmail) {
      try {
        const pdfBuffer = await PdfService.generateQuotationPdf(data);
        
        // Construct a professional B2B email draft using our mocked service (or use the custom one edited in frontend)
        const productSummary = savedQuotation.items.map((it: any) => `- ${it.qty}x ${it.description.split('\n')[0]}`).join('\n');
        const freightCharge = savedQuotation.freightType === 'custom' 
          ? `₹${savedQuotation.freightAmt.toLocaleString('en-IN')}` 
          : savedQuotation.freightType === 'included' 
            ? 'Included' 
            : 'Extra at actuals';

        let emailSubject = data.customEmailSubject;
        let emailBody = data.customEmailBody;

        if (!emailSubject || !emailBody) {
          const draft = await AiService.draftEmail({
            quoteNo: savedQuotation.quoteNumber,
            custName: savedQuotation.billName,
            productSummary,
            totalAmount: `₹${savedQuotation.total.toLocaleString('en-IN')}`,
            validTill: savedQuotation.validTill || undefined,
            payTerms: savedQuotation.payTerms || '100% Advance',
            delivTime: savedQuotation.delivTime || 'Immediate',
            warranty: savedQuotation.warranty || '12 Months',
            freightCharge
          });
          emailSubject = draft.subject;
          emailBody = draft.body;
        }

        // Convert the plain-text draft newlines into HTML breaks
        const htmlBody = emailBody.replace(/\n/g, '<br>');

        await sendEmail(
          savedQuotation.billEmail,
          emailSubject,
          htmlBody,
          [
            {
              filename: `Quotation_${savedQuotation.quoteNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        );

        // Register the automated Follow-Up Sequence
        const nextDate = new Date();
        nextDate.setMinutes(nextDate.getMinutes() + 5); // First follow-up in 5 minutes

        await prisma.followUpSequence.create({
          data: {
            quotationId: savedQuotation.id,
            customerEmail: savedQuotation.billEmail,
            nextFollowUpDate: nextDate,
          }
        });
      } catch (emailErr) {
        console.error('Error during initial email dispatch or sequence registration:', emailErr);
        // We don't fail the entire quotation save if email fails, just log it.
      }
    }

    return res.status(201).json(savedQuotation);
  } catch (error: any) {
    console.error('POST /api/quotations persistence error:', error);
    return res.status(500).json({ error: error.message || 'Database error saving Quotation record' });
  }
});

/**
 * Retrieve saved quotation history list
 */
quotationRouter.get('/', async (req: Request, res: Response) => {
  try {
    const list = await prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true, customer: true },
    });
    return res.json(list);
  } catch (error: any) {
    console.error('GET /api/quotations retrieval error:', error);
    return res.status(500).json({ error: 'Failed to retrieve saved quotation history.' });
  }
});

/**
 * Delete a saved quotation entry
 */
quotationRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.quotation.delete({
      where: { id: req.params.id as string },
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/quotations error:', error);
    return res.status(500).json({ error: 'Failed to delete target quotation record.' });
  }
});

/**
 * Retrieve active follow-up sequences for the dashboard
 */
quotationRouter.get('/follow-ups/active', async (req: Request, res: Response) => {
  try {
    const list = await prisma.followUpSequence.findMany({
      orderBy: { nextFollowUpDate: 'asc' },
      include: { quotation: true },
    });
    return res.json(list);
  } catch (error: any) {
    console.error('GET /api/quotations/follow-ups/active error:', error);
    return res.status(500).json({ error: 'Failed to retrieve follow up sequences.' });
  }
});

/**
 * Force trigger a check of all active follow-up outreach sequences.
 * For easier testing, it optionally updates nextFollowUpDate to 'now' so
 * that sequences are processed instantly without waiting for their timer.
 */
quotationRouter.post('/follow-ups/trigger-check', async (req: Request, res: Response) => {
  try {
    const { forceDue } = req.body;
    console.log(`[API] Triggering follow-up outreach check... (forceDue: ${!!forceDue})`);
    
    if (forceDue) {
      // Mark all ACTIVE sequences as due right now
      const result = await prisma.followUpSequence.updateMany({
        where: { status: 'ACTIVE' },
        data: { nextFollowUpDate: new Date() }
      });
      console.log(`[API] Set nextFollowUpDate to now for ${result.count} active sequences.`);
    }
    
    // Execute the sequence checker logic
    await runFollowUpSequenceCheck();
    
    return res.json({ 
      success: true, 
      message: "Follow-up outreach check triggered successfully. Check your backend console logs for exact transmission details." 
    });
  } catch (error: any) {
    console.error('POST /api/quotations/follow-ups/trigger-check error:', error);
    return res.status(500).json({ error: error.message || 'Failed to trigger follow-up outreach.' });
  }
});

/**
 * Mark a follow-up sequence as replied manually
 */
quotationRouter.post('/follow-ups/:id/reply', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.followUpSequence.update({
      where: { id: req.params.id as string },
      data: { status: 'STOPPED' }
    });
    return res.json(updated);
  } catch (error: any) {
    console.error('POST /api/quotations/follow-ups/:id/reply error:', error);
    return res.status(500).json({ error: 'Failed to update follow up sequence.' });
  }
});

/**
 * Delete a follow-up sequence
 */
quotationRouter.delete('/follow-ups/:id', async (req: Request, res: Response) => {
  try {
    await prisma.followUpSequence.delete({
      where: { id: req.params.id as string },
    });
    return res.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/quotations/follow-ups/:id error:', error);
    return res.status(500).json({ error: 'Failed to delete follow up sequence.' });
  }
});
