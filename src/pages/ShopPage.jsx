import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, FileText, ArrowRight, X, Building2 } from 'lucide-react';
import { productService } from '../services/productService';
import { categoriesData } from '../data/categoriesData';
import { pharmacyApi } from '../services/api/pharmacy.api';
import ProductCard from '../components/shop/ProductCard';
import PrescriptionModal from '../components/home/PrescriptionModal';
import Button from '../components/common/Button';

export const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptionFilter, setPrescriptionFilter] = useState('all'); // 'all', 'rx', 'otc'
  const [sortBy, setSortBy] = useState('featured');
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [primaryPharmacy, setPrimaryPharmacy] = useState(null);

  useEffect(() => {
    pharmacyApi.getPrimaryPharmacy().then((p) => {
      if (p) setPrimaryPharmacy(p);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let rxReq = null;
        if (prescriptionFilter === 'rx') rxReq = true;
        if (prescriptionFilter === 'otc') rxReq = false;

        const res = await productService.getProducts({
          category: selectedCategory,
          search: searchQuery,
          prescriptionRequired: rxReq,
          sort: sortBy
        });
        const items = Array.isArray(res?.products)
          ? res.products
          : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
          ? res
          : [];
        setProducts(items);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchQuery, prescriptionFilter, sortBy]);

  const handleCategoryChange = (slug) => {
    setSelectedCategory(slug);
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Banner / Prescription CTA */}
      <div className="bg-gradient-to-r from-forest-800 to-forest-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-floating">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            Fast Prescription Dispensing
          </span>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white">
            Have a Doctor's Prescription?
          </h1>
          <p className="text-xs sm:text-sm text-forest-200 max-w-xl">
            Upload your prescription document or image and our licensed pharmacists will dispense your medicines with 45-minute delivery.
          </p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          leftIcon={FileText}
          onClick={() => setIsPrescriptionModalOpen(true)}
          className="bg-white hover:bg-forest-50 text-forest-800 font-bold shadow-card flex-shrink-0"
        >
          Upload Prescription
        </Button>
      </div>

      {/* Primary Pharmacy Hub Badge */}
      {primaryPharmacy && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-forest-50 border border-forest-200/80 rounded-2xl text-xs text-forest-900">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-forest-700 flex-shrink-0" />
            <span>
              All catalog medicines & prescriptions fulfilled directly by Primary Hub: <strong>{primaryPharmacy.name}</strong>
              {primaryPharmacy.city ? ` (${primaryPharmacy.city})` : ''}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-800 bg-forest-100 border border-forest-300 px-2 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto">
            Authorized Main Store
          </span>
        </div>
      )}

      {/* Search & Filter Header Bar */}
      <div className="bg-surface-pure p-4 sm:p-5 rounded-2xl border border-brandBorder-subtle shadow-subtle space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by brand, medicine name, or generic composition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 text-brandText-main"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brandText-muted hover:text-brandText-main"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {/* Rx Filter */}
            <div className="inline-flex rounded-xl p-1 bg-surface-warm border border-brandBorder-subtle text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPrescriptionFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  prescriptionFilter === 'all'
                    ? 'bg-forest-600 text-white shadow-sm'
                    : 'text-brandText-secondary hover:text-forest-700'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPrescriptionFilter('otc')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  prescriptionFilter === 'otc'
                    ? 'bg-forest-600 text-white shadow-sm'
                    : 'text-brandText-secondary hover:text-forest-700'
                }`}
              >
                OTC
              </button>
              <button
                type="button"
                onClick={() => setPrescriptionFilter('rx')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  prescriptionFilter === 'rx'
                    ? 'bg-forest-600 text-white shadow-sm'
                    : 'text-brandText-secondary hover:text-forest-700'
                }`}
              >
                Rx Required
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium text-brandText-main focus:outline-none focus:border-forest-500"
            >
              <option value="featured">Sort by: Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-brandBorder-light">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-forest-700 text-white shadow-subtle'
                : 'bg-forest-50 text-forest-800 hover:bg-forest-100'
            }`}
          >
            All Categories
          </button>
          {categoriesData.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-forest-700 text-white shadow-subtle font-bold'
                  : 'bg-forest-50 text-forest-800 hover:bg-forest-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-brandText-secondary px-1">
        <span>
          Showing <span className="font-bold text-forest-800">{(products || []).length}</span> genuine medicines & products
        </span>
      </div>

      {/* Products Grid */}
      {(products || []).length === 0 ? (
        <div className="bg-surface-pure rounded-3xl p-12 text-center border border-brandBorder-subtle space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-forest-50 text-forest-600 flex items-center justify-center">
            <Search className="w-7 h-7" />
          </div>
          <h3 className="font-heading font-bold text-lg text-forest-800">
            No medicines found matching your criteria
          </h3>
          <p className="text-xs text-brandText-secondary max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or upload your prescription directly.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setPrescriptionFilter('all');
              }}
            >
              Clear All Filters
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPrescriptionModalOpen(true)}
            >
              Upload Prescription
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {(products || []).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Prescription Upload Modal */}
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
      />
    </div>
  );
};

export default ShopPage;
