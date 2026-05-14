import { Archive, Download, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { useQuotationStore } from '../../store/quotationStore';
import { QuotationHistoryEntry } from '../../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
  const [historyList, setHistoryList] = useState<QuotationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { setToast, loadSnapshot } = useQuotationStore();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Fetch historical persistent list from database API backend
      const list = await api.getQuotationsHistory();
      setHistoryList(list);
    } catch {
      // Fallback gracefully to legacy browser history array for seamless presentation parity
      try {
        const raw = localStorage.getItem('kb_history') || '[]';
        setHistoryList(JSON.parse(raw));
      } catch {
        setHistoryList([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteQuotation(id);
      setHistoryList((prev) => prev.filter((it) => it.id !== id));
      setToast('Quotation permanently expunged.');
    } catch {
      // Fallback manual filter if stored in legacy browser storage
      const filtered = historyList.filter((it) => it.id !== id);
      setHistoryList(filtered);
      localStorage.setItem('kb_history', JSON.stringify(filtered));
      setToast('Removed from local archive.');
    }
  };

  const handleRestore = (entry: QuotationHistoryEntry) => {
    loadSnapshot(entry);
    setToast(`Restored Quotation ${entry.quoteNumber || ''} snapshot into visual workspace.`);
    onClose();
  };

  const handleDownloadPdf = async (entry: QuotationHistoryEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.generatePreviewPdf(entry);
      setToast('Generated native preview stream successfully.');
    } catch (error: any) {
      setToast(error.message || 'Failed to download binary PDF.', 'warn');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm transition-opacity animate-fadeIn" 
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 bg-brand-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-brand-200" />
            <div>
              <h2 className="font-extrabold text-base tracking-tight">Quotation History Archive</h2>
              <p className="text-[11px] text-brand-200">Persistent backend historical registry</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-brand-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#fbfdfb]">
          {loading ? (
            <div className="py-12 text-center text-xs font-semibold text-gray-400">
              Loading stored archives...
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-brand-50 text-brand-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Archive className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-600">No saved records found</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                Generate a preview print out and archive your active quotation parameters to populate historical registry.
              </p>
            </div>
          ) : (
            historyList.map((entry) => (
              <div 
                key={entry.id || entry.quoteNumber}
                onClick={() => handleRestore(entry)}
                className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-brand-900 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                      {entry.quoteNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {entry.quoteDate ? new Date(entry.quoteDate).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-gray-800 line-clamp-1">
                    {entry.billName || 'Unnamed Customer'}
                  </div>

                  {entry.billEmail && (
                    <div className="text-xs text-gray-500 font-sans">
                      {entry.billEmail}
                    </div>
                  )}

                  <div className="text-xs font-black text-brand-900 pt-1">
                    ₹{(entry.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex flex-col gap-1 items-end opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDownloadPdf(entry, e)}
                    title="Download Native High-Fidelity PDF"
                    className="p-2 rounded-lg bg-gray-50 hover:bg-brand-50 text-gray-600 hover:text-brand-900 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(entry.id, e)}
                    title="Expunge historical record"
                    className="p-2 rounded-lg bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
