import { CheckCircle2, Copy, Loader2, Send, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../../api';
import { useQuotationStore } from '../../store/quotationStore';

export const AiAssistant: React.FC = () => {
  const [productQuery, setProductQuery] = useState('');
  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  
  const [emailSubjectState, setEmailSubjectState] = useState('');
  const [emailBodyState, setEmailBodyState] = useState('');
  const [showEmailDraft, setShowEmailDraft] = useState(false);

  const { items, addItem, updateItem, setToast } = useQuotationStore();

  const handleSuggestSpecs = async () => {
    if (!productQuery.trim()) {
      setToast('Please enter an industrial product or sensor name first.', 'warn');
      return;
    }

    setLoadingSpecs(true);
    try {
      const suggestion = await api.suggestSpecs(productQuery);

      // Find if last item is blank, otherwise insert fresh row
      const lastItem = items[items.length - 1];
      const isBlank = lastItem && !lastItem.description.trim();

      const combinedDescription = `${suggestion.description}\n${suggestion.specifications}`;

      if (isBlank && lastItem) {
        updateItem(lastItem.id, 'description', combinedDescription);
        updateItem(lastItem.id, 'hsn', suggestion.hsn_code);
        updateItem(lastItem.id, 'tax', suggestion.tax_rate);
      } else {
        addItem({
          description: combinedDescription,
          hsn: suggestion.hsn_code,
          tax: suggestion.tax_rate,
        });
      }

      setToast(`Successfully parsed technical specs for "${productQuery}"`);
      setProductQuery('');
    } catch (error: any) {
      setToast(error.message || 'Error populating AI sensor parameters.', 'warn');
    } finally {
      setLoadingSpecs(false);
    }
  };

  const handleDraftEmail = async () => {
    const state = useQuotationStore.getState();

    // Compile active context
    const summary = state.items
      .map((it, idx) => {
        const title = it.description.split('\n')[0] || 'Sensor Item';
        return `${idx + 1}. ${title} (Qty: ${it.qty})`;
      })
      .join('\n');

    // Subtotal calculation
    let total = 0;
    state.items.forEach((it) => {
      const amt = it.qty * it.rate;
      total += amt + amt * (it.tax / 100);
    });

    // Freight charge label for email context
    const freightAmt = parseFloat(String(state.freightAmt || 0));
    const freightCharge =
      state.freightType === 'extra'
        ? 'Extra (charged at actuals)'
        : state.freightType === 'custom'
        ? `₹${freightAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (included in total)`
        : 'Included in price';

    setLoadingEmail(true);
    try {
      const draft = await api.draftEmail({
        quoteNo: state.quoteNumber || 'Preview',
        custName: state.billName || 'Valued Customer',
        productSummary: summary || 'Industrial Automation Products',
        totalAmount: `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        validTill: state.validTill,
        payTerms: state.payTerms,
        delivTime: state.delivTime,
        warranty: state.warranty,
        freightCharge: freightCharge,
      });

      setEmailSubjectState(draft.subject);
      setEmailBodyState(draft.body);
      setShowEmailDraft(true);
      setToast('Professional email draft constructed successfully!');
    } catch (error: any) {
      setToast(error.message || 'Error constructing email draft.', 'warn');
    } finally {
      setLoadingEmail(false);
    }
  };

  const openMailClient = () => {
    const state = useQuotationStore.getState();
    const to = state.billEmail || '';
    const subject = encodeURIComponent(emailSubjectState);
    const body = encodeURIComponent(emailBodyState);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const copyBodyToClipboard = () => {
    navigator.clipboard.writeText(emailBodyState);
    setToast('Email body copied to your clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* 1. Intelligent Spec Synthesis Strip */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-900 to-brand-800 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <h3 className="font-extrabold text-sm tracking-wide text-white uppercase">
            AI Specification Engine
          </h3>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
            Anthropic Proxy
          </span>
        </div>

        <p className="text-xs text-brand-200 mb-4 leading-relaxed max-w-xl">
          Instantly generate technical ranges, Modbus mapping, accuracy tolerances, and valid GST HSN numbers simply by typing standard industrial instruments.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSuggestSpecs()}
              placeholder="e.g. Ultrasonic Water Level Transmitter RS485"
              className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-brand-950/60 border border-brand-700 placeholder-brand-400 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-transparent transition-all"
            />
            {loadingSpecs ? (
              <Loader2 className="absolute right-3 top-3 w-4 h-4 text-amber-400 animate-spin" />
            ) : (
              <Sparkles className="absolute right-3 top-3 w-4 h-4 text-brand-400 pointer-events-none" />
            )}
          </div>

          <button
            onClick={handleSuggestSpecs}
            disabled={loadingSpecs}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-brand-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {loadingSpecs ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-brand-950" /> AI Autocomplete
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Professional B2B Email Drafter */}
      <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-800">Smart B2B Follow-up Drafter</h3>
          </div>

          <button
            onClick={handleDraftEmail}
            disabled={loadingEmail}
            className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {loadingEmail ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Drafting...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-brand-700" /> Construct Draft
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Analyzes your current item lines, total calculation metrics, and active commercial warranty terms to generate an executive customer presentation cover letter.
        </p>

        {showEmailDraft && (
          <div className="space-y-3 pt-3 border-t border-gray-100 animate-fadeIn">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={emailSubjectState}
                onChange={(e) => setEmailSubjectState(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                Email Body Text
              </label>
              <textarea
                rows={6}
                value={emailBodyState}
                onChange={(e) => setEmailBodyState(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-800 focus:outline-none focus:bg-white leading-relaxed font-sans resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={copyBodyToClipboard}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Body
              </button>

              <button
                onClick={openMailClient}
                className="px-3 py-1.5 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Open in Mail App
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
