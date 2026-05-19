import { AiEmailSuggestion, AiSpecSuggestion, QuotationHistoryEntry } from '../types';

const BASE_URL = '/api';

export const api = {
  /**
   * Request server-side AI technical specification synthesis.
   */
  async suggestSpecs(productName: string): Promise<AiSpecSuggestion> {
    const res = await fetch(`${BASE_URL}/ai/suggest-specs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to suggest specifications from AI engine.');
    }

    return res.json();
  },

  /**
   * Request server-side AI B2B follow-up email composition.
   */
  async draftEmail(payload: {
    quoteNo: string;
    custName: string;
    productSummary: string;
    totalAmount: string;
    validTill: string;
    payTerms: string;
    delivTime: string;
    warranty: string;
    freightCharge?: string;
  }): Promise<AiEmailSuggestion> {
    const res = await fetch(`${BASE_URL}/ai/draft-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to compose professional email draft.');
    }

    return res.json();
  },

  /**
   * Persist full quotation state snapshot to persistent database storage.
   */
  async saveQuotation(payload: any): Promise<QuotationHistoryEntry> {
    const res = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Error persisting quotation records.');
    }

    return res.json();
  },

  /**
   * Fetch stored historical quotations list.
   */
  async getQuotationsHistory(): Promise<QuotationHistoryEntry[]> {
    const res = await fetch(`${BASE_URL}/quotations`);
    if (!res.ok) {
      throw new Error('Error retrieving previous quotation history.');
    }
    return res.json();
  },

  /**
   * Fetch the next sequential quote number for the current Indian Financial Year.
   * Returns a preview string like "QUOKBN2627-004".
   */
  async fetchNextQuoteNumber(): Promise<string> {
    const res = await fetch(`${BASE_URL}/quotations/next-number`);
    if (!res.ok) {
      throw new Error('Failed to fetch next quote number from server.');
    }
    const data = await res.json();
    return data.quoteNumber as string;
  },

  /**
   * Delete specific historical quotation record.
   */
  async deleteQuotation(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/quotations/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('Error expunging saved quotation record.');
    }
  },

  /**
   * Directly triggers download/inline view of server-compiled high-fidelity PDF binaries.
   */
  async generatePreviewPdf(payload: any): Promise<void> {
    const res = await fetch(`${BASE_URL}/quotations/preview-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Error generating dynamic PDF stream.');
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    
    // Open new tab displaying native PDF stream matching premium presentation
    window.open(blobUrl, '_blank');
  },

  /**
   * Fetch active follow-up sequences from the backend.
   */
  async getActiveFollowUps(): Promise<any[]> {
    const res = await fetch(`${BASE_URL}/quotations/follow-ups/active`);
    if (!res.ok) {
      throw new Error('Error retrieving follow up sequences.');
    }
    return res.json();
  },

  /**
   * Manually mark a follow up sequence as replied.
   */
  async markFollowUpReplied(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/quotations/follow-ups/${id}/reply`, { method: 'POST' });
    if (!res.ok) {
      throw new Error('Error marking sequence as replied.');
    }
  },

  /**
   * Delete a follow up sequence.
   */
  async deleteFollowUp(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/quotations/follow-ups/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      throw new Error('Error deleting sequence.');
    }
  },

  /**
   * Manually trigger follow-up outreach check, optionally forcing all active sequences to run now.
   */
  async triggerFollowUpCheck(forceDue: boolean = false): Promise<void> {
    const res = await fetch(`${BASE_URL}/quotations/follow-ups/trigger-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceDue }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Error triggering follow up check.');
    }
  },
};
