import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  X,
  AlertCircle,
  Coins,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import Button from '../common/Button';

export const DeliveryOtpModal = ({ order, isOpen, onClose, onConfirmDelivery }) => {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEnteredOtp('');
      setPaymentMethod(order?.paymentMethod === 'ONLINE' ? 'UPI' : 'COD');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanOtp = enteredOtp.trim();

    if (cleanOtp.length !== 4) {
      setError('Please enter the complete 4-digit OTP.');
      return;
    }

    if (!paymentMethod) {
      setError('Please select the payment method (COD or UPI).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onConfirmDelivery(order.id, cleanOtp, order.total, paymentMethod);
      onClose();
    } catch (err) {
      setError(err?.message || 'Invalid Delivery OTP. Please double-check with the patient and re-enter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-forest-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative bg-surface-pure rounded-3xl max-w-sm w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
          <div>
            <h3 className="font-heading font-bold text-base text-forest-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-700" />
              <span>Verify Patient Delivery</span>
            </h3>
            <p className="text-xs text-brandText-secondary mt-0.5">
              Customer: <strong>{order.customerName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-forest-50 text-brandText-muted hover:text-forest-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Collection Method Selector (COD or UPI) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-forest-900">Payment Collection Method</span>
            <span className="font-mono font-extrabold text-forest-900 text-sm">
              ₹{Number(order.total || 0).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('COD')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                paymentMethod === 'COD'
                  ? 'border-forest-700 bg-forest-800 text-white shadow-xs'
                  : 'border-brandBorder-subtle bg-surface-warm/60 text-forest-900 hover:bg-forest-50'
              }`}
            >
              <Coins className={`w-4 h-4 ${paymentMethod === 'COD' ? 'text-amber-300' : 'text-amber-700'}`} />
              <span>Cash (COD)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('UPI')}
              className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                paymentMethod === 'UPI'
                  ? 'border-forest-700 bg-forest-800 text-white shadow-xs'
                  : 'border-brandBorder-subtle bg-surface-warm/60 text-forest-900 hover:bg-forest-50'
              }`}
            >
              <QrCode className={`w-4 h-4 ${paymentMethod === 'UPI' ? 'text-emerald-300' : 'text-emerald-700'}`} />
              <span>UPI / QR</span>
            </button>
          </div>

          <div
            className={`p-2.5 rounded-xl text-[11px] font-semibold border ${
              paymentMethod === 'COD'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            {paymentMethod === 'COD' ? (
              <span>
                💵 Collect <strong>₹{Number(order.total || 0).toFixed(2)}</strong> in physical cash from patient at doorstep.
              </span>
            ) : (
              <span>
                📲 Confirm digital payment of <strong>₹{Number(order.total || 0).toFixed(2)}</strong> received via UPI QR scan.
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-forest-800 block text-center">
              Enter 4-Digit Delivery OTP from Patient
            </label>
            <input
              type="text"
              required
              maxLength={4}
              placeholder="• • • •"
              value={enteredOtp}
              onChange={(e) => {
                setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''));
                setError('');
              }}
              autoFocus
              className="w-full mt-2 px-3 py-3 border border-brandBorder-subtle rounded-2xl text-center text-2xl font-mono font-extrabold tracking-widest bg-surface-warm focus:outline-none focus:border-forest-500"
            />
            <p className="text-[11px] text-brandText-muted text-center mt-1">
              Sent via SMS to patient's registered mobile number
            </p>
          </div>

          {/* Secure Error Display (Never exposes original OTP) */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-900 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Incorrect Code</p>
                <p className="text-rose-700">{error}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-brandBorder-subtle">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={enteredOtp.length !== 4 || isSubmitting}
              className="text-xs bg-emerald-700 hover:bg-emerald-800 px-5 font-bold shadow-md"
            >
              {isSubmitting ? 'Verifying...' : 'Confirm Delivery'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryOtpModal;
