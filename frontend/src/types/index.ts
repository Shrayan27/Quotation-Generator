export interface QuoteItem {
  id: string;
  description: string;
  hsn: string;
  qty: number;
  rate: number;
  tax: number;
  photo: string | null; // Base64 image data URL or direct link string
}

export interface QuotationFormState {
  quoteNumber: string;
  quoteDate: string;
  validTill: string;
  quoteTitle: string;
  projectName: string;
  custRef: string;
  transport: string;
  companyLogo: string | null;
  authSignature: string | null;

  // Billing Details
  billName: string;
  billContact: string;
  billAddr: string;
  billPhone: string;
  billEmail: string;
  billState: string;
  billStateCode: string;

  // Shipping Details
  sameAsBill: boolean;
  shipName: string;
  shipContact: string;
  shipAddr: string;
  shipPhone: string;
  shipEmail: string;
  shipState: string;
  shipStateCode: string;

  // Charges
  freightType: 'extra' | 'included' | 'custom';
  freightAmt: number;
  instType: 'extra' | 'included';
  taxType: 'igst' | 'cgst';

  // Terms
  payTerms: string;
  delivTime: string;
  warranty: string;
  warrantyStart: string;
}

export interface QuotationHistoryEntry extends QuotationFormState {
  id: string;
  customerId: string | null;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  items: QuoteItem[];
}

export interface AiSpecSuggestion {
  description: string;
  specifications: string;
  hsn_code: string;
  tax_rate: number;
}

export interface AiEmailSuggestion {
  subject: string;
  body: string;
}
