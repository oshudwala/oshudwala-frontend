import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Plus,
  Check,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  Tag,
  Building2,
  Layers,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { stockCatalogService } from '../../services/stockCatalogService';
import Button from '../common/Button';
import { useToast } from '../../context/ToastContext';

export const StockCatalogExplorer = ({ onSelectMedicine, title = 'Master Medicine Stock Catalog (2.5 Lakhs Dataset)' }) => {
  const { addToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('antibiotics-antibacterials');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(false);

  // Inward Stock Staging Modal
  const [stagingMedicine, setStagingMedicine] = useState(null);
  const [inwardUnits, setInwardUnits] = useState(50);
  const [batchNo, setBatchNo] = useState(`WB-${Math.floor(1000 + Math.random() * 9000)}-26`);
  const [expiryDate, setExpiryDate] = useState('2027-11-30');
  const [customPrice, setCustomPrice] = useState('');
  const [customSellingPrice, setCustomSellingPrice] = useState('');

  // 1. Load Categories Index on Mount (6 KB instant)
  useEffect(() => {
    let isMounted = true;
    stockCatalogService.getCategories().then((cats) => {
      if (isMounted) {
        setCategories(cats);
        if (cats.length > 0 && !selectedCategorySlug) {
          setSelectedCategorySlug(cats[0].slug);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Debounce search input (250ms) to prevent UI lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Fetch paginated data safely from partitioned category shards
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await stockCatalogService.searchCatalog({
        query: debouncedQuery,
        categorySlug: selectedCategorySlug,
        page: currentPage,
        limit: pageSize,
      });

      setItems(res.items);
      setTotalCount(res.total);
    } catch (err) {
      console.warn('Error loading catalog data:', err);
      addToast('Error fetching medicine catalog slice.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, selectedCategorySlug, currentPage, pageSize, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Open Inward Form
  const handleOpenInward = (med) => {
    setStagingMedicine(med);
    setInwardUnits(50);
    setBatchNo(`WB-${Math.floor(1000 + Math.random() * 9000)}-26`);
    setExpiryDate('2027-11-30');
    setCustomPrice(String(med.mrp || 100));
    setCustomSellingPrice(String(Math.round((med.mrp || 100) * 0.9))); // Default 10% discount
  };

  // Confirm Inward to Stock
  const handleConfirmInward = (e) => {
    e.preventDefault();
    if (!stagingMedicine) return;

    if (!inwardUnits || Number(inwardUnits) <= 0) {
      addToast('Please enter a positive number of units.', 'warning');
      return;
    }

    if (!expiryDate) {
      addToast('Please provide an expiry date.', 'warning');
      return;
    }

    const payload = {
      name: stagingMedicine.name,
      generic: stagingMedicine.generic || 'Standard Formulation',
      manufacturer: stagingMedicine.mfg || 'Certified Pharma',
      category: stagingMedicine.category || 'General',
      form: stagingMedicine.form || 'Tablet',
      pack: stagingMedicine.pack || 'Standard Pack',
      batchNo: batchNo.trim() || `WB-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate,
      mrp: Number(customPrice) || Number(stagingMedicine.mrp) || 100,
      sellingPrice: Number(customSellingPrice) || Number(customPrice) || 90,
      units: Number(inwardUnits),
    };

    if (onSelectMedicine) {
      onSelectMedicine(payload);
    }

    setStagingMedicine(null);
  };

  const selectedCategoryObj = categories.find((c) => c.slug === selectedCategorySlug);

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="bg-surface-pure p-4 rounded-3xl border border-brandBorder-subtle shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-heading font-extrabold text-base text-forest-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-brandText-secondary">
              Distinguished across 21 medical categories &bull; Instant search without UI freeze &bull;{' '}
              <strong className="text-forest-800">254,372</strong> Total Medicines
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand name, generic or manufacturer..."
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-surface-warm border border-brandBorder-subtle rounded-2xl focus:outline-none focus:border-forest-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brandText-muted hover:text-forest-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Carousel Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                setSelectedCategorySlug(cat.slug);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategorySlug === cat.slug
                  ? 'bg-forest-800 text-white shadow-sm'
                  : 'bg-surface-warm text-brandText-main hover:bg-forest-50 border border-brandBorder-subtle'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  selectedCategorySlug === cat.slug
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-pure text-forest-700'
                }`}
              >
                {cat.count > 1000 ? `${(cat.count / 1000).toFixed(1)}k` : cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-brandText-secondary px-1">
        <span>
          Showing <strong className="text-forest-900">{items.length}</strong> of{' '}
          <strong className="text-forest-900">{totalCount.toLocaleString()}</strong> medicines in{' '}
          <strong className="text-forest-800">{selectedCategoryObj?.name || 'Selected Category'}</strong>
        </span>

        {isLoading && (
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Fetching instant shard...</span>
          </span>
        )}
      </div>

      {/* High-Performance Paginated Table */}
      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-warm border-b border-brandBorder-subtle text-forest-900 font-bold">
                <th className="py-3 px-4">Medicine Brand Name</th>
                <th className="py-3 px-4">Generic Composition</th>
                <th className="py-3 px-4">Form & Packaging</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4 text-right">Standard MRP</th>
                <th className="py-3 px-4 text-right">Inward Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brandBorder-subtle">
              {items.map((med, idx) => (
                <tr key={med.id || idx} className="hover:bg-forest-50/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-forest-900 max-w-[220px]">
                    <div className="truncate font-semibold text-xs text-forest-900" title={med.name}>
                      {med.name}
                    </div>
                    <span className="text-[10px] font-mono text-brandText-muted block mt-0.5">
                      {med.id}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-brandText-secondary max-w-[260px]">
                    <div className="truncate text-[11px]" title={med.generic}>
                      {med.generic || 'Active Compound Formulation'}
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded bg-surface-warm text-forest-800 font-semibold border border-brandBorder-subtle text-[11px]">
                      {med.form || 'Tablet'}
                    </span>
                    <span className="text-[10px] text-brandText-muted block mt-0.5">{med.pack}</span>
                  </td>

                  <td className="py-3 px-4 text-brandText-secondary max-w-[180px]">
                    <div className="truncate text-[11px]" title={med.mfg}>
                      {med.mfg || 'Certified Pharma'}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-forest-900 whitespace-nowrap">
                    {med.mrp > 0 ? `₹${med.mrp.toFixed(2)}` : 'On Request'}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={Plus}
                      onClick={() => handleOpenInward(med)}
                      className="text-[11px] py-1 px-3 font-bold"
                    >
                      + Inward Stock
                    </Button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && !isLoading && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-xs text-brandText-muted">
                    No medicines found matching &ldquo;{searchQuery}&rdquo; in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-surface-warm border-t border-brandBorder-subtle flex items-center justify-between text-xs">
            <span className="text-brandText-secondary">
              Page <strong className="text-forest-900">{currentPage}</strong> of{' '}
              <strong className="text-forest-900">{totalPages}</strong> ({totalCount.toLocaleString()} items)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-brandBorder-subtle bg-surface-pure hover:bg-forest-50 disabled:opacity-40 transition-colors text-forest-900"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-mono font-bold text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl">
                {currentPage}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-xl border border-brandBorder-subtle bg-surface-pure hover:bg-forest-50 disabled:opacity-40 transition-colors text-forest-900"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* INWARD STOCK MODAL */}
      {stagingMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setStagingMedicine(null)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-lg w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  Inward Medicine to Active Inventory
                </h3>
                <p className="text-xs text-brandText-secondary">
                  Distinguished from 2.5L+ Master Catalog &bull; {stagingMedicine.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStagingMedicine(null)}
                className="p-1 rounded-full text-brandText-muted hover:text-forest-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Medicine Info Banner */}
            <div className="p-3.5 rounded-2xl bg-forest-50/80 border border-forest-100 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-forest-900">{stagingMedicine.name}</h4>
                <span className="font-mono font-bold text-xs text-forest-700 bg-white px-2 py-0.5 rounded border border-forest-200">
                  {stagingMedicine.id}
                </span>
              </div>
              <p className="text-brandText-secondary">{stagingMedicine.generic}</p>
              <div className="pt-1 flex items-center justify-between text-[11px] text-forest-800">
                <span>{stagingMedicine.mfg}</span>
                <span>
                  {stagingMedicine.form} ({stagingMedicine.pack})
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmInward} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest-900">Units to Inward</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={inwardUnits}
                    onChange={(e) => setInwardUnits(Number(e.target.value) || 1)}
                    className="w-full mt-1 px-3 py-2 text-sm font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-900">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-mono font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-forest-900">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-semibold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-900">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-forest-900">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={customSellingPrice}
                    onChange={(e) => setCustomSellingPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brandBorder-subtle">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStagingMedicine(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  className="text-xs font-bold px-4 py-2"
                >
                  Add to Active Stock
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockCatalogExplorer;
