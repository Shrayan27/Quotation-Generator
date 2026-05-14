import { Bell, CheckCircle, Clock, Settings, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useQuotationStore } from '../../store/quotationStore';

interface TrackerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FollowUpNotification {
  id: number;
  custName: string;
  custEmail: string;
  quoteNo: string;
  quoteDate: string;
  dueDate: string;
  status: 'pending' | 'replied';
}

export const TrackerPanel: React.FC<TrackerPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<FollowUpNotification[]>([]);
  const { notificationDays, setNotificationDays, setToast } = useQuotationStore();

  const loadNotifications = () => {
    try {
      const raw = localStorage.getItem('kb_notifications') || '[]';
      setNotifications(JSON.parse(raw));
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      // Load current days threshold setting
      try {
        const settingsRaw = localStorage.getItem('kb_settings');
        if (settingsRaw) {
          const s = JSON.parse(settingsRaw);
          if (s && s.notifDays) setNotificationDays(s.notifDays);
        }
      } catch {
        // use default
      }
    }
  }, [isOpen]);

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 3;
    setNotificationDays(val);
    try {
      localStorage.setItem('kb_settings', JSON.stringify({ notifDays: val }));
      setToast(`Follow-up period threshold adjusted to ${val} days.`);
    } catch {
      // quota full
    }
  };

  const handleMarkReplied = (id: number) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, status: 'replied' as const } : n
    );
    setNotifications(updated);
    try {
      localStorage.setItem('kb_notifications', JSON.stringify(updated));
      setToast('Follow-up alert acknowledged.');
    } catch {
      // ignore
    }
  };

  const handleDelete = (id: number) => {
    const filtered = notifications.filter((n) => n.id !== id);
    setNotifications(filtered);
    try {
      localStorage.setItem('kb_notifications', JSON.stringify(filtered));
      setToast('Expunged follow-up alert entry.');
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const now = Date.now();

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
            <Bell className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-extrabold text-base tracking-tight">Follow-up Tracker Dashboard</h2>
              <p className="text-[11px] text-brand-200">Local notification schedule parameters</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-brand-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Days threshold configuration row */}
        <div className="px-6 py-3 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900">
            <Settings className="w-3.5 h-3.5" />
            <span>Threshold Days Config:</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="30"
              value={notificationDays}
              onChange={handleDaysChange}
              className="w-14 px-2 py-1 bg-white border border-brand-200 rounded-lg text-xs font-black text-brand-900 text-center focus:outline-none focus:border-brand-500"
            />
            <span className="text-[11px] font-semibold text-gray-500">days</span>
          </div>
        </div>

        {/* List content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#fbfdfb]">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-600">No active follow-up alarms</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                Whenever you save a commercial quotation snapshot, an automatic notification alarm registers here.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const dueTimestamp = new Date(n.dueDate).getTime();
              const isOverdue = now > dueTimestamp && n.status === 'pending';
              const diffDays = Math.ceil(Math.abs(dueTimestamp - now) / 86400000);

              return (
                <div 
                  key={n.id}
                  className={`p-4 rounded-xl border transition-all ${
                    n.status === 'replied'
                      ? 'bg-gray-50/80 border-gray-200 opacity-60'
                      : isOverdue
                      ? 'bg-rose-50/50 border-rose-200 shadow-sm'
                      : 'bg-white border-brand-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-sm text-gray-900 line-clamp-1">
                        {n.custName || 'Valued Customer'}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-brand-900 mt-0.5">
                        {n.quoteNo}
                      </div>
                    </div>

                    <span 
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                        n.status === 'replied'
                          ? 'bg-gray-200 text-gray-600'
                          : isOverdue
                          ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {n.status === 'replied' ? (
                        <>Replied ✓</>
                      ) : isOverdue ? (
                        <>Overdue by {diffDays}d</>
                      ) : (
                        <>Due in {diffDays}d</>
                      )}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 font-sans space-y-0.5 mb-3">
                    {n.custEmail && <div>{n.custEmail}</div>}
                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Sent: {new Date(n.quoteDate).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100/80">
                    {n.status === 'pending' && (
                      <button
                        onClick={() => handleMarkReplied(n.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center gap-1 transition-colors border border-emerald-200"
                      >
                        <CheckCircle className="w-3 h-3" /> Mark Replied
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove Tracker item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
