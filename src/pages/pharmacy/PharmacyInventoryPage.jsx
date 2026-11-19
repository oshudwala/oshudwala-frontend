import React, { useState } from 'react';
import { Layers, AlertTriangle, CheckCircle, Plus, Search, Edit3 } from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const PharmacyInventoryPage = () => {
  const { inventory, adjustStock } = useWorkspaceStore();
  const { addToast } = useToast();
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustUnits, setAdjustUnits] = useState(10);

  const filterOptions = [
    { label: 'In Stock', value: 'IN_STOCK' },
    { label: 'Expiring (<30d)', value: 'EXPIRING_SOON' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
  ];

  const handleStockUpdate = (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    adjustStock(selectedItem.id, adjustUnits, 'Stock Received from Central Distributor');
    addToast(`Updated stock for ${selectedItem.name}!`, 'success');
    setSelectedItem(null);
  };

  const columns = [
    {
      header: 'Drug Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary">{row.generic}</p>
          <p className="text-[10px] text-brandText-muted">{row.manufacturer}</p>
        </div>
      ),
    },
    {
      header: 'Batch No & Expiry',
      key: 'batchNo',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-forest-800">{row.batchNo}</span>
          <p className="text-[10px] text-brandText-muted">Exp: {row.expiryDate}</p>
          {row.daysToExpiry <= 30 && (
            <span className="inline-block text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded mt-0.5">
              ⚠️ {row.daysToExpiry} days left!
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Retail Price (MRP)',
      key: 'mrp',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-forest-900">₹{row.sellingPrice.toFixed(2)}</span>
          <p className="text-[10px] text-brandText-muted">MRP: ₹{row.mrp.toFixed(2)}</p>
        </div>
      ),
    },
    {
      header: 'Stock in Counter',
      key: 'stock',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-forest-900">{row.stock} packs</span>
          <p className="text-[10px] text-brandText-muted">Reorder: {row.reorderLevel}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedItem(row)}
          className="text-xs py-1"
        >
          Add Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Pharmacy Medicine Stock & Expiry Control
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Real-time stock ledger, batch tracking, and mandatory CDSCO expiry alert monitoring.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={inventory}
        searchKey="name"
        searchPlaceholder="Search medicine name, generic formula or batch..."
        filterOptions={filterOptions}
        filterKey="status"
      />

      {/* Adjust Stock Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-sm w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4">
            <h3 className="font-heading font-bold text-base text-forest-900">
              Inward Stock: {selectedItem.name}
            </h3>
            <p className="text-xs text-brandText-secondary">
              Current Counter Balance: <strong>{selectedItem.stock}</strong> units &bull; Batch:{' '}
              {selectedItem.batchNo}
            </p>
            <form onSubmit={handleStockUpdate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-forest-800">
                  New Units Received / Added
                </label>
                <input
                  type="number"
                  required
                  value={adjustUnits}
                  onChange={(e) => setAdjustUnits(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-bold bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="text-xs">
                  Update Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyInventoryPage;
