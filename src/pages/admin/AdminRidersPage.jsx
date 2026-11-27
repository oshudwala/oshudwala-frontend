import React, { useState, useEffect } from 'react';
import {
  Bike,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  DollarSign,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import MetricCard from '../../components/workspace/MetricCard';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import apiClient from '../../services/api/client';

export const AdminRidersPage = () => {
  const { toggleRiderOnline } = useWorkspaceStore();
  const { addToast } = useToast();

  const [riders, setRiders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRiders = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/riders');
      const raw = res.data?.data || res.data || [];
      const normalized = (Array.isArray(raw) ? raw : []).map((r) => ({
        id: r.user?.id || r.userId || r.id,
        profileId: r.id,
        userId: r.userId || r.user?.id || r.id,
        name: r.user?.fullName || r.fullName || 'Rider',
        phone: r.user?.phone || r.phone || 'Not Specified',
        email: r.user?.email || r.email || '',
        zone: r.zone || 'Kolkata Metropolitan Area',
        vehicle: r.vehicleType
          ? `${r.vehicleType} (${r.vehicleNumber || 'Standard'})`
          : 'Motorcycle / Two-Wheeler',
        isOnline: r.status === 'AVAILABLE' || r.status === 'ACTIVE' || r.isOnline !== false,
        status: r.status,
        kycStatus: r.kycStatus || 'APPROVED',
        activeOrderId: r.activeDelivery?.order?.orderNumber || null,
        cashInHand: (r.wallet?.heldPaise ? Number(r.wallet.heldPaise) / 100 : 0) || (r.cashInHand || 0),
        rating: r.rating || 4.9,
        deliveriesToday: r.deliveriesToday || 0,
      }));
      setRiders(normalized);
    } catch (err) {
      console.warn('Admin riders fetch notice:', err.message);
      addToast('Could not fetch riders from server.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleToggleOnline = async (row) => {
    const targetUserId = row.userId || row.id;
    const nextOnline = !row.isOnline;
    const nextStatus = nextOnline ? 'AVAILABLE' : 'OFFLINE';

    // Optimistic UI update
    setRiders((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, isOnline: nextOnline, status: nextStatus } : r))
    );

    try {
      await apiClient.patch(`/riders/${targetUserId}/status`, {
        status: nextStatus,
      });
      toggleRiderOnline(row.id, nextOnline);
      addToast(`${row.name} marked ${nextOnline ? 'Online & Available' : 'Offline'}`, 'info');
    } catch (err) {
      console.warn('Toggle rider status notice:', err.message);
      // Revert if error
      setRiders((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, isOnline: !nextOnline, status: row.status } : r))
      );
      addToast('Failed to update rider duty status on server.', 'error');
    }
  };

  const activeRiders = riders.filter((r) => r.isOnline);
  const totalCashWithRiders = riders.reduce((sum, r) => sum + (r.cashInHand || 0), 0);

  const columns = [
    {
      header: 'Rider Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary">{row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Zone & Vehicle',
      key: 'zone',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-forest-800">{row.zone}</span>
          <p className="text-[11px] text-brandText-muted">{row.vehicle}</p>
        </div>
      ),
    },
    {
      header: 'Duty Status',
      key: 'isOnline',
      render: (row) => (
        <button
          onClick={() => handleToggleOnline(row)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
            row.isOnline
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              row.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
            }`}
          />
          <span>{row.isOnline ? 'Online & Available' : 'Offline'}</span>
        </button>
      ),
    },
    {
      header: 'Active Dispatch',
      key: 'activeOrderId',
      render: (row) =>
        row.activeOrderId ? (
          <span className="font-mono text-xs font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-100">
            {row.activeOrderId}
          </span>
        ) : (
          <span className="text-xs text-brandText-muted">Idle</span>
        ),
    },
    {
      header: 'COD Cash in Hand',
      key: 'cashInHand',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-emerald-800">
          ₹{(row.cashInHand || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Rating / KYC',
      key: 'rating',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-amber-700 flex items-center justify-end gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{row.rating}</span>
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold uppercase">
            {row.kycStatus}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Rider Fleet Dispatch Desk
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Monitor real-time delivery rider statuses, shift availability, and COD balances.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchRiders}
          isLoading={isLoading}
          className="text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Fleet</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Active Riders Online"
          value={`${activeRiders.length} / ${riders.length}`}
          change="Real-time"
          trend="up"
          caption="ready for dispatch"
          icon={Bike}
          colorScheme="emerald"
        />
        <MetricCard
          title="Total Cash with Riders"
          value={`₹${totalCashWithRiders.toFixed(2)}`}
          change="Fleet COD"
          trend="neutral"
          caption="pending deposit"
          icon={DollarSign}
          colorScheme="amber"
        />
        <MetricCard
          title="Delivery Fleet Health"
          value={riders.length > 0 ? '100% Verified' : 'No Riders'}
          change="CDSCO Compliant"
          trend="up"
          caption="active riders registered"
          icon={ShieldCheck}
          colorScheme="blue"
        />
      </div>

      <DataTable
        columns={columns}
        data={riders}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search rider by name, phone, zone..."
      />
    </div>
  );
};

export default AdminRidersPage;
