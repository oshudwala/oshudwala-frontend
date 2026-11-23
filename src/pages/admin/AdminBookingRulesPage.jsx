import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Save,
  CheckCircle2,
  DollarSign,
  Users,
  BellRing,
  HelpCircle
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import adminApi from '../../services/api/admin.api';

export const AdminBookingRulesPage = () => {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Booking appointment rules state
  const [rules, setRules] = useState({
    // Advance booking
    advanceBookingDays: 14,
    minAdvanceHours: 2,
    
    // Cancellation & Refund
    cancellationCutoffHours: 4,
    refundPercentBeforeCutoff: 100,
    refundPercentAfterCutoff: 0,
    allowPatientCancellation: true,

    // Fees & Payments
    convenienceFeeRupees: 0,
    paymentModeAllowed: 'BOTH', // 'ONLINE', 'OFFLINE', 'BOTH'

    // Queue & Token generation
    maxTokensPerHour: 8,
    averageConsultationMins: 10,
    walkinBufferPercent: 20,
    notifyTokensAhead: 3,

    // Rescheduling & No-shows
    maxRescheduleAttempts: 1,
    noShowReleaseMins: 15,
  });

  // Load rules from backend settings
  const loadRules = async () => {
    setIsLoading(true);
    try {
      const settings = await adminApi.getSettings();
      const saved = settings?.find?.((s) => s.key === 'appointment_booking_rules')?.value;
      if (saved && typeof saved === 'object') {
        setRules((prev) => ({ ...prev, ...saved }));
      } else {
        const local = localStorage.getItem('oshud_booking_rules');
        if (local) setRules((prev) => ({ ...prev, ...JSON.parse(local) }));
      }
    } catch (err) {
      console.warn('Backend load booking rules notice:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleInputChange = (field, value) => {
    setRules((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminApi.setSetting('appointment_booking_rules', rules);
      localStorage.setItem('oshud_booking_rules', JSON.stringify(rules));
      addToast('Patient appointment booking rules updated and active across platform!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save booking rules.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Patient Appointment Booking Rules
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Configure advance booking window, cancellation cutoff, queue token limits, and refund policies for patient consultations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={Save}
          className="text-xs font-bold shadow-card px-5"
        >
          Save All Rules
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Advance Booking Window */}
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-brandBorder-subtle">
            <div className="w-10 h-10 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-bold text-forest-900">
                1. Advance Booking Timeline
              </h2>
              <p className="text-xs text-brandText-secondary">
                Set how far in advance patients can reserve consultation slots.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Maximum Advance Booking Window (Days)
              </label>
              <select
                value={rules.advanceBookingDays}
                onChange={(e) => handleInputChange('advanceBookingDays', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
              >
                <option value={3}>3 Days in advance</option>
                <option value={7}>7 Days (1 Week) in advance</option>
                <option value={14}>14 Days (2 Weeks) in advance</option>
                <option value={30}>30 Days (1 Month) in advance</option>
              </select>
              <p className="text-[11px] text-brandText-muted mt-1">
                Slots further than this window will appear locked for patients.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Minimum Advance Booking Cutoff (Hours)
              </label>
              <select
                value={rules.minAdvanceHours}
                onChange={(e) => handleInputChange('minAdvanceHours', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
              >
                <option value={1}>1 Hour before shift starts</option>
                <option value={2}>2 Hours before shift starts</option>
                <option value={4}>4 Hours before shift starts</option>
              </select>
              <p className="text-[11px] text-brandText-muted mt-1">
                Prevents last-minute bookings when doctor might already be in transit.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Cancellation & Refund Policy */}
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-brandBorder-subtle">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-bold text-forest-900">
                2. Patient Cancellation & Refund Policy
              </h2>
              <p className="text-xs text-brandText-secondary">
                Control patient self-cancellation deadlines and wallet/payment refunds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Cancellation Deadline Before Slot
              </label>
              <select
                value={rules.cancellationCutoffHours}
                onChange={(e) => handleInputChange('cancellationCutoffHours', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
              >
                <option value={2}>2 Hours before slot</option>
                <option value={4}>4 Hours before slot</option>
                <option value={12}>12 Hours before slot</option>
                <option value={24}>24 Hours before slot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Refund % (Before Deadline)
              </label>
              <select
                value={rules.refundPercentBeforeCutoff}
                onChange={(e) => handleInputChange('refundPercentBeforeCutoff', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
              >
                <option value={100}>100% Full Refund</option>
                <option value={90}>90% Refund (10% admin charge)</option>
                <option value={80}>80% Refund (20% admin charge)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Refund % (After Deadline / Late)
              </label>
              <select
                value={rules.refundPercentAfterCutoff}
                onChange={(e) => handleInputChange('refundPercentAfterCutoff', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
              >
                <option value={0}>0% No Refund (Late cancellation)</option>
                <option value={50}>50% Partial Refund</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs font-bold text-forest-900 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.allowPatientCancellation}
                onChange={(e) => handleInputChange('allowPatientCancellation', e.target.checked)}
                className="w-4 h-4 rounded text-forest-700"
              />
              <span>Allow patients to self-cancel appointments from their Profile/Appointments page</span>
            </label>
          </div>
        </div>

        {/* Section 3: Live Queue & Chamber Token Rules */}
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-brandBorder-subtle">
            <div className="w-10 h-10 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-bold text-forest-900">
                3. Live Queue & Chamber Token Allocation
              </h2>
              <p className="text-xs text-brandText-secondary">
                Regulate patient token pacing, chamber capacity, and automated queue SMS/WhatsApp alerts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Max Online Tokens / Hour
              </label>
              <input
                type="number"
                min={2}
                max={20}
                value={rules.maxTokensPerHour}
                onChange={(e) => handleInputChange('maxTokensPerHour', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold"
              />
              <p className="text-[10px] text-brandText-muted mt-1">e.g. 8 tokens per hour = ~7.5 mins per patient</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Walk-in / Emergency Reservation (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={rules.walkinBufferPercent}
                onChange={(e) => handleInputChange('walkinBufferPercent', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold"
              />
              <p className="text-[10px] text-brandText-muted mt-1">Chamber slots held for clinic walk-in patients</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Notify Patient When Ahead
              </label>
              <select
                value={rules.notifyTokensAhead}
                onChange={(e) => handleInputChange('notifyTokensAhead', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold"
              >
                <option value={2}>2 Tokens Ahead ("Please reach clinic")</option>
                <option value={3}>3 Tokens Ahead ("Your turn approaching")</option>
                <option value={4}>4 Tokens Ahead</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Fees & Platform Convenience Charges */}
        <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-brandBorder-subtle">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-heading font-bold text-forest-900">
                4. Fees & Payment Options
              </h2>
              <p className="text-xs text-brandText-secondary">
                Convenience fee charged on booking appointments and allowed payment channels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Patient Platform Convenience Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={rules.convenienceFeeRupees}
                onChange={(e) => handleInputChange('convenienceFeeRupees', Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold"
              />
              <p className="text-[10px] text-brandText-muted mt-1">₹0 = Free booking for patients; or enter platform charge</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">
                Permitted Payment Mode
              </label>
              <select
                value={rules.paymentModeAllowed}
                onChange={(e) => handleInputChange('paymentModeAllowed', e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold"
              >
                <option value="BOTH">Online Payment OR Pay at Clinic Front Desk</option>
                <option value="ONLINE">Strictly Pre-Paid (Online Only)</option>
                <option value="OFFLINE">Pay at Clinic Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-brandBorder-subtle">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={Save}
            className="font-bold shadow-card px-8 text-xs"
          >
            Apply & Save Booking Rules
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminBookingRulesPage;