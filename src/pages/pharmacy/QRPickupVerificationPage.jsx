import React, { useState } from 'react';
import {
  QrCode,
  Scan,
  CheckCircle,
  AlertCircle,
  Bike,
  PackageCheck,
  User,
  ArrowRight,
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const QRPickupVerificationPage = () => {
  const { orders, verifyPickup } = useWorkspaceStore();
  const { addToast } = useToast();

  const [inputCode, setInputCode] = useState('');
  const [lastHandover, setLastHandover] = useState(null);

  // Orders waiting for pickup
  const waitingPickupOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP');

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    try {
      // Find matching order
      const targetOrder = orders.find(
        (o) =>
          o.pickupQrCode.toLowerCase() === inputCode.trim().toLowerCase() ||
          o.id.toLowerCase() === inputCode.trim().toLowerCase()
      );

      if (!targetOrder) {
        throw new Error('No matching order found for this QR / verification code.');
      }

      verifyPickup(targetOrder.id, targetOrder.pickupQrCode);
      setLastHandover(targetOrder);
      setInputCode('');
      addToast(`Order ${targetOrder.id} successfully handed over to ${targetOrder.assignedRider?.name || 'Rider'}!`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleQuickVerify = (order) => {
    try {
      verifyPickup(order.id, order.pickupQrCode);
      setLastHandover(order);
      addToast(`Handover verified for Order ${order.id}!`, 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Rider Pickup Handover Verification
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Scan the rider's digital pickup token or enter the 4-segment security code to release package.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side (7 Cols): Scanner Input & Simulation */}
        <div className="lg:col-span-7 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-forest-900">
                Security QR / Token Scanner
              </h2>
              <p className="text-xs text-brandText-secondary">
                Matches tamper-proof sealed bag with authenticated rider dispatch
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-forest-800">
                Enter or Scan Pickup Code (e.g. PICKUP-89214-SEC5)
              </label>
              <div className="relative mt-1">
                <QrCode className="w-5 h-5 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Scan QR or type code..."
                  className="w-full pl-11 pr-4 py-3 text-sm font-mono font-bold bg-surface-warm border border-brandBorder-subtle rounded-2xl focus:outline-none focus:border-forest-500 uppercase"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              leftIcon={PackageCheck}
              className="w-full text-xs font-bold py-3 shadow-md"
            >
              Verify Code & Handover Package
            </Button>
          </form>

          {/* Last Handover Banner */}
          {lastHandover && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2 animate-scale-up">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Handover Successfully Completed!</span>
              </div>
              <p>
                Order <strong className="font-mono">{lastHandover.id}</strong> has been released to{' '}
                <strong>{lastHandover.assignedRider?.name || 'Rider'}</strong>.
              </p>
              <p className="text-[11px] text-emerald-800">
                Order status is now: <strong className="uppercase">Out for Delivery</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Right Side (5 Cols): Orders Staged for Pickup */}
        <div className="lg:col-span-5 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-forest-900">
              Awaiting Handover ({waitingPickupOrders.length})
            </h3>
            <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded">
              Ready on Counter
            </span>
          </div>

          <div className="divide-y divide-brandBorder-subtle max-h-96 overflow-y-auto">
            {waitingPickupOrders.map((order) => (
              <div key={order.id} className="py-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-forest-900">{order.id}</span>
                  <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                    {order.pickupQrCode}
                  </span>
                </div>
                <div className="text-xs">
                  <p className="font-bold text-forest-800">To: {order.customerName}</p>
                  <p className="text-[11px] text-brandText-secondary">{order.area}</p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-brandText-secondary">
                    <Bike className="w-3.5 h-3.5 text-forest-600" />
                    <span>{order.assignedRider?.name || 'Rahul Das'}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickVerify(order)}
                    className="text-[11px] py-1 px-3"
                  >
                    Quick Verify
                  </Button>
                </div>
              </div>
            ))}
            {waitingPickupOrders.length === 0 && (
              <div className="py-8 text-center text-xs text-brandText-muted">
                No orders waiting for pickup right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPickupVerificationPage;
