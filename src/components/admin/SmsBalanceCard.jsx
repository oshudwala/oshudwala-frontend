import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  WifiOff,
} from 'lucide-react';
import { smsApi } from '../../services/api/sms.api';
import { useToast } from '../../context/ToastContext';

const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '—';
  }
  const formatted = Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === 'INR' ? `₹${formatted}` : `${currency} ${formatted}`;
};

export const SmsBalanceCard = ({ className = '' }) => {
  const { addToast } = useToast();

  const [balanceData, setBalanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastChecked, setLastChecked] = useState(null);

  const fetchBalance = useCallback(
    async (manual = false) => {
      if (manual) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      try {
        const data = await smsApi.getBalance();
        setBalanceData(data);
        setLastChecked(new Date());
        if (manual) {
          addToast('APITxT SMS balance refreshed!', 'success');
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Unable to fetch SMS balance';
        setError(msg);
        if (manual) {
          addToast(msg, 'error');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    fetchBalance(false);
  }, [fetchBalance]);

  const numericBalance =
    balanceData?.balance !== null && balanceData?.balance !== undefined
      ? Number(balanceData.balance)
      : null;

  const isCritical = numericBalance !== null && numericBalance < 50;
  const isLow = numericBalance !== null && numericBalance >= 50 && numericBalance < 200;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-surface-pure p-5 sm:p-6 shadow-card transition-all ${
        isCritical
          ? 'border-rose-300'
          : isLow
          ? 'border-amber-300'
          : 'border-brandBorder-subtle'
      } ${className}`}
    >
      {/* Top Row: Title + Provider Badge + Refresh Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
              isCritical
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : isLow
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-forest-50 text-forest-700 border-forest-100'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-forest-950">
                SMS Gateway Balance
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-forest-50 text-forest-700 border border-forest-200/80">
                {balanceData?.provider || 'APITXT'}
              </span>
            </div>
            <p className="text-[11px] text-brandText-secondary mt-0.5">
              Live OTP &amp; transactional SMS wallet balance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchBalance(true)}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-warm hover:bg-forest-50 text-forest-800 border border-brandBorder-subtle hover:border-forest-300 text-xs font-bold transition-all disabled:opacity-60 cursor-pointer"
          title="Check live balance"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading || isRefreshing ? 'animate-spin' : ''}`}
          />
          <span className="hidden xs:inline">Refresh</span>
        </button>
      </div>

      {/* Main Balance Display */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          {isLoading ? (
            <div className="h-9 w-36 rounded-xl bg-surface-warm animate-pulse" />
          ) : error ? (
            <div className="flex items-center gap-2 text-rose-600">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-bold">{error}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-heading font-extrabold tracking-tight font-mono ${
                  isCritical
                    ? 'text-rose-700'
                    : isLow
                    ? 'text-amber-700'
                    : 'text-forest-950'
                }`}
              >
                {formatCurrency(numericBalance, balanceData?.currency)}
              </span>
              <span className="text-[11px] font-bold uppercase text-brandText-muted">
                {balanceData?.currency || 'INR'}
              </span>
            </div>
          )}
        </div>

        {/* Status Pill */}
        {!isLoading && !error && (
          <div>
            {isCritical ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold border border-rose-200 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Critical — Recharge Now</span>
              </span>
            ) : isLow ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low Balance</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Healthy &amp; Active</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Timestamp */}
      <div className="mt-4 pt-3 border-t border-brandBorder-subtle/70 flex items-center justify-between text-[11px] text-brandText-muted">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {lastChecked
            ? `Last checked at ${lastChecked.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}`
            : 'Checking live balance...'}
        </span>
        <span className="font-mono text-[10px]">GET /sms/balance</span>
      </div>
    </div>
  );
};

export default SmsBalanceCard;