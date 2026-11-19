import React, { useState } from 'react';
import { Package, Layers, AlertCircle, Plus, Edit3 } from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import Button from '../../components/common/Button';

export const AdminProductsPage = () => {
  const { inventory, adjustStock } = useWorkspaceStore();
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockDelta, setStockDelta] = useState(10);

  const filterOptions = [
    { label: 'In Stock', value: 'IN_STOCK' },
    { label: 'Expiring Soon', value: 'EXPIRING_SOON' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
  ];

  const columns = [
    {
      header: 'Medicine / Item',
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
      header: 'Category',
      key: 'category',
      render: (row) => <span className="text-xs text-forest-800">{row.category}</span>,
    },
    {
      header: 'Batch & Expiry',
      key: 'batchNo',
      render: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-forest-900">{row.batchNo}</span>
          <p className="text-[10px] text-brandText-muted">Exp: {row.expiryDate}</p>
          {row.daysToExpiry <= 30 && (
            <span className="inline-block text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded">
              {row.daysToExpiry} days left!
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Pricing',
      key: 'sellingPrice',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-forest-900">₹{row.sellingPrice.toFixed(2)}</span>
          <p className="text-[10px] text-brandText-muted line-through">MRP ₹{row.mrp.toFixed(2)}</p>
        </div>
      ),
    },
    {
      header: 'Current Stock',
      key: 'stock',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-forest-900">{row.stock} units</span>
          <p className="text-[10px] text-brandText-muted">Min: {row.reorderLevel}</p>
        </div>
      ),
    },
    {
      header: 'Inventory Health',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Quick Adjust',
      key: 'action',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedItem(row)}
          className="text-xs py-1"
        >
          Adjust Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Products Catalog & Inventory Monitor
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Live stock tracking across warehouse and partner pharmacy locations in West Bengal.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={inventory}
        searchKey="name"
        searchPlaceholder="Search product name, generic, or batch number..."
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
              Adjust Stock: {selectedItem.name}
            </h3>
            <p className="text-xs text-brandText-secondary">
              Current Stock: <strong>{selectedItem.stock}</strong> units &bull; Batch:{' '}
              {selectedItem.batchNo}
            </p>
            <div>
              <label className="text-xs font-bold text-forest-800">Add Units (or subtract)</label>
              <input
                type="number"
                value={stockDelta}
                onChange={(e) => setStockDelta(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-sm font-bold bg-surface-warm focus:outline-none focus:border-forest-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  adjustStock(selectedItem.id, stockDelta, 'Manual Admin Adjustment');
                  setSelectedItem(null);
                }}
                className="text-xs"
              >
                Save Stock
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
