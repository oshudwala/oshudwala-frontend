import React from 'react';

export const StatusBadge = ({ status, className = '' }) => {
  const normStatus = String(status || '').toUpperCase().replace(/[\s-]/g, '_');

  const configs = {
    // Orders
    PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    ACCEPTED: { label: 'Accepted', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    PREPARING: { label: 'Preparing', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500 animate-pulse' },
    READY_FOR_PICKUP: { label: 'Ready for Pickup', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    RIDER_ASSIGNED: { label: 'Rider Assigned', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    SHIPPED: { label: 'Out for Delivery', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-600 animate-pulse' },
    PICKED_UP: { label: 'Picked Up (En Route)', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-600 animate-pulse' },
    DELIVERED: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },

    // Token Queue
    SERVING: { label: 'In Consultation', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-600 animate-ping' },
    NEXT: { label: 'Next in Line', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
    WAITING: { label: 'Waiting', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' },
    COMPLETED: { label: 'Completed', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' },
    SKIPPED: { label: 'Skipped / Held', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-400' },

    // Prescriptions
    PENDING_VERIFICATION: { label: 'Needs Verification', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    VERIFIED: { label: 'Verified Rx', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },

    // Inventory
    IN_STOCK: { label: 'In Stock', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    LOW_STOCK: { label: 'Low Stock', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    EXPIRING_SOON: { label: 'Expiring Soon', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
    OUT_OF_STOCK: { label: 'Out of Stock', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-600' },

    // Payments
    PAID: { label: 'Paid Online', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    PENDING_COLLECTION: { label: 'COD Due', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    COLLECTED: { label: 'Cash Collected', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },

    // Active Status
    ACTIVE: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    INACTIVE: { label: 'Inactive', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', dot: 'bg-gray-400' },
  };

  const config = configs[normStatus] || {
    label: normStatus.replace(/_/g, ' '),
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
