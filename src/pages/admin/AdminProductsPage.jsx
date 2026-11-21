import React, { useState } from 'react';
import {
  Layers,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Search,
  PackageCheck,
  CheckCircle2,
  X,
  Filter,
  TrendingDown,
  Database,
  Sparkles,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import StockCatalogExplorer from '../../components/workspace/StockCatalogExplorer';

export const AdminProductsPage = () => {
  const { inventory, adjustStock, addStock, removeStock } = useWorkspaceStore();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'catalog'

  // Adjust stock state
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockDelta, setStockDelta] = useState(10);

  // Add stock modal state (Master Catalog Picker)
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState(null);

  const filterOptions = [
    { label: 'In Stock', value: 'IN_STOCK' },
    { label: 'Expiring Soon', value: 'EXPIRING_SOON' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
    { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
  ];

  const handleInwardFromCatalog = (payload) => {
    const newItem = addStock({
      name: payload.name,
      generic: payload.generic,
      manufacturer: payload.manufacturer,
      category: payload.category,
      batchNo: payload.batchNo,
      expiryDate: payload.expiryDate,
      mrp: payload.mrp,
      sellingPrice: payload.sellingPrice,
      units: payload.units,
    });

    addToast(`Successfully added ${payload.units} units of ${payload.name} (Batch: ${payload.batchNo}) to Central Inventory!`, 'success');
    setIsAddStockModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    removeStock(itemToDelete.id);
    addToast(`Removed "${itemToDelete.name}" from inventory.`, 'success');
    setItemToDelete(null);
  };

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
      render: (row) => (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-warm text-forest-800 border border-brandBorder-subtle">
          {row.category || 'General'}
        </span>
      ),
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
          <span className="font-bold text-xs text-forest-900">₹{Number(row.sellingPrice || 0).toFixed(2)}</span>
          <p className="text-[10px] text-brandText-muted line-through">MRP ₹{Number(row.mrp || 0).toFixed(2)}</p>
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
          <p className="text-[10px] text-brandText-muted">Min: {row.reorderLevel || 20}</p>
        </div>
      ),
    },
    {
      header: 'Inventory Health',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Stock Actions',
      key: 'action',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedItem(row)}
            className="text-xs py-1 px-2.5 font-semibold"
          >
            Adjust Stock
          </Button>
          <button
            type="button"
            onClick={() => setItemToDelete(row)}
            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
            title="Delete from stock"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Add Stock Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Central stock ledger, batch tracking, expiry monitoring, and 2.5L+ Master Catalog access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => setIsAddStockModalOpen(true)}
            className="text-xs shadow-card font-bold py-2 px-4"
          >
            + Add Stock from 2.5L Catalog
          </Button>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-2 border-b border-brandBorder-subtle pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'active'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'bg-surface-pure border border-brandBorder-subtle text-forest-800 hover:bg-forest-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Active Warehouse Stock ({inventory.length} items)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'bg-surface-pure border border-brandBorder-subtle text-forest-800 hover:bg-forest-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Master 2.5L+ Medicine Database</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-bold">
            254k
          </span>
        </button>
      </div>

      {/* TAB 1: ACTIVE INVENTORY TABLE */}
      {activeTab === 'active' && (
        <DataTable
          columns={columns}
          data={inventory}
          searchKey="name"
          searchPlaceholder="Search active stock by name, generic formula or batch..."
          filterOptions={filterOptions}
          filterKey="status"
        />
      )}

      {/* TAB 2: MASTER 2.5L+ MEDICINE STOCK EXPLORER */}
      {activeTab === 'catalog' && (
        <StockCatalogExplorer
          title="Super Admin Master Medicine Database (2.5 Lakhs Dataset)"
          onSelectMedicine={handleInwardFromCatalog}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD STOCK VIA 2.5L+ MASTER CATALOG EXPLORER             */}
      {/* ============================================================== */}
      {isAddStockModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddStockModalOpen(false)}
          />
          <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
            <div className="w-full max-w-4xl bg-surface-pure rounded-3xl p-5 sm:p-6 shadow-floating border border-brandBorder-subtle text-left relative overflow-hidden animate-scale-up my-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-extrabold text-forest-900">
                      Add Stock to Central Inventory
                    </h2>
                    <p className="text-xs text-brandText-secondary">
                      Select any medicine from the 2.5L+ catalog by category, set units, batch & expiry.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddStockModalOpen(false)}
                  className="p-1.5 text-brandText-secondary hover:text-forest-700 hover:bg-forest-50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Embedded Explorer with zero freeze */}
              <StockCatalogExplorer
                title="Select Medicine from 2.5L+ Catalog to Inward"
                onSelectMedicine={handleInwardFromCatalog}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADJUST STOCK                                           */}
      {/* ============================================================== */}
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
                  addToast(`Adjusted stock by ${stockDelta} units.`, 'success');
                  setSelectedItem(null);
                }}
                className="text-xs font-bold shadow-card"
              >
                Save Stock
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE CONFIRMATION                                     */}
      {/* ============================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setItemToDelete(null)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-sm w-full p-6 shadow-floating border border-rose-200 z-10 space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-forest-900">
                  Delete Stock Item
                </h3>
                <p className="text-xs text-brandText-secondary mt-1">
                  Are you sure you want to completely remove{' '}
                  <strong className="text-rose-700">{itemToDelete.name}</strong> (Batch: {itemToDelete.batchNo}) from inventory?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brandBorder-subtle">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDeleteConfirm}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
