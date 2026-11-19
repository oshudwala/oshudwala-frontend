import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  ShoppingBag,
  QrCode,
  Layers,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Bike,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const PharmacyOverview = () => {
  const { user } = useAuth();
  const { orders, prescriptions, inventory, updateOrderStatus } = useWorkspaceStore();
  const { addToast } = useToast();
  const [storeStatus, setStoreStatus] = useState('OPEN'); // OPEN | BUSY | CLOSED

  const myOrders = orders;
  const pendingRx = prescriptions.filter((p) => p.status === 'PENDING_VERIFICATION');
  const preparingOrders = myOrders.filter((o) => o.status === 'PREPARING');
  const readyPickupOrders = myOrders.filter((o) => o.status === 'READY_FOR_PICKUP');
  const expiringStock = inventory.filter((i) => i.status === 'EXPIRING_SOON');

  return (
    <div className="space-y-6">
      {/* Top Banner / Pharmacy Info & Status */}
      <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 flex-shrink-0 shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-900">
                MedPlus Pharmacy — Sector V
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                {storeStatus}
              </span>
            </div>
            <p className="text-xs text-forest-700 font-semibold mt-0.5">
              License: WB-BIO-2023-9942 &bull; Salt Lake Sector V, Kolkata
            </p>
            <p className="text-[11px] text-brandText-secondary mt-0.5">
              Pharmacist on Duty: <strong>{user?.name || 'Subhash Bose (Reg. Pharmacist)'}</strong>
            </p>
          </div>
        </div>

        {/* Operating Status Selector */}
        <div className="flex items-center gap-2 bg-surface-warm p-1.5 rounded-2xl border border-brandBorder-subtle">
          <button
            onClick={() => {
              setStoreStatus('OPEN');
              addToast('Pharmacy store status set to Open for express deliveries', 'success');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              storeStatus === 'OPEN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-emerald-700'
            }`}
          >
            Open for Delivery
          </button>
          <button
            onClick={() => {
              setStoreStatus('BUSY');
              addToast('Pharmacy status set to High Volume / Busy', 'warning');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              storeStatus === 'BUSY'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-amber-700'
            }`}
          >
            High Volume
          </button>
          <button
            onClick={() => {
              setStoreStatus('CLOSED');
              addToast('Pharmacy closed for offline orders', 'info');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              storeStatus === 'CLOSED'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'text-brandText-secondary hover:text-rose-700'
            }`}
          >
            Closed
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Prescriptions to Audit"
          value={pendingRx.length}
          change="Schedule H / H1"
          trend="neutral"
          caption="awaiting approval"
          icon={FileText}
          colorScheme="rose"
        />
        <MetricCard
          title="Orders In Packing"
          value={preparingOrders.length}
          change="In Dispensation"
          trend="up"
          caption="assembly queue"
          icon={ShoppingBag}
          colorScheme="blue"
        />
        <MetricCard
          title="Ready for Rider Pickup"
          value={readyPickupOrders.length}
          change="Awaiting Rider Handover"
          trend="neutral"
          caption="packed & sealed"
          icon={QrCode}
          colorScheme="emerald"
        />
        <MetricCard
          title="Batches Expiring Soon"
          value={expiringStock.length}
          change="< 30 days"
          trend="down"
          caption="requires audit"
          icon={AlertTriangle}
          colorScheme="amber"
        />
      </div>

      {/* 2-Column Working Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Orders Packing & Handover Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-extrabold text-base text-forest-900">
                  Orders Requiring Fulfillment
                </h2>
                <p className="text-xs text-brandText-secondary">
                  Dispense, pack with tamper-proof seal, and generate pickup QR code
                </p>
              </div>
              <Link
                to="/pharmacy/orders"
                className="text-xs font-bold text-forest-700 hover:underline flex items-center gap-1"
              >
                <span>Full Orders Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-brandBorder-subtle">
              {myOrders
                .filter((o) => ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status))
                .map((order) => (
                  <div
                    key={order.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-forest-900">
                          {order.id}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs font-bold text-forest-900">{order.customerName}</p>
                      <p className="text-[11px] text-brandText-secondary">
                        {order.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {order.status === 'PREPARING' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            updateOrderStatus(order.id, 'READY_FOR_PICKUP');
                            addToast(`Order ${order.id} marked Packed & Ready for Pickup!`, 'success');
                          }}
                          className="text-xs font-bold"
                        >
                          Mark Ready for Pickup
                        </Button>
                      )}
                      {order.status === 'READY_FOR_PICKUP' && (
                        <Link
                          to="/pharmacy/pickup"
                          className="px-3 py-1.5 bg-forest-800 hover:bg-forest-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Handover to Rider</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Prescriptions Waiting for Verification */}
        <div className="space-y-6">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-forest-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-forest-600" />
                <span>Pending Prescriptions</span>
              </h3>
              <Link
                to="/pharmacy/prescriptions"
                className="text-xs font-bold text-forest-700 hover:underline"
              >
                Audit Desk
              </Link>
            </div>

            <div className="divide-y divide-brandBorder-subtle">
              {pendingRx.map((rx) => (
                <div key={rx.id} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-forest-800">{rx.id}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      Needs Sign-off
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-forest-900">{rx.patientName}</p>
                    <p className="text-[11px] text-brandText-secondary">{rx.doctorName}</p>
                  </div>
                  <Link
                    to="/pharmacy/prescriptions"
                    className="block text-center py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-800 text-xs font-bold rounded-xl border border-forest-100 transition-colors"
                  >
                    Open Verification Deck
                  </Link>
                </div>
              ))}
              {pendingRx.length === 0 && (
                <p className="text-xs text-brandText-muted py-4 text-center">
                  All prescriptions audited and verified!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyOverview;
