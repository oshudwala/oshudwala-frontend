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
  Check,
  Star,
  Stethoscope,
  Building2,
  Activity,
  ArrowUp,
  ArrowDown,
  Search,
  Filter,
  CheckCheck,
  MapPin,
  ChevronRight
} from 'lucide-react';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import adminApi from '../../services/api/admin.api';
import { parentCategories as initialCategories, categoryItemsByParent as initialCategoryItems } from '../../data/categoriesData';
import ImageDropzone from '../../components/common/ImageDropzone';

export const AdminHomepageControlsPage = () => {
  const { addToast } = useToast();
  // Section tab: 'banners' | 'categories' | 'category-items' | 'featured'
  const [activeSection, setActiveSection] = useState('banners');

  // Featured Section sub-tab: 'doctors' | 'clinics' | 'pharmacies'
  const [activeFeaturedSubTab, setActiveFeaturedSubTab] = useState('doctors');
  const [featuredDoctorsData, setFeaturedDoctorsData] = useState([]);
  const [featuredClinicsData, setFeaturedClinicsData] = useState([]);
  const [featuredPharmaciesData, setFeaturedPharmaciesData] = useState([]);
  const [featuredSearchQuery, setFeaturedSearchQuery] = useState('');
  const [featuredFilterMode, setFeaturedFilterMode] = useState('all'); // 'all' | 'featured'
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);

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
    heading: '',
    headline: '',
    paragraph: '',
    subtext: '',
    imageUrl: '',
    image: '',
    hasButton1: true,
    buttonText: 'Order Now',
    ctaText: 'Order Now',
    buttonLink: '/medicines',
    ctaLink: '/medicines',
    hasButton2: false,
    secondaryButtonText: '',
    secondaryCtaText: '',
    secondaryButtonLink: '',
    secondaryCtaLink: '',
    couponCode: '',
    badge: '',
    placement: 'HOME_TOP',
    sortOrder: 0,
    isActive: true,
    theme: 'emerald',
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

      // 1. Promotional Hero Banners (From Backend /promotions)
      try {
        const promoBanners = await adminApi.getPromotions('HOME_TOP');
        if (Array.isArray(promoBanners) && promoBanners.length > 0) {
          const mapped = promoBanners.map((p) => {
            let primaryText = p.buttonText || '';
            let primaryLink = p.buttonLink || '';
            let secondaryText = p.secondaryButtonText || '';
            let secondaryLink = p.secondaryButtonLink || '';

            if (!secondaryText && primaryLink && primaryLink.includes('||')) {
              const parts = primaryLink.split('||');
              primaryLink = parts[0] || '';
              secondaryText = parts[1] || '';
              secondaryLink = parts[2] || '';
            }

            return {
              id: p.id,
              heading: p.heading || '',
              headline: p.heading || '',
              paragraph: p.paragraph || '',
              subtext: p.paragraph || '',
              imageUrl: p.imageUrl || '',
              image: p.imageUrl || '',
              buttonText: primaryText,
              ctaText: primaryText,
              buttonLink: primaryLink,
              ctaLink: primaryLink,
              secondaryButtonText: secondaryText,
              secondaryCtaText: secondaryText,
              secondaryButtonLink: secondaryLink,
              secondaryCtaLink: secondaryLink,
              couponCode: p.couponCode || '',
              badge: p.couponCode ? `CODE: ${p.couponCode}` : (p.badge || ''),
              placement: p.placement || 'HOME_TOP',
              sortOrder: p.sortOrder ?? 0,
              isActive: p.isActive !== false,
              theme: 'emerald',
            };
          });
          setBanners(mapped);
          localStorage.setItem('oshud_homepage_banners', JSON.stringify(mapped));
        } else {
          const savedBanners = settings?.find?.((s) => s.key === 'homepage_banners')?.value;
          if (Array.isArray(savedBanners) && savedBanners.length > 0) {
            setBanners(savedBanners);
          } else {
            const local = localStorage.getItem('oshud_homepage_banners');
            setBanners(local ? JSON.parse(local) : []);
          }
        }
      } catch (bErr) {
        console.warn('Backend load promotions notice:', bErr.message);
        const local = localStorage.getItem('oshud_homepage_banners');
        setBanners(local ? JSON.parse(local) : []);
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

      // 4. Featured Entities & Ordering
      try {
        const entitiesRes = await adminApi.fetchAllEntities(false);

        const savedFeaturedDocs = settings?.find?.((s) => s.key === 'featured_doctors')?.value ||
          (() => { try { return JSON.parse(localStorage.getItem('oshud_featured_doctors') || '[]'); } catch { return []; } })();
        const savedDocOrders = settings?.find?.((s) => s.key === 'featured_doctors_order')?.value ||
          (() => { try { return JSON.parse(localStorage.getItem('oshud_featured_doctors_order') || '{}'); } catch { return {}; } })();

        const savedFeaturedClins = settings?.find?.((s) => s.key === 'featured_clinics')?.value ||
          (() => { try { return JSON.parse(localStorage.getItem('oshud_featured_clinics') || '[]'); } catch { return []; } })();
        const savedClinOrders = settings?.find?.((s) => s.key === 'featured_clinics_order')?.value ||
          (() => { try { return JSON.parse(localStorage.getItem('oshud_featured_clinics_order') || '{}'); } catch { return {}; } })();

        const savedFeaturedPharms = settings?.find?.((s) => s.key === 'featured_pharmacies')?.value ||
          (() => { try { return JSON.parse(localStorage.getItem('oshud_featured_pharmacies') || '[]'); } catch { return []; } })();
        const savedPharmOrders = settings?.find?.((s) => s.key === 'featured_pharmacies_order')?.value ||
          (() => { try { return JSON.parse(localStorage.getItem('oshud_featured_pharmacies_order') || '{}'); } catch { return {}; } })();

        // Map Doctors
        const mappedDocs = (entitiesRes.doctors || []).map((doc, idx) => {
          const isFeatured = Boolean(
            doc.isFeatured ||
            (Array.isArray(savedFeaturedDocs) && (savedFeaturedDocs.includes(doc.id) || (doc.userId && savedFeaturedDocs.includes(doc.userId))))
          );
          const explicitOrder = savedDocOrders[doc.id] || (doc.userId && savedDocOrders[doc.userId]);
          const arrayOrder = Array.isArray(savedFeaturedDocs) && savedFeaturedDocs.indexOf(doc.id) !== -1 ? savedFeaturedDocs.indexOf(doc.id) + 1 : null;
          const order = Number(explicitOrder || arrayOrder || (isFeatured ? idx + 1 : 999));
          return {
            id: doc.id,
            userId: doc.userId,
            name: doc.fullName || doc.name,
            fullName: doc.fullName,
            specialization: doc.specializations?.[0]?.specialization?.name || doc.specialization || 'General Physician',
            qualifications: doc.qualifications || 'MBBS',
            image: doc.imageUrl || doc.user?.imageUrl || '',
            city: doc.city || 'Durgapur',
            experienceYears: doc.experienceYears || 5,
            isFeatured,
            order,
          };
        });

        // Map Clinics
        const mappedClins = (entitiesRes.clinics || []).map((clin, idx) => {
          const isFeatured = Boolean(
            clin.isFeatured ||
            (Array.isArray(savedFeaturedClins) && savedFeaturedClins.includes(clin.id))
          );
          const explicitOrder = savedClinOrders[clin.id];
          const arrayOrder = Array.isArray(savedFeaturedClins) && savedFeaturedClins.indexOf(clin.id) !== -1 ? savedFeaturedClins.indexOf(clin.id) + 1 : null;
          const order = Number(explicitOrder || arrayOrder || (isFeatured ? idx + 1 : 999));
          return {
            id: clin.id,
            name: clin.name,
            address: clin.line1 || clin.address,
            city: clin.city || 'Durgapur',
            pincode: clin.pincode,
            chamberCount: 'Clinic Facility',
            image: clin.imageUrl || clin.logoUrl || '',
            isFeatured,
            order,
          };
        });

        // Map Pharmacies
        const mappedPharms = (entitiesRes.pharmacies || []).map((pharm, idx) => {
          const isFeatured = Boolean(
            pharm.isFeatured ||
            (Array.isArray(savedFeaturedPharms) && savedFeaturedPharms.includes(pharm.id))
          );
          const explicitOrder = savedPharmOrders[pharm.id];
          const arrayOrder = Array.isArray(savedFeaturedPharms) && savedFeaturedPharms.indexOf(pharm.id) !== -1 ? savedFeaturedPharms.indexOf(pharm.id) + 1 : null;
          const order = Number(explicitOrder || arrayOrder || (isFeatured ? idx + 1 : 999));
          return {
            id: pharm.id,
            name: pharm.name,
            address: pharm.line1 || pharm.address,
            city: pharm.city || 'Durgapur',
            pincode: pharm.pincode,
            licenseNumber: pharm.licenseNumber,
            image: pharm.imageUrl || pharm.logoUrl || '',
            isFeatured,
            order,
          };
        });

        setFeaturedDoctorsData(mappedDocs);
        setFeaturedClinicsData(mappedClins);
        setFeaturedPharmaciesData(mappedPharms);
      } catch (entErr) {
        console.warn('Error loading entities for featured controls:', entErr);
      }
    } catch (err) {
      console.error('Error loading homepage controls:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ================= FEATURED SECTION ACTIONS =================
  const handleSaveFeatured = async (type) => {
    setIsSavingFeatured(true);
    try {
      let list = [];
      if (type === 'doctors') list = featuredDoctorsData;
      else if (type === 'clinics') list = featuredClinicsData;
      else if (type === 'pharmacies') list = featuredPharmaciesData;

      await adminApi.saveFeaturedOrdering(type, list);
      addToast(`Featured ${type} ordering saved successfully! Patient home page updated.`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save featured ordering.', 'error');
    } finally {
      setIsSavingFeatured(false);
    }
  };

  const handleToggleFeatured = async (type, id) => {
    let targetItem = null;
    let nextList = [];

    const toggleInList = (list) => {
      const currentFeatured = list.filter((it) => it.isFeatured);
      const maxOrder = currentFeatured.reduce((max, it) => Math.max(max, Number(it.order) || 0), 0);
      return list.map((it) => {
        if (it.id === id) {
          const nextFeatured = !it.isFeatured;
          targetItem = {
            ...it,
            isFeatured: nextFeatured,
            order: nextFeatured ? (it.order && it.order < 900 ? it.order : maxOrder + 1) : it.order,
          };
          return targetItem;
        }
        return it;
      });
    };

    if (type === 'doctors') {
      nextList = toggleInList(featuredDoctorsData);
      setFeaturedDoctorsData(nextList);
    } else if (type === 'clinics') {
      nextList = toggleInList(featuredClinicsData);
      setFeaturedClinicsData(nextList);
    } else if (type === 'pharmacies') {
      nextList = toggleInList(featuredPharmaciesData);
      setFeaturedPharmaciesData(nextList);
    }

    if (targetItem) {
      try {
        await adminApi.saveFeaturedOrdering(type, nextList);
        addToast(
          targetItem.isFeatured
            ? `⭐ "${targetItem.name || targetItem.fullName}" added to Featured (Order #${targetItem.order})!`
            : `"${targetItem.name || targetItem.fullName}" removed from Featured on Home Page.`,
          'success'
        );
      } catch (err) {
        addToast('Failed to update featured status.', 'error');
      }
    }
  };

  const handleOrderChange = (type, id, newOrder) => {
    const parsed = Math.max(1, parseInt(newOrder, 10) || 1);
    const update = (list) => list.map((it) => (it.id === id ? { ...it, order: parsed } : it));
    if (type === 'doctors') setFeaturedDoctorsData(update);
    else if (type === 'clinics') setFeaturedClinicsData(update);
    else if (type === 'pharmacies') setFeaturedPharmaciesData(update);
  };

  const handleMoveOrder = async (type, id, direction) => {
    let list = [];
    if (type === 'doctors') list = [...featuredDoctorsData];
    else if (type === 'clinics') list = [...featuredClinicsData];
    else if (type === 'pharmacies') list = [...featuredPharmaciesData];

    const currentItem = list.find((it) => it.id === id);
    if (!currentItem) return;

    const currentOrder = Number(currentItem.order) || 1;
    const targetOrder = direction === 'up' ? Math.max(1, currentOrder - 1) : currentOrder + 1;

    // Find if another item has targetOrder to swap
    const partner = list.find((it) => it.isFeatured && Number(it.order) === targetOrder && it.id !== id);

    const updated = list.map((it) => {
      if (it.id === id) return { ...it, order: targetOrder };
      if (partner && it.id === partner.id) return { ...it, order: currentOrder };
      return it;
    });

    if (type === 'doctors') setFeaturedDoctorsData(updated);
    else if (type === 'clinics') setFeaturedClinicsData(updated);
    else if (type === 'pharmacies') setFeaturedPharmaciesData(updated);

    await adminApi.saveFeaturedOrdering(type, updated);
    addToast(`Order updated: "${currentItem.name || currentItem.fullName}" is now #${targetOrder}`, 'info');
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
      const hasBtn1 = Boolean(banner.buttonText || banner.ctaText);
      const hasBtn2 = Boolean(banner.secondaryButtonText || banner.secondaryCtaText);
      setBannerForm({
        id: banner.id,
        heading: banner.heading || banner.headline || '',
        headline: banner.heading || banner.headline || '',
        paragraph: banner.paragraph || banner.subtext || '',
        subtext: banner.paragraph || banner.subtext || '',
        imageUrl: banner.imageUrl || banner.image || '',
        image: banner.imageUrl || banner.image || '',
        hasButton1: hasBtn1,
        buttonText: banner.buttonText || banner.ctaText || (hasBtn1 ? 'Order Now' : ''),
        ctaText: banner.buttonText || banner.ctaText || (hasBtn1 ? 'Order Now' : ''),
        buttonLink: banner.buttonLink || banner.ctaLink || (hasBtn1 ? '/medicines' : ''),
        ctaLink: banner.buttonLink || banner.ctaLink || (hasBtn1 ? '/medicines' : ''),
        hasButton2: hasBtn2,
        secondaryButtonText: banner.secondaryButtonText || banner.secondaryCtaText || '',
        secondaryCtaText: banner.secondaryButtonText || banner.secondaryCtaText || '',
        secondaryButtonLink: banner.secondaryButtonLink || banner.secondaryCtaLink || '',
        secondaryCtaLink: banner.secondaryButtonLink || banner.secondaryCtaLink || '',
        couponCode: banner.couponCode || '',
        badge: banner.couponCode ? `CODE: ${banner.couponCode}` : (banner.badge || ''),
        placement: banner.placement || 'HOME_TOP',
        sortOrder: banner.sortOrder ?? 0,
        isActive: banner.isActive !== false,
        theme: banner.theme || 'emerald',
      });
    } else {
      setEditingBanner(null);
      setBannerForm({
        id: '',
        heading: '',
        headline: '',
        paragraph: '',
        subtext: '',
        imageUrl: '',
        image: '',
        hasButton1: true,
        buttonText: 'Order Now',
        ctaText: 'Order Now',
        buttonLink: '/medicines',
        ctaLink: '/medicines',
        hasButton2: false,
        secondaryButtonText: '',
        secondaryCtaText: '',
        secondaryButtonLink: '',
        secondaryCtaLink: '',
        couponCode: '',
        badge: '',
        placement: 'HOME_TOP',
        sortOrder: banners.length,
        isActive: true,
        theme: 'emerald',
      });
    }
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    const heading = (bannerForm.heading || bannerForm.headline || '').trim();
    if (!heading) {
      addToast('Banner headline is required.', 'error');
      return;
    }
    const imageUrl = (bannerForm.imageUrl || bannerForm.image || '').trim();
    if (!imageUrl) {
      addToast('Please upload or provide an image for the promotional banner.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        heading: heading,
        paragraph: bannerForm.paragraph !== undefined ? bannerForm.paragraph : (bannerForm.subtext || null),
        imageUrl: imageUrl,
        buttonText: bannerForm.hasButton1 && bannerForm.buttonText ? bannerForm.buttonText.trim() : null,
        buttonLink: bannerForm.hasButton1 && bannerForm.buttonLink ? bannerForm.buttonLink.trim() : null,
        secondaryButtonText: bannerForm.hasButton2 && bannerForm.secondaryButtonText ? bannerForm.secondaryButtonText.trim() : null,
        secondaryButtonLink: bannerForm.hasButton2 && bannerForm.secondaryButtonLink ? bannerForm.secondaryButtonLink.trim() : null,
        couponCode: bannerForm.couponCode ? bannerForm.couponCode.trim().toUpperCase() : null,
        placement: bannerForm.placement || 'HOME_TOP',
        sortOrder: Math.max(0, parseInt(bannerForm.sortOrder, 10) || 0),
        isActive: bannerForm.isActive !== false,
      };

      const isBackendId = editingBanner && editingBanner.id && !editingBanner.id.startsWith('banner-');

      if (isBackendId) {
        await adminApi.updatePromotion(editingBanner.id, payload);
        addToast(`Promotion banner "${heading}" updated successfully!`, 'success');
      } else {
        await adminApi.createPromotion(payload);
        addToast(`New promotional hero banner "${heading}" created on backend!`, 'success');
      }

      await loadData();
      setIsBannerModalOpen(false);
    } catch (err) {
      console.error('Save promotion error:', err);
      addToast(err.message || 'Failed to save promotional banner to backend.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBanner = async (id) => {
    const isBackendId = id && !id.startsWith('banner-');
    if (isBackendId) {
      try {
        await adminApi.deletePromotion(id);
        addToast('Promotional banner deleted from backend!', 'success');
        await loadData();
      } catch (err) {
        addToast(err.message || 'Failed to delete promotion from backend.', 'error');
      }
    } else {
      const filtered = banners.filter((b) => b.id !== id);
      setBanners(filtered);
      localStorage.setItem('oshud_homepage_banners', JSON.stringify(filtered));
      addToast('Banner removed from homepage.', 'success');
    }
  };

  const handleToggleBannerActive = async (id) => {
    const target = banners.find((b) => b.id === id);
    if (!target) return;
    const nextState = !target.isActive;

    // Optimistically update
    const updated = banners.map((b) => (b.id === id ? { ...b, isActive: nextState } : b));
    setBanners(updated);
    localStorage.setItem('oshud_homepage_banners', JSON.stringify(updated));

    const isBackendId = id && !id.startsWith('banner-');
    if (isBackendId) {
      try {
        await adminApi.updatePromotion(id, { isActive: nextState });
        addToast(nextState ? 'Banner active on patient home!' : 'Banner hidden from patient home.', 'info');
      } catch (err) {
        addToast(err.message || 'Failed to update visibility on backend.', 'error');
        await loadData();
      }
    } else {
      addToast(nextState ? 'Banner active on patient home!' : 'Banner hidden.', 'info');
    }
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

        <button
          onClick={() => setActiveSection('featured')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSection === 'featured'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Featured Section Controls ({featuredDoctorsData.filter((d) => d.isFeatured).length + featuredClinicsData.filter((c) => c.isFeatured).length + featuredPharmaciesData.filter((p) => p.isFeatured).length})</span>
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

          {banners.length === 0 ? (
            <div className="bg-surface-pure rounded-3xl border border-dashed border-brandBorder-subtle p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-forest-900 mb-1">
                No Promotional Hero Banners Added
              </h3>
              <p className="text-xs text-brandText-secondary max-w-sm mx-auto mb-4">
                The patient home page currently has zero promotional banners. Click below to add your first banner with custom heading, paragraph, and 1 or 2 action buttons.
              </p>
              <Button
                variant="primary"
                size="sm"
                leftIcon={Plus}
                onClick={() => handleOpenBannerModal()}
                className="text-xs font-bold shadow-card"
              >
                Add First Hero Banner
              </Button>
            </div>
          ) : (
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
                        src={b.imageUrl || b.image}
                        alt={b.heading || b.headline}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=600';
                        }}
                      />
                      {(b.couponCode || b.badge) && (
                        <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-forest-900/85 text-white backdrop-blur-sm border border-white/20 shadow-xs">
                          {b.couponCode ? `Coupon: ${b.couponCode}` : b.badge}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-forest-800 backdrop-blur-sm shadow-xs border border-brandBorder-subtle">
                        Order: #{b.sortOrder ?? 0}
                      </div>
                    </div>

                    {/* Headline & Subtext */}
                    <h3 className="font-heading font-extrabold text-sm text-forest-900 line-clamp-2">
                      {b.heading || b.headline}
                    </h3>
                    <p className="text-xs text-brandText-secondary mt-1 line-clamp-2">
                      {b.paragraph || b.subtext}
                    </p>

                    {/* Configured Action Buttons */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                      {(b.buttonText || b.ctaText) && (
                        <span className="px-2 py-0.5 bg-forest-50 text-forest-700 rounded-md border border-forest-100 flex items-center gap-1">
                          <span>Btn 1: {b.buttonText || b.ctaText}</span>
                          <span className="text-brandText-muted font-mono font-normal">({b.buttonLink || b.ctaLink || '/medicines'})</span>
                        </span>
                      )}
                      {(b.secondaryButtonText || b.secondaryCtaText) && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-100 flex items-center gap-1">
                          <span>Btn 2: {b.secondaryButtonText || b.secondaryCtaText}</span>
                          <span className="text-brandText-muted font-mono font-normal">({b.secondaryButtonLink || b.secondaryCtaLink || '/prescription'})</span>
                        </span>
                      )}
                      {!(b.buttonText || b.ctaText) && !(b.secondaryButtonText || b.secondaryCtaText) && (
                        <span className="text-brandText-muted text-[10px] italic">No action buttons</span>
                      )}
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
          )}
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
      {/* SECTION 4: FEATURED DOCTORS, CLINICS & PHARMACIES ORDERING     */}
      {/* ============================================================== */}
      {activeSection === 'featured' && (() => {
        const currentFeaturedList =
          activeFeaturedSubTab === 'doctors'
            ? featuredDoctorsData
            : activeFeaturedSubTab === 'clinics'
            ? featuredClinicsData
            : featuredPharmaciesData;

        const orderedLiveItems = currentFeaturedList
          .filter((it) => it.isFeatured)
          .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

        const filteredFeaturedList = currentFeaturedList
          .filter((item) => {
            const q = featuredSearchQuery.trim().toLowerCase();
            const matchSearch =
              !q ||
              item.name?.toLowerCase().includes(q) ||
              item.fullName?.toLowerCase().includes(q) ||
              item.specialization?.toLowerCase().includes(q) ||
              item.city?.toLowerCase().includes(q) ||
              item.address?.toLowerCase().includes(q);

            const matchFilter = featuredFilterMode === 'featured' ? item.isFeatured : true;
            return matchSearch && matchFilter;
          })
          .sort((a, b) => {
            if (a.isFeatured && b.isFeatured) {
              return (Number(a.order) || 999) - (Number(b.order) || 999);
            }
            if (a.isFeatured) return -1;
            if (b.isFeatured) return 1;
            return (a.name || '').localeCompare(b.name || '');
          });

        return (
          <div className="space-y-5 animate-fade-in">
            {/* Top Sub-tabs & Save Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-pure p-4 rounded-3xl border border-brandBorder-subtle shadow-xs">
              {/* 3 Sub-tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-surface-warm rounded-2xl border border-brandBorder-subtle/80 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFeaturedSubTab('doctors');
                    setFeaturedSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeFeaturedSubTab === 'doctors'
                      ? 'bg-white text-forest-900 shadow-sm border border-brandBorder-subtle'
                      : 'text-brandText-secondary hover:text-forest-800'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-forest-700" />
                  <span>Doctors ({featuredDoctorsData.filter((d) => d.isFeatured).length} Featured)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFeaturedSubTab('clinics');
                    setFeaturedSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeFeaturedSubTab === 'clinics'
                      ? 'bg-white text-forest-900 shadow-sm border border-brandBorder-subtle'
                      : 'text-brandText-secondary hover:text-forest-800'
                  }`}
                >
                  <Activity className="w-4 h-4 text-forest-700" />
                  <span>Clinics ({featuredClinicsData.filter((c) => c.isFeatured).length} Featured)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFeaturedSubTab('pharmacies');
                    setFeaturedSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeFeaturedSubTab === 'pharmacies'
                      ? 'bg-white text-forest-900 shadow-sm border border-brandBorder-subtle'
                      : 'text-brandText-secondary hover:text-forest-800'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-forest-700" />
                  <span>Pharmacies ({featuredPharmaciesData.filter((p) => p.isFeatured).length} Featured)</span>
                </button>
              </div>

              {/* Save Ordering Button */}
              <Button
                variant="primary"
                size="sm"
                leftIcon={Save}
                isLoading={isSavingFeatured}
                onClick={() => handleSaveFeatured(activeFeaturedSubTab)}
                className="text-xs font-bold shadow-card px-4"
              >
                Save {activeFeaturedSubTab === 'doctors' ? 'Doctors' : activeFeaturedSubTab === 'clinics' ? 'Clinics' : 'Pharmacies'} Ordering
              </Button>
            </div>

            {/* Live Home Page Carousel Order Sequence Ribbon */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-forest-50 to-amber-50 border border-brandBorder-subtle rounded-3xl space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span className="text-xs font-extrabold text-forest-900 uppercase tracking-wider">
                    Live Home Page Carousel Order ({orderedLiveItems.length} Featured)
                  </span>
                </div>
                <span className="text-[11px] text-brandText-secondary font-medium hidden sm:inline">
                  Appears left-to-right on Patient Home in this exact order
                </span>
              </div>

              {orderedLiveItems.length === 0 ? (
                <div className="py-2 text-xs text-brandText-muted italic flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>No {activeFeaturedSubTab} currently selected as featured. Click "+ Feature on Home" below to feature profiles on the homepage.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                  {orderedLiveItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-forest-200 rounded-2xl shadow-xs flex-shrink-0"
                    >
                      <span className="w-5 h-5 rounded-full bg-forest-800 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-forest-50 overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-forest-700">
                            {activeFeaturedSubTab === 'doctors' ? (
                              <Stethoscope className="w-3.5 h-3.5" />
                            ) : (
                              <Building2 className="w-3.5 h-3.5" />
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-forest-900 max-w-[130px] truncate">{item.name}</p>
                        <p className="text-[10px] text-forest-700 font-semibold">Rank #{item.order}</p>
                      </div>
                      {idx < orderedLiveItems.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-forest-400 ml-1 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={featuredSearchQuery}
                  onChange={(e) => setFeaturedSearchQuery(e.target.value)}
                  placeholder={`Search ${activeFeaturedSubTab} by name, specialty or city...`}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFeaturedFilterMode('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    featuredFilterMode === 'all'
                      ? 'bg-forest-800 text-white shadow-xs'
                      : 'bg-surface-warm text-brandText-secondary hover:text-forest-900'
                  }`}
                >
                  All ({currentFeaturedList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFeaturedFilterMode('featured')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    featuredFilterMode === 'featured'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                      : 'bg-surface-warm text-brandText-secondary hover:text-forest-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                  <span>Featured Only ({orderedLiveItems.length})</span>
                </button>
              </div>
            </div>

            {/* List of Entities with Order Number Controls */}
            {filteredFeaturedList.length === 0 ? (
              <div className="p-8 text-center bg-surface-pure rounded-3xl border border-dashed border-brandBorder-subtle">
                <AlertCircle className="w-8 h-8 text-forest-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-forest-900">No {activeFeaturedSubTab} match your filter.</p>
                <p className="text-[11px] text-brandText-secondary mt-0.5">Try adjusting your search query or filter mode.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredFeaturedList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-3xl border transition-all ${
                      item.isFeatured
                        ? 'bg-surface-pure border-amber-300/80 shadow-card ring-1 ring-amber-300/30'
                        : 'bg-surface-pure/80 border-brandBorder-subtle/80 hover:border-brandBorder-subtle'
                    } flex items-center justify-between gap-3`}
                  >
                    {/* Left: Reorder Controls & Entity Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Order Number Box & Up/Down Stepper */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="flex flex-col items-center">
                          <button
                            type="button"
                            disabled={!item.isFeatured || item.order <= 1}
                            onClick={() => handleMoveOrder(activeFeaturedSubTab, item.id, 'up')}
                            className="p-1 text-forest-700 hover:bg-forest-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move up in display order"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={!item.isFeatured}
                            onClick={() => handleMoveOrder(activeFeaturedSubTab, item.id, 'down')}
                            className="p-1 text-forest-700 hover:bg-forest-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Move down in display order"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-center">
                          <span className="block text-[9px] font-extrabold uppercase tracking-wider text-brandText-muted mb-0.5">
                            Order
                          </span>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={item.order || 1}
                            disabled={!item.isFeatured}
                            onChange={(e) => handleOrderChange(activeFeaturedSubTab, item.id, e.target.value)}
                            className={`w-12 py-1 text-center text-xs font-mono font-bold rounded-xl border transition-all ${
                              item.isFeatured
                                ? 'bg-white border-forest-500 text-forest-900 shadow-xs ring-1 ring-forest-500/20'
                                : 'bg-surface-warm border-brandBorder-subtle text-brandText-muted cursor-not-allowed'
                            }`}
                            title="Set order number on patient homepage"
                          />
                        </div>
                      </div>

                      {/* Photo */}
                      <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-brandBorder-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : activeFeaturedSubTab === 'doctors' ? (
                          <Stethoscope className="w-5 h-5 text-forest-700" />
                        ) : (
                          <Building2 className="w-5 h-5 text-forest-700" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-heading font-extrabold text-xs text-forest-900 truncate">
                            {item.name || item.fullName}
                          </h4>
                          {item.isFeatured && (
                            <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full border border-amber-300">
                              Order #{item.order}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-forest-700 font-medium truncate mt-0.5">
                          {activeFeaturedSubTab === 'doctors'
                            ? `${item.specialization} &bull; ${item.qualifications || 'MBBS'}`
                            : activeFeaturedSubTab === 'clinics'
                            ? `Clinic Facility &bull; ${item.city || 'Durgapur'}`
                            : `Lic: ${item.licenseNumber || 'Verified'} &bull; ${item.city || 'Durgapur'}`}
                        </p>

                        <p className="text-[10px] text-brandText-muted truncate mt-0.5">
                          {item.address || `${item.city || 'Durgapur'}, West Bengal`}
                        </p>
                      </div>
                    </div>

                    {/* Right: Toggle Button */}
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(activeFeaturedSubTab, item.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                          item.isFeatured
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                            : 'bg-surface-warm text-brandText-muted border border-brandBorder-subtle hover:bg-forest-50 hover:text-forest-800'
                        }`}
                        title="Toggle visibility in featured section on patient home page"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${item.isFeatured ? 'text-amber-600 fill-amber-500' : ''}`} />
                        <span>{item.isFeatured ? 'Featured' : '+ Feature'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

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
                <ImageDropzone
                  value={bannerForm.imageUrl || bannerForm.image}
                  onChange={(img) => setBannerForm((prev) => ({ ...prev, imageUrl: img, image: img }))}
                  label="Banner Promotional Image *"
                  description="Drag & drop promotional banner creative here or click to browse"
                  aspectRatio="banner"
                />

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Main Heading (Headline) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.heading || bannerForm.headline || ''}
                    onChange={(e) => setBannerForm({ ...bannerForm, heading: e.target.value, headline: e.target.value })}
                    placeholder="e.g. Quality Medicines Delivered in 45 Mins."
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Paragraph / Description
                  </label>
                  <textarea
                    rows={2}
                    value={bannerForm.paragraph !== undefined ? bannerForm.paragraph : (bannerForm.subtext || '')}
                    onChange={(e) => setBannerForm({ ...bannerForm, paragraph: e.target.value, subtext: e.target.value })}
                    placeholder="e.g. Sourced strictly from licensed pharmacies near you in Durgapur."
                    className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Coupon Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={bannerForm.couponCode || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, couponCode: e.target.value.toUpperCase() })}
                      placeholder="e.g. OSHUD20"
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={bannerForm.sortOrder ?? 0}
                      onChange={(e) => setBannerForm({ ...bannerForm, sortOrder: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      placeholder="0"
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                    />
                  </div>
                </div>

                {/* Action Buttons Section (Max 2 Buttons) */}
                <div className="border border-brandBorder-subtle rounded-2xl p-3 bg-surface-warm/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-forest-900 block">Action Buttons (Max 2)</span>
                      <span className="text-[10px] text-brandText-muted">Optional action buttons for patients</span>
                    </div>
                    {!bannerForm.hasButton2 && (
                      <button
                        type="button"
                        onClick={() => setBannerForm((prev) => ({
                          ...prev,
                          hasButton2: true,
                          secondaryButtonText: prev.secondaryButtonText || 'Upload Prescription',
                          secondaryButtonLink: prev.secondaryButtonLink || '/prescription',
                          secondaryCtaText: prev.secondaryButtonText || 'Upload Prescription',
                          secondaryCtaLink: prev.secondaryButtonLink || '/prescription',
                        }))}
                        className="text-[11px] font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Second Button
                      </button>
                    )}
                  </div>

                  {/* Button 1 Configuration */}
                  <div className="bg-surface-pure rounded-xl p-2.5 border border-brandBorder-subtle space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={bannerForm.hasButton1}
                          onChange={(e) => setBannerForm({ ...bannerForm, hasButton1: e.target.checked })}
                          className="rounded text-forest-700 w-3.5 h-3.5"
                        />
                        <span className="text-xs font-bold text-forest-800">Primary Button (Button 1)</span>
                      </label>
                      {bannerForm.hasButton1 && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          Active
                        </span>
                      )}
                    </div>

                    {bannerForm.hasButton1 && (
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-brandText-secondary mb-1">
                            Button Text *
                          </label>
                          <input
                            type="text"
                            value={bannerForm.buttonText || bannerForm.ctaText || ''}
                            onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value, ctaText: e.target.value })}
                            placeholder="e.g. Order Now"
                            className="w-full px-2.5 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-brandText-secondary mb-1">
                            Redirect Link *
                          </label>
                          <input
                            type="text"
                            value={bannerForm.buttonLink || bannerForm.ctaLink || ''}
                            onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value, ctaLink: e.target.value })}
                            placeholder="/medicines or /doctors"
                            className="w-full px-2.5 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-lg font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Button 2 Configuration (Optional) */}
                  {bannerForm.hasButton2 && (
                    <div className="bg-surface-pure rounded-xl p-2.5 border border-brandBorder-subtle space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={bannerForm.hasButton2}
                            onChange={(e) => setBannerForm({ ...bannerForm, hasButton2: e.target.checked })}
                            className="rounded text-forest-700 w-3.5 h-3.5"
                          />
                          <span className="text-xs font-bold text-forest-800">Secondary Button (Button 2)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setBannerForm({
                            ...bannerForm,
                            hasButton2: false,
                            secondaryButtonText: '',
                            secondaryCtaText: '',
                            secondaryButtonLink: '',
                            secondaryCtaLink: '',
                          })}
                          className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-brandText-secondary mb-1">
                            Button Text
                          </label>
                          <input
                            type="text"
                            value={bannerForm.secondaryButtonText || bannerForm.secondaryCtaText || ''}
                            onChange={(e) => setBannerForm({ ...bannerForm, secondaryButtonText: e.target.value, secondaryCtaText: e.target.value })}
                            placeholder="e.g. Upload Prescription"
                            className="w-full px-2.5 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-brandText-secondary mb-1">
                            Redirect Link
                          </label>
                          <input
                            type="text"
                            value={bannerForm.secondaryButtonLink || bannerForm.secondaryCtaLink || ''}
                            onChange={(e) => setBannerForm({ ...bannerForm, secondaryButtonLink: e.target.value, secondaryCtaLink: e.target.value })}
                            placeholder="/prescription or prescription_modal"
                            className="w-full px-2.5 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-lg font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Placement
                    </label>
                    <select
                      value={bannerForm.placement || 'HOME_TOP'}
                      onChange={(e) => setBannerForm({ ...bannerForm, placement: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium"
                    >
                      <option value="HOME_TOP">Home Page Top (Hero)</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={bannerForm.isActive !== false}
                        onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                        className="rounded text-forest-700 w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-brandText-main">Active on Patient Home</span>
                    </label>
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

                <ImageDropzone
                  value={categoryForm.image}
                  onChange={(img) => setCategoryForm((prev) => ({ ...prev, image: img }))}
                  label="Category Image / Icon *"
                  description="Drag & drop category icon or graphic here or click to browse"
                  aspectRatio="square"
                />

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

                <ImageDropzone
                  value={itemForm.image}
                  onChange={(img) => setItemForm((prev) => ({ ...prev, image: img }))}
                  label="Product Medicine Image *"
                  description="Drag & drop product packaging or bottle image here or browse"
                  aspectRatio="square"
                />

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