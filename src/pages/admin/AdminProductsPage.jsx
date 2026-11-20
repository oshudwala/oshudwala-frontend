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
  TrendingDown
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { productsData } from '../../data/productsData';

export const AdminProductsPage = () => {
  const { inventory, adjustStock, addStock, removeStock } = useWorkspaceStore();
  const { addToast } = useToast();

  // Adjust stock state
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockDelta, setStockDelta] = useState(10);

  // Add stock state
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [addUnits, setAddUnits] = useState(50);
  const [batchNo, setBatchNo] = useState(`WB-${Math.floor(1000 + Math.random() * 9000)}`);
  const [expiryDate, setExpiryDate] = useState('2027-10-31');

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState(null);

  const filterOptions = [
    { label: 'In Stock', value: 'IN_STOCK' },
    { label: 'Expiring Soon', value: 'EXPIRING_SOON' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
    { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
  ];

  // Distinct categories from productsData
  const categories = ['ALL', ...new Set(productsData.map((p) => p.categoryName || p.category))];

  // Filtered product catalog for stock addition
  const filteredProducts = productsData.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || (p.categoryName || p.category) === selectedCategory;
    const matchesQuery =
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.genericName && p.genericName.toLowerCase().includes(productSearch.toLowerCase())) ||
      (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const handleAddStockSubmit = (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      addToast('Please select a medicine from the list to add stock.', 'error');
      return;
    }

    if (!addUnits || Number(addUnits) <= 0) {
      addToast('Please enter a valid positive number of units.', 'error');
      return;
    }

    const newItem = addStock({
      name: selectedProduct.name,
      generic: selectedProduct.genericName || selectedProduct.strength || '',
      manufacturer: selectedProduct.brand || 'Certified Pharma',
      category: selectedProduct.categoryName || selectedProduct.category || 'General',
      batchNo: batchNo || `WB-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: expiryDate || '2027-12-31',
      mrp: selectedProduct.mrp || 100,
      sellingPrice: selectedProduct.price || selectedProduct.mrp || 90,
      units: Number(addUnits),
    });

    addToast(`Successfully added ${addUnits} units of ${selectedProduct.name} to Inventory!`, 'success');
    setIsAddStockModalOpen(false);
    setSelectedProduct(null);
    setAddUnits(50);
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
      render: (row) => <span className="text-xs text-forest-800 font-medium">{row.category}</span>,
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
            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
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
            Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Real-time stock ledger, batch tracking, expiry monitoring, and stock additions.
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => {
              setBatchNo(`WB-${Math.floor(1000 + Math.random() * 9000)}`);
              setIsAddStockModalOpen(true);
            }}
            className="text-xs shadow-card font-bold py-2 px-4"
          >
            + Add Stock
          </Button>
        </div>
      </div>

      {/* Main Inventory DataTable */}
      <DataTable
        columns={columns}
        data={inventory}
        searchKey="name"
        searchPlaceholder="Search product name, generic, or batch number..."
        filterOptions={filterOptions}
        filterKey="status"
      />

      {/* ============================================================== */}
      {/* MODAL: ADD STOCK (CATEGORY-WISE PRODUCT SELECTION + UNITS)     */}
      {/* ============================================================== */}
      {isAddStockModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddStockModalOpen(false)}
          />
          <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
            <div className="w-full max-w-2xl bg-surface-pure rounded-3xl p-5 sm:p-7 shadow-floating border border-brandBorder-subtle text-left relative overflow-hidden animate-scale-up my-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-extrabold text-forest-900">
                      Add Stock to Inventory
                    </h2>
                    <p className="text-xs text-brandText-secondary">
                      Select a product category-wise and enter stock quantity to add.
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

              {/* Category Pills & Search */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-forest-800 text-white shadow-xs'
                          : 'bg-surface-warm text-brandText-secondary hover:text-forest-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search medicine by brand or generic name..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                  />
                </div>
              </div>

              {/* Product Selection List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 border border-brandBorder-subtle rounded-2xl p-2 bg-surface-warm/40">
                {filteredProducts.length === 0 ? (
                  <p className="text-xs text-brandText-secondary text-center py-6">
                    No medicines found matching your search.
                  </p>
                ) : (
                  filteredProducts.map((p) => {
                    const isSelected = selectedProduct?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-forest-100/80 border-forest-500 shadow-xs'
                            : 'bg-surface-pure border-brandBorder-subtle hover:border-forest-300'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs text-forest-900">{p.name}</p>
                          <p className="text-[11px] text-brandText-secondary">
                            {p.genericName} &bull; {p.brand}
                          </p>
                          <span className="text-[10px] font-semibold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded">
                            {p.categoryName || p.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs text-forest-900">₹{p.price}</span>
                          <p className="text-[10px] text-brandText-muted">MRP ₹{p.mrp}</p>
                          {isSelected && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Product Summary & Units Input */}
              {selectedProduct ? (
                <form onSubmit={handleAddStockSubmit} className="space-y-3 pt-2 border-t border-brandBorder-subtle">
                  <div className="p-3 bg-forest-50/70 border border-forest-100 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-brandText-secondary text-[11px]">Selected Item:</span>
                      <p className="font-bold text-forest-900 text-sm">{selectedProduct.name}</p>
                      <p className="text-[11px] text-forest-700">{selectedProduct.genericName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-forest-900">MRP ₹{selectedProduct.mrp}</span>
                      <p className="text-[11px] text-brandText-muted">Rate: ₹{selectedProduct.price}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Units to Add *
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={addUnits}
                        onChange={(e) => setAddUnits(e.target.value)}
                        placeholder="e.g. 50"
                        className="w-full px-3 py-2 text-xs font-bold text-forest-900 bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Batch Number
                      </label>
                      <input
                        type="text"
                        value={batchNo}
                        onChange={(e) => setBatchNo(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono font-bold text-forest-900 bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddStockModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="font-bold shadow-card px-5">
                      Confirm & Add to Stock
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center text-xs text-amber-800 font-medium">
                  Please click and select a medicine from the list above to set the units.
                </div>
              )}
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
