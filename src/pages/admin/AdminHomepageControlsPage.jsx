import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Image as ImageIcon,
  Layers,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  ExternalLink,
  Tag,
  Package,
  Sparkles,
  Save,
  Check
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import adminApi from '../../services/api/admin.api';
import { bannersData as initialBanners } from '../../data/bannersData';
import { parentCategories as initialCategories, categoryItemsByParent as initialCategoryItems } from '../../data/categoriesData';

export const AdminHomepageControlsPage = () => {
  const { addToast } = useToast();
  // Section tab: 'banners' | 'categories' | 'category-items'
  const [activeSection, setActiveSection] = useState('banners');

  // Data states
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryItems, setCategoryItems] = useState({});
  const [selectedParentCategory, setSelectedParentCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states for Banners
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    id: '',
    badge: 'Oshud Wala Care',
    headline: '',
    subtext: '',
    ctaText: 'Order Now',
    ctaLink: '/shop',
    secondaryCtaText: 'Upload Prescription',
    secondaryCtaLink: '/shop',
    theme: 'emerald',
    image: '',
    isActive: true,
  });

  // Modal states for Categories
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    id: '',
    name: '',
    slug: '',
    image: '',
    description: '',
    isActive: true,
  });

  // Modal states for Items inside Category
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    id: '',
    name: '',
    genericName: '',
    brand: '',
    slug: '',
    mrp: '100',
    sellingPrice: '85',
    discount: '15%',
    image: '',
    isRxRequired: false,
    inStock: true,
  });

  // Load all homepage data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const settings = await adminApi.getSettings();

      // 1. Banners
      const savedBanners = settings?.find?.((s) => s.key === 'homepage_banners')?.value;
      if (Array.isArray(savedBanners) && savedBanners.length > 0) {
        setBanners(savedBanners);
      } else {
        const local = localStorage.getItem('oshud_homepage_banners');
        setBanners(local ? JSON.parse(local) : initialBanners.map((b) => ({ ...b, isActive: true })));
      }

      // 2. Categories
      const savedCategories = settings?.find?.((s) => s.key === 'homepage_categories')?.value;
      if (Array.isArray(savedCategories) && savedCategories.length > 0) {
        setCategories(savedCategories);
      } else {
        const local = localStorage.getItem('oshud_homepage_categories');
        setCategories(local ? JSON.parse(local) : initialCategories.map((c) => ({ ...c, isActive: true })));
      }

      // 3. Category Items
      const savedItems = settings?.find?.((s) => s.key === 'homepage_category_items')?.value;
      if (savedItems && typeof savedItems === 'object') {
        setCategoryItems(savedItems);
      } else {
        const local = localStorage.getItem('oshud_homepage_category_items');
        setCategoryItems(local ? JSON.parse(local) : initialCategoryItems);
      }

      if (initialCategories.length > 0 && !selectedParentCategory) {
        setSelectedParentCategory(initialCategories[0].id);
      }
    } catch (err) {
      console.error('Error loading homepage controls:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Banners to Backend & LocalStorage
  const saveBanners = async (newList) => {
    setBanners(newList);
    localStorage.setItem('oshud_homepage_banners', JSON.stringify(newList));
    try {
      await adminApi.setSetting('homepage_banners', newList);
    } catch (err) {
      console.warn('Backend banners sync notice:', err.message);
    }
  };

  // Save Categories to Backend & LocalStorage
  const saveCategories = async (newList) => {
    setCategories(newList);
    localStorage.setItem('oshud_homepage_categories', JSON.stringify(newList));
    try {
      await adminApi.setSetting('homepage_categories', newList);
    } catch (err) {
      console.warn('Backend categories sync notice:', err.message);
    }
  };

  // Save Category Items to Backend & LocalStorage
  const saveCategoryItems = async (newItemsMap) => {
    setCategoryItems(newItemsMap);
    localStorage.setItem('oshud_homepage_category_items', JSON.stringify(newItemsMap));
    try {
      await adminApi.setSetting('homepage_category_items', newItemsMap);
    } catch (err) {
      console.warn('Backend category items sync notice:', err.message);
    }
  };

  // ================= BANNER ACTIONS =================
  const handleOpenBannerModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({ ...banner });
    } else {
      setEditingBanner(null);
      setBannerForm({
        id: `banner-${Date.now()}`,
        badge: 'Special Offer',
        headline: 'Flat 18% Off on All Medicines',
        subtext: 'Delivered in 45 minutes from verified pharmacies near you.',
        ctaText: 'Shop Now',
        ctaLink: '/shop',
        secondaryCtaText: 'Upload Rx',
        secondaryCtaLink: '/shop',
        theme: 'emerald',
        image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=1200',
        isActive: true,
      });
    }
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let updated;
      if (editingBanner) {
        updated = banners.map((b) => (b.id === editingBanner.id ? { ...bannerForm } : b));
        addToast('Banner updated successfully!', 'success');
      } else {
        updated = [...banners, { ...bannerForm, id: `banner-${Date.now()}` }];
        addToast('New homepage banner added!', 'success');
      }
      await saveBanners(updated);
      setIsBannerModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (banners.length <= 1) {
      addToast('At least one hero banner is required on the homepage.', 'error');
      return;
    }
    const filtered = banners.filter((b) => b.id !== id);
    await saveBanners(filtered);
    addToast('Banner removed from homepage.', 'success');
  };

  const handleToggleBannerActive = async (id) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b));
    await saveBanners(updated);
    addToast('Banner visibility toggled.', 'info');
  };

  // ================= CATEGORY ACTIONS =================
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ ...cat });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        id: `cat-${Date.now()}`,
        name: '',
        slug: '',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=240',
        description: '',
        isActive: true,
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let updated;
      if (editingCategory) {
        updated = categories.map((c) => (c.id === editingCategory.id ? { ...categoryForm } : c));
        addToast(`Category "${categoryForm.name}" updated!`, 'success');
      } else {
        const newCat = {
          ...categoryForm,
          id: categoryForm.slug || `cat-${Date.now()}`,
        };
        updated = [...categories, newCat];
        addToast(`Category "${categoryForm.name}" added!`, 'success');
      }
      await saveCategories(updated);
      setIsCategoryModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    const filtered = categories.filter((c) => c.id !== id);
    await saveCategories(filtered);
    addToast('Category removed.', 'success');
  };

  // ================= CATEGORY ITEMS / MEDICINES ACTIONS =================
  const currentCategoryItems = categoryItems[selectedParentCategory] || [];

  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({ ...item });
    } else {
      setEditingItem(null);
      setItemForm({
        id: `item-${Date.now()}`,
        name: '',
        genericName: '',
        brand: 'Cipla Ltd',
        slug: selectedParentCategory || 'general',
        mrp: '120',
        sellingPrice: '99',
        discount: '18%',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=350',
        isRxRequired: false,
        inStock: true,
      });
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!selectedParentCategory) {
      addToast('Please select a category first.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const parentItems = categoryItems[selectedParentCategory] || [];
      let updatedList;
      if (editingItem) {
        updatedList = parentItems.map((it) => (it.id === editingItem.id ? { ...itemForm } : it));
        addToast(`Item "${itemForm.name}" updated!`, 'success');
      } else {
        updatedList = [...parentItems, { ...itemForm, id: `item-${Date.now()}` }];
        addToast(`Item "${itemForm.name}" added to category!`, 'success');
      }

      const updatedMap = {
        ...categoryItems,
        [selectedParentCategory]: updatedList,
      };
      await saveCategoryItems(updatedMap);
      setIsItemModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    const parentItems = categoryItems[selectedParentCategory] || [];
    const updatedList = parentItems.filter((it) => it.id !== itemId);
    const updatedMap = {
      ...categoryItems,
      [selectedParentCategory]: updatedList,
    };
    await saveCategoryItems(updatedMap);
    addToast('Item removed from category.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Patient Home Page Controls
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Configure promotional hero banners, category layout, and item catalogs displayed on the patient interface.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={isLoading}
            leftIcon={RefreshCw}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 3 Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-brandBorder-subtle pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSection('banners')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSection === 'banners'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Hero Banners ({banners.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSection === 'categories'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories Section ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('category-items')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSection === 'category-items'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Category Items & Medicines</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: HERO BANNERS MANAGEMENT                             */}
      {/* ============================================================== */}
      {activeSection === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-forest-900">
              Active Promotional Hero Banners
            </h2>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => handleOpenBannerModal()}
              className="text-xs font-bold shadow-card"
            >
              Add New Banner
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((b, idx) => (
              <div
                key={b.id || idx}
                className={`bg-surface-pure rounded-3xl border ${
                  b.isActive ? 'border-brandBorder-subtle' : 'border-amber-200 bg-amber-50/20'
                } p-5 shadow-card relative overflow-hidden flex flex-col justify-between`}
              >
                <div>
                  {/* Banner Image Preview */}
                  <div className="w-full h-36 rounded-2xl overflow-hidden bg-forest-950/10 mb-3 relative">
                    <img
                      src={b.image}
                      alt={b.headline}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=600';
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-forest-900/80 text-white backdrop-blur-sm">
                      {b.badge || 'Offer'}
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-forest-800 backdrop-blur-sm">
                      Theme: {b.theme}
                    </div>
                  </div>

                  {/* Headline & Subtext */}
                  <h3 className="font-heading font-extrabold text-sm text-forest-900 line-clamp-2">
                    {b.headline}
                  </h3>
                  <p className="text-xs text-brandText-secondary mt-1 line-clamp-2">
                    {b.subtext}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-forest-700">
                    <span className="px-2 py-0.5 bg-forest-50 rounded-md">CTA: {b.ctaText}</span>
                    <span className="text-brandText-muted">&bull; Link: {b.ctaLink}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-brandBorder-subtle flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleBannerActive(b.id)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                      b.isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {b.isActive ? 'Active on Home' : 'Hidden'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenBannerModal(b)}
                      className="p-1.5 text-forest-700 hover:bg-forest-50 rounded-lg transition-colors"
                      title="Edit Banner"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(b.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: CATEGORIES SECTION CONTROLS                         */}
      {/* ============================================================== */}
      {activeSection === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-forest-900">
              Homepage Categories Section
            </h2>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => handleOpenCategoryModal()}
              className="text-xs font-bold shadow-card"
            >
              Add New Category
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((c, idx) => (
              <div
                key={c.id || idx}
                className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-4 shadow-card flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-100 overflow-hidden flex-shrink-0">
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=200';
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-forest-900">{c.name}</h3>
                    <p className="text-[10px] text-brandText-muted font-mono">{c.slug}</p>
                    <span className="inline-block mt-0.5 text-[9px] font-bold text-forest-700 bg-forest-50 px-1 py-0.5 rounded">
                      Active on Home
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenCategoryModal(c)}
                    className="p-1.5 text-forest-700 hover:bg-forest-50 rounded-lg"
                    title="Edit Category"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Remove Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: CATEGORY ITEMS & MEDICINES WITH IMAGES & PRICES    */}
      {/* ============================================================== */}
      {activeSection === 'category-items' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-pure rounded-3xl border border-brandBorder-subtle">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-forest-900 whitespace-nowrap">
                Select Parent Category:
              </label>
              <select
                value={selectedParentCategory}
                onChange={(e) => setSelectedParentCategory(e.target.value)}
                className="px-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold text-forest-800 focus:outline-none focus:border-forest-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => handleOpenItemModal()}
              className="text-xs font-bold shadow-card"
            >
              Add Item to "{categories.find((c) => c.id === selectedParentCategory)?.name || 'Category'}"
            </Button>
          </div>

          {currentCategoryItems.length === 0 ? (
            <div className="p-8 text-center bg-surface-pure rounded-3xl border border-dashed border-brandBorder-subtle">
              <Package className="w-8 h-8 text-forest-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-forest-900">No items listed in this category yet.</p>
              <p className="text-[11px] text-brandText-secondary mt-0.5">Click "Add Item" above to add products with image, price, and details.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentCategoryItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-4 shadow-card flex flex-col justify-between"
                >
                  <div>
                    {/* Item Image */}
                    <div className="w-full h-32 rounded-2xl bg-surface-warm border border-brandBorder-subtle/50 overflow-hidden mb-3 relative flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=350';
                        }}
                      />
                      {item.isRxRequired && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white">
                          Rx Required
                        </span>
                      )}
                    </div>

                    <h4 className="font-heading font-extrabold text-xs text-forest-900 line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-forest-700 font-medium line-clamp-1">
                      {item.genericName || item.brand || 'Genuine Medicine'}
                    </p>

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-forest-900">₹{item.sellingPrice || item.mrp}</span>
                      {item.mrp && Number(item.mrp) > Number(item.sellingPrice) && (
                        <span className="text-[10px] text-brandText-muted line-through">₹{item.mrp}</span>
                      )}
                      <span className="text-[10px] font-bold text-emerald-600">
                        {item.discount || `${Math.round(((Number(item.mrp || 100) - Number(item.sellingPrice || 85)) / Number(item.mrp || 100)) * 100)}% off`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-brandBorder-subtle flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenItemModal(item)}
                        className="p-1 text-forest-700 hover:bg-forest-50 rounded-lg"
                        title="Edit Item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT BANNER                                       */}
      {/* ============================================================== */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsBannerModalOpen(false)}
          />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface-pure rounded-3xl p-6 shadow-floating border border-brandBorder-subtle text-left relative animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  {editingBanner ? 'Edit Homepage Banner' : 'Add New Promotional Banner'}
                </h3>
                <button
                  onClick={() => setIsBannerModalOpen(false)}
                  className="p-1.5 text-brandText-muted hover:text-forest-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBanner} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Banner Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={bannerForm.image}
                    onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={bannerForm.badge}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                      placeholder="e.g. FLAT 18% OFF"
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Color Theme
                    </label>
                    <select
                      value={bannerForm.theme}
                      onChange={(e) => setBannerForm({ ...bannerForm, theme: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                    >
                      <option value="emerald">Emerald Green</option>
                      <option value="mint">Mint Refresh</option>
                      <option value="teal">Teal Healthcare</option>
                      <option value="sapphire">Sapphire Blue</option>
                      <option value="amber">Amber Warm</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Main Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.headline}
                    onChange={(e) => setBannerForm({ ...bannerForm, headline: e.target.value })}
                    placeholder="e.g. Quality Medicines Delivered in 45 Mins."
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Subtext / Description
                  </label>
                  <textarea
                    rows={2}
                    value={bannerForm.subtext}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtext: e.target.value })}
                    placeholder="Sourced strictly from licensed pharmacies near you."
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={bannerForm.ctaText}
                      onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                      placeholder="e.g. Order Now"
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      CTA Link Target
                    </label>
                    <input
                      type="text"
                      value={bannerForm.ctaLink}
                      onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
                      placeholder="/shop or /appointments"
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-brandBorder-subtle flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBannerModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSaving}
                    className="font-bold px-5"
                  >
                    Save Banner
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT CATEGORY                                     */}
      {/* ============================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsCategoryModalOpen(false)}
          />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface-pure rounded-3xl p-6 shadow-floating border border-brandBorder-subtle text-left relative animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  {editingCategory ? 'Edit Category' : 'Add Category'}
                </h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1.5 text-brandText-muted hover:text-forest-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Category Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                      })
                    }
                    placeholder="e.g. Ayurveda & Herbal Care"
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Slug ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Category Image / Icon URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={categoryForm.image}
                    onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-brandBorder-subtle flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCategoryModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSaving}
                    className="font-bold px-5"
                  >
                    Save Category
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT CATEGORY ITEM / MEDICINE                    */}
      {/* ============================================================== */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsItemModalOpen(false)}
          />
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface-pure rounded-3xl p-6 shadow-floating border border-brandBorder-subtle text-left relative animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                <h3 className="font-heading font-extrabold text-base text-forest-900">
                  {editingItem ? 'Edit Category Item' : 'Add Medicine / Product to Category'}
                </h3>
                <button
                  onClick={() => setIsItemModalOpen(false)}
                  className="p-1.5 text-brandText-muted hover:text-forest-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Medicine / Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. Dolo 650mg Tablet"
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Generic Composition
                    </label>
                    <input
                      type="text"
                      value={itemForm.genericName}
                      onChange={(e) => setItemForm({ ...itemForm, genericName: e.target.value })}
                      placeholder="e.g. Paracetamol 650mg"
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Brand / Manufacturer
                    </label>
                    <input
                      type="text"
                      value={itemForm.brand}
                      onChange={(e) => setItemForm({ ...itemForm, brand: e.target.value })}
                      placeholder="e.g. Micro Labs Ltd"
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Product Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={itemForm.image}
                    onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      MRP (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={itemForm.mrp}
                      onChange={(e) => setItemForm({ ...itemForm, mrp: e.target.value })}
                      placeholder="120"
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={itemForm.sellingPrice}
                      onChange={(e) => setItemForm({ ...itemForm, sellingPrice: e.target.value })}
                      placeholder="99"
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-forest-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.isRxRequired}
                      onChange={(e) => setItemForm({ ...itemForm, isRxRequired: e.target.checked })}
                      className="w-4 h-4 rounded text-forest-700"
                    />
                    <span>Prescription (Rx) Required</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-forest-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemForm.inStock}
                      onChange={(e) => setItemForm({ ...itemForm, inStock: e.target.checked })}
                      className="w-4 h-4 rounded text-forest-700"
                    />
                    <span>Available In Stock</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-brandBorder-subtle flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsItemModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSaving}
                    className="font-bold px-5"
                  >
                    Save Item Details
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomepageControlsPage;