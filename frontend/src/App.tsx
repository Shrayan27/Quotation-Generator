import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { HistoryPanel } from './components/quotation/HistoryPanel';
import { TrackerPanel } from './components/quotation/TrackerPanel';
import { QuotationEditor } from './pages/QuotationEditor';

export const App: React.FC = () => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);

  return (
    <>
      <Layout 
        onOpenTracker={() => setTrackerOpen(true)} 
        onOpenHistory={() => setHistoryOpen(true)}
      >
        <QuotationEditor />
      </Layout>

      {/* Side-over Drawer Overlays */}
      <HistoryPanel isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      <TrackerPanel isOpen={trackerOpen} onClose={() => setTrackerOpen(false)} />
    </>
  );
};

export default App;
