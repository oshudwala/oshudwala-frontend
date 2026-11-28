import React, { useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useBrowserNotifications } from '../../hooks/useBrowserNotifications';

const DISMISS_KEY = 'oshud_notif_prompt_dismissed';

export const NotificationPermissionBanner = () => {
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const { permission, requestPermission, isSupported } = useBrowserNotifications();

  const [isDismissed, setIsDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === 'true'
  );

  // Hook still runs in background even when banner is hidden
  if (!isAuthenticated || !isSupported || permission !== 'default' || isDismissed) {
    return null;
  }

  const handleEnable = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      addToast('Notifications enabled! You will now receive live order & health alerts.', 'success');
    } else if (result === 'denied') {
      addToast('Notifications blocked. You can enable them anytime from browser site settings.', 'info');
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true');
    setIsDismissed(true);
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-fade-in">
      <div className="bg-forest-900 text-white rounded-2xl shadow-floating border border-forest-700/80 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center flex-shrink-0">
          <BellRing className="w-5 h-5 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-heading font-extrabold text-white">
              Enable Live Notifications
            </h4>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-forest-300 hover:text-white p-0.5 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-forest-200 mt-1 leading-relaxed">
            Get instant alerts for medicine delivery, rider arrival, prescription approval, and appointments.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleEnable}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-forest-950 text-xs font-extrabold transition-colors shadow-sm cursor-pointer"
            >
              Allow Notifications
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-forest-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;