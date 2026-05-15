import { create } from 'zustand';
import { api } from '../api';
import { QuotationFormState, QuoteItem } from '../types';

interface QuotationStoreState extends QuotationFormState {
  items: QuoteItem[];
  toastMessage: { text: string; type: 'ok' | 'warn' | 'success' | 'info' } | null;
  notificationDays: number;

  // Actions
  addItem: (prefill?: Partial<QuoteItem>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, field: keyof QuoteItem, value: any) => void;
  updateForm: (updates: Partial<QuotationFormState>) => void;
  setToast: (text: string, type?: 'ok' | 'warn' | 'success' | 'info') => void;
  clearToast: () => void;
  setNotificationDays: (days: number) => void;
  resetForm: () => void;
  fetchAndSetNextQuoteNumber: () => Promise<void>;
  loadSnapshot: (snapshot: Partial<QuotationFormState> & { items?: QuoteItem[] }) => void;
}

/**
 * Returns the Indian Financial Year code, e.g. "2627" for FY 2026-27 (Apr-Mar).
 */
function getLocalFyCode(): string {
  const today = new Date();
  const month = today.getMonth(); // 0-indexed, March = 2
  const year  = today.getFullYear();
  const fyStart = month < 3 ? year - 1 : year;
  const fyEnd   = fyStart + 1;
  return `${String(fyStart).slice(2)}${String(fyEnd).slice(2)}`;
}

const getInitialDefaults = (): QuotationFormState & { items: QuoteItem[] } => {
  const today = new Date();
  const plus30 = new Date(today.getTime() + 30 * 86400000);

  return {
    quoteNumber: `QUOKBN${getLocalFyCode()}-???`,
    quoteDate: today.toISOString().split('T')[0],
    validTill: plus30.toISOString().split('T')[0],
    quoteTitle: '',
    projectName: '',
    custRef: '',
    transport: 'By road / DTDC courier',
    companyLogo: null,
    authSignature: null,

    billName: '',
    billContact: '',
    billAddr: '',
    billPhone: '',
    billEmail: '',
    billState: '',
    billStateCode: '',

    sameAsBill: true,
    shipName: '',
    shipContact: '',
    shipAddr: '',
    shipPhone: '',
    shipEmail: '',
    shipState: '',
    shipStateCode: '',

    freightType: 'extra',
    freightAmt: 0,
    instType: 'extra',
    taxType: 'igst',

    payTerms: '100% Advance against PI',
    delivTime: '2-3 weeks',
    warranty: '1 year against manufacturing defects',
    warrantyStart: 'Date of delivery',

    items: [
      {
        id: String(Date.now()),
        description: '',
        hsn: '',
        qty: 1,
        rate: 0,
        tax: 18,
        photo: null,
      },
    ],
  };
};

export const useQuotationStore = create<QuotationStoreState>((set) => ({
  ...getInitialDefaults(),
  toastMessage: null,
  notificationDays: 3,

  addItem: (prefill) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          id: String(Date.now() + Math.random()),
          description: prefill?.description || '',
          hsn: prefill?.hsn || '',
          qty: prefill?.qty ?? 1,
          rate: prefill?.rate ?? 0,
          tax: prefill?.tax ?? 18,
          photo: prefill?.photo || null,
        },
      ],
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((it) => it.id !== id),
    })),

  updateItem: (id, field, value) =>
    set((state) => ({
      items: state.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    })),

  updateForm: (updates) =>
    set((state) => ({
      ...state,
      ...updates,
    })),

  setToast: (text, type = 'ok') => {
    set({ toastMessage: { text, type } });
    setTimeout(() => {
      set((state) => (state.toastMessage?.text === text ? { toastMessage: null } : state));
    }, 3500);
  },

  clearToast: () => set({ toastMessage: null }),

  setNotificationDays: (days) => set({ notificationDays: days }),

  resetForm: () => {
    set(() => ({ ...getInitialDefaults() }));
    // Fetch the real next number from backend after reset
    api.fetchNextQuoteNumber()
      .then((num) => set({ quoteNumber: num }))
      .catch(() => { /* keep the ??? placeholder if offline */ });
  },

  fetchAndSetNextQuoteNumber: async () => {
    try {
      const num = await api.fetchNextQuoteNumber();
      set({ quoteNumber: num });
    } catch {
      // silently keep existing placeholder
    }
  },

  loadSnapshot: (snapshot) =>
    set((state) => ({
      ...state,
      ...snapshot,
      items: snapshot.items?.length ? snapshot.items : state.items,
    })),
}));
