import React, { useState } from 'react';
import {
  Layers,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  Package,
  Calendar,
  X,
  Tag,
  Check,
  Database,
  Sparkles,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import StockCatalogExplorer from '../../components/workspace/StockCatalogExplorer';

export const PharmacyInventoryPage = () => {
  const { inventory, adjustStock, addStock, removeStock } = useWorkspaceStore();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'catalog'

  // Inward existing stock modal state
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustUnits, setAdjustUnits] = useState(10);

  // New Stock Modal state (Master 2.5L+ Explorer)
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState(null);

  const filterOptions = [
    { label: 'In Stock', value: 'IN_STOCK' },
    { label: 'Expiring (<30d)', value: 'EXPIRING_SOON' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
  ];

  // Callback when a medicine is inwarded from the 2.5L+ Master Catalog
  const handleInwardFromCatalog = (payload) => {
    const created = addStock({
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

    setIsAddStockModalOpen(false);
    addToast(
      `Successfully inwarded ${created.stock} units of ${created.name} (Batch: ${created.batchNo}) to pharmacy stock!`,
      'success'
    );
  };

  // Adjust units on existing counter stock
  const handleStockUpdate = (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    adjustStock(selectedItem.id, adjustUnits, 'Stock Received from Central Distributor');
    addToast(`Updated stock units for ${selectedItem.name}!`, 'success');
    setSelectedItem(null);
  };

  // Delete item from inventory (Explicit user requirement)
  const handleDeleteItem = (row) => {
    setItemToDelete(row);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    removeStock(itemToDelete.id);
    addToast(`Removed ${itemToDelete.name} from pharmacy inventory.`, 'error');
    setItemToDelete(null);
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
      header: 'Category',
      key: 'category',
      render: (row) => (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-surface-warm text-forest-800 border border-brandBorder-subtle">
          {row.category || 'General'}
        </span>
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
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedItem(row)}
            className="text-xs py-1"
          >
            Add Units
          </Button>
          <button
            type="button"
            onClick={() => handleDeleteItem(row)}
            className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors border border-rose-200"
            title="Delete medicine from inventory"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Add Stock Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Pharmacy Medicine Stock & Expiry Control
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Real-time counter stock ledger, CDSCO expiry monitoring, and 2.5L+ Master Catalog access.
          </p>
        </div>

        {/* Add Stock Button Above the Table (Explicit User Requirement) */}
        <div>
          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={() => setIsAddStockModalOpen(true)}
            className="text-xs font-bold shadow-md"
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
          <span>Active Counter Stock ({inventory.length} items)</span>
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

      {/* TAB 1: ACTIVE COUNTER STOCK TABLE */}
      {activeTab === 'active' && (
        <DataTable
          columns={columns}
          data={inventory}
          searchKey="name"
          searchPlaceholder="Search counter stock by drug name, generic formula or batch..."
          filterOptions={filterOptions}
          filterKey="status"
        />
      )}

      {/* TAB 2: MASTER 2.5L+ MEDICINE STOCK EXPLORER */}
      {activeTab === 'catalog' && (
        <StockCatalogExplorer
          title="Pharmacy Master Medicine Database (2.5 Lakhs Dataset)"
          onSelectMedicine={handleInwardFromCatalog}
        />
      )}

      {/* MODAL: ADD STOCK VIA 2.5L+ MASTER CATALOG EXPLORER */}
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
                      Inward Stock from Master 2.5L+ Medicine Catalog
                    </h2>
                    <p className="text-xs text-brandText-secondary">
                      Select medicine by category, adjust counter units, batch number and expiry date.
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

      {/* MODAL: ADJUST STOCK UNITS */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setSelectedItem(null)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-sm w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4">
            <h3 className="font-heading font-bold text-base text-forest-900">
              Inward Units: {selectedItem.name}
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
                <Button type="submit" variant="primary" size="sm" className="text-xs font-bold">
                  Update Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
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
                  Remove Medicine from Inventory
                </h3>
                <p className="text-xs text-brandText-secondary mt-1">
                  Are you sure you want to remove{' '}
                  <strong className="text-rose-700">{itemToDelete.name}</strong> (Batch: {itemToDelete.batchNo}) from the counter inventory?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brandBorder-subtle">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItemToDelete(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
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

export default PharmacyInventoryPage;
