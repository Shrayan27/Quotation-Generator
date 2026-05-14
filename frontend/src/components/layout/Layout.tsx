import { Bell, History, Save, Upload } from 'lucide-react';
import React from 'react';
import { useQuotationStore } from '../../store/quotationStore';

interface LayoutProps {
  children: React.ReactNode;
  onOpenTracker: () => void;
  onOpenHistory: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onOpenTracker, onOpenHistory }) => {
  const { toastMessage, setToast, loadSnapshot } = useQuotationStore();

  const handleSaveDraft = () => {
    const state = useQuotationStore.getState();
    const draft = {
      quoteNumber: state.quoteNumber,
      quoteDate: state.quoteDate,
      validTill: state.validTill,
      quoteTitle: state.quoteTitle,
      projectName: state.projectName,
      custRef: state.custRef,
      transport: state.transport,
      billName: state.billName,
      billContact: state.billContact,
      billAddr: state.billAddr,
      billPhone: state.billPhone,
      billEmail: state.billEmail,
      billState: state.billState,
      billStateCode: state.billStateCode,
      sameAsBill: state.sameAsBill,
      shipName: state.shipName,
      shipContact: state.shipContact,
      shipAddr: state.shipAddr,
      shipPhone: state.shipPhone,
      shipEmail: state.shipEmail,
      shipState: state.shipState,
      shipStateCode: state.shipStateCode,
      freightType: state.freightType,
      freightAmt: state.freightAmt,
      instType: state.instType,
      taxType: state.taxType,
      payTerms: state.payTerms,
      delivTime: state.delivTime,
      warranty: state.warranty,
      warrantyStart: state.warrantyStart,
      items: state.items,
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('kb_react_draft', JSON.stringify(draft));
      setToast('Quotation draft saved successfully to browser storage!');
    } catch {
      setToast('Failed to save draft. Storage quota limit reached.', 'warn');
    }
  };

  const handleLoadDraft = () => {
    try {
      const raw = localStorage.getItem('kb_react_draft');
      if (!raw) {
        setToast('No saved draft found in this browser.', 'warn');
        return;
      }
      const draft = JSON.parse(raw);
      loadSnapshot(draft);
      setToast(`Draft loaded (Saved at ${new Date(draft.savedAt).toLocaleTimeString()})`);
    } catch {
      setToast('Failed to load draft file.', 'warn');
    }
  };

  // Simple reactive unclosed notification badge counter logic mapping localStorage directly or simple checks
  const getPendingNotifsCount = () => {
    try {
      const raw = localStorage.getItem('kb_notifications') || '[]';
      const arr = JSON.parse(raw);
      return arr.filter((n: any) => n.status === 'pending').length;
    } catch {
      return 0;
    }
  };

  const badgeCount = getPendingNotifsCount();

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f4]">
      {/* Absolute Toast display overlay */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all animate-bounce">
          <div
            className={`px-5 py-3 rounded-xl shadow-glass border font-bold text-sm backdrop-blur-md flex items-center gap-2 ${
              toastMessage.type === 'warn'
                ? 'bg-amber-500/90 border-amber-400 text-white'
                : 'bg-brand-900/95 border-brand-700 text-white'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Premium Custom Navbar */}
      <header className="sticky top-0 z-40 bg-brand-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-brand-900 font-black text-lg flex items-center justify-center shadow-inner tracking-tight">
              KB
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg tracking-tight leading-tight">
                Kuchhal Brothers <span className="font-normal text-brand-200">| Sensormart</span>
              </div>
              <div className="text-[10px] sm:text-xs text-brand-300 font-medium tracking-wide">
                Industrial Quotation Engine SaaS &nbsp;&middot;&nbsp; Roorkee, UK
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={onOpenTracker}
              title="Follow-up Notification Tracker"
              className="relative p-2 rounded-lg bg-brand-800 hover:bg-brand-700 transition-colors text-brand-100"
            >
              <Bell className="w-5 h-5" />
              {badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-sm animate-pulse">
                  {badgeCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenHistory}
              title="Saved Quotations Archive"
              className="p-2 rounded-lg bg-brand-800 hover:bg-brand-700 transition-colors text-brand-100"
            >
              <History className="w-5 h-5" />
            </button>

            <div className="h-5 w-[1px] bg-brand-700 mx-0.5 sm:mx-1 hidden sm:block"></div>

            <button
              onClick={handleSaveDraft}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-800 hover:bg-brand-700 text-xs font-semibold text-brand-100 transition-colors border border-brand-700"
            >
              <Save className="w-3.5 h-3.5" /> Save Draft
            </button>

            <button
              onClick={handleLoadDraft}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors border border-white/10"
            >
              <Upload className="w-3.5 h-3.5" /> Load Draft
            </button>
          </div>
        </div>
      </header>

      {/* Main Dynamic Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Clean Bottom Credential Footer */}
      <footer className="bg-white border-t border-gray-200 text-center py-4 text-xs font-medium text-gray-500 shadow-inner">
        Kuchhal Brothers &copy; {new Date().getFullYear()} &nbsp;&middot;&nbsp; 982/1M, 983M Salempur Rajputana Industrial Area, Roorkee-247667
      </footer>
    </div>
  );
};
