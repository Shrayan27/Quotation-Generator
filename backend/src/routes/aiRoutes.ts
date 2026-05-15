import { Request, Response, Router } from 'express';
import { AiService } from '../services/aiService';

export const aiRouter = Router();

aiRouter.post('/suggest-specs', async (req: Request, res: Response) => {
  try {
    const { productName } = req.body;
    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ error: 'Valid product name string is required.' });
    }

    const specs = await AiService.suggestSpecs(productName);
    return res.json(specs);
  } catch (error: any) {
    console.error('POST /api/ai/suggest-specs error:', error);
    return res.status(500).json({ error: error.message || 'Internal AI Server Error' });
  }
});

aiRouter.post('/draft-email', async (req: Request, res: Response) => {
  try {
    const {
      quoteNo,
      custName,
      productSummary,
      totalAmount,
      validTill,
      payTerms,
      delivTime,
      warranty,
      freightCharge,
    } = req.body;

    if (!quoteNo || !custName || !productSummary) {
      return res.status(400).json({ error: 'Missing required quotation context fields for email draft.' });
    }

    const draft = await AiService.draftEmail({
      quoteNo,
      custName,
      productSummary,
      totalAmount,
      validTill,
      payTerms,
      delivTime,
      warranty,
      freightCharge,
    });

    return res.json(draft);
  } catch (error: any) {
    console.error('POST /api/ai/draft-email error:', error);
    return res.status(500).json({ error: error.message || 'Internal AI Server Error' });
  }
});
