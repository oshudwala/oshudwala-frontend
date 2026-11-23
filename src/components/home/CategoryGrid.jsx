import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { parentCategories, categoryItemsByParent, categoryCardsData } from '../../data/categoriesData';
import { useLanguage } from '../../context/LanguageContext';

export const CategoryGrid = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [categoriesList, setCategoriesList] = useState(parentCategories);
  const [itemsMap, setItemsMap] = useState(categoryItemsByParent);
  const [activeParentTab, setActiveParentTab] = useState('personal-care');

  useEffect(() => {
    try {
      const rawCats = localStorage.getItem('oshud_homepage_categories');
      if (rawCats) {
        const parsed = JSON.parse(rawCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategoriesList(parsed);
          if (parsed[0]?.id) {
            setActiveParentTab(parsed[0].id);
          }
        }
      }
      const rawItems = localStorage.getItem('oshud_homepage_category_items');
      if (rawItems) {
        const parsed = JSON.parse(rawItems);
        if (parsed && typeof parsed === 'object') {
          setItemsMap(parsed);
        }
      }
    } catch {}
  }, []);

  // Dynamically filter cards based on the selected parent category tab
  const currentCards = itemsMap[activeParentTab] || categoryItemsByParent[activeParentTab] || categoryCardsData;

  const getParentCategoryName = (parent) => {
    const keyMap = {
      'personal-care': 'cat_personal_care',
      'health-care': 'cat_health_care',
      'baby-mother': 'cat_baby_mother',
      'sexual-wellness': 'cat_sexual_wellness',
      'otc-medicine': 'cat_otc_medicine',
      'medical-devices': 'cat_medical_devices',
    };
    const key = keyMap[parent.id];
    return key ? t(key, parent.name) : parent.name;
  };

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-3 sm:mb-6">
        <div>
          <h2 className="text-base sm:text-2xl font-heading font-extrabold text-forest-800 tracking-tight">
            {t('categories_title', 'Categories')}
          </h2>
          <p className="hidden sm:block text-xs sm:text-sm text-brandText-secondary mt-1">
            {t('categories_subtitle', 'Browse genuine medicines, personal care, and specialized healthcare products')}
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-forest-700 hover:text-forest-800 group transition-colors"
        >
          <span>{t('view_all', 'View All')}</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* TOP BAR: Horizontal Master Category Tabs (Like Reference Image) */}
      <div className="border-b border-brandBorder-subtle/80 pb-2 sm:pb-3 mb-3.5 sm:mb-6">
        <div className="flex gap-4 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth">
          {categoriesList.map((parent) => {
            const isActive = activeParentTab === parent.id;
            return (
              <button
                key={parent.id}
                type="button"
                onClick={() => setActiveParentTab(parent.id)}
                className="group flex-shrink-0 flex flex-col items-center text-center pb-2 relative transition-all focus:outline-none min-w-[72px] sm:min-w-[105px]"
              >
                {/* Transparent/Studio Product Group Thumbnail */}
                <div className="w-12 h-10 xs:w-14 xs:h-12 sm:w-20 sm:h-14 flex items-center justify-center p-1 transition-transform duration-300 group-hover:scale-105">
                  <img
                    src={parent.image}
                    alt={parent.name}
                    className="max-h-full max-w-full object-contain mix-blend-multiply filter drop-shadow-sm"
                    loading="lazy"
                  />
                </div>

                {/* Tab Label */}
                <span
                  className={`text-[10px] xs:text-[11px] sm:text-xs font-semibold mt-1 transition-colors leading-tight whitespace-nowrap ${
                    isActive
                      ? 'text-forest-800 font-extrabold'
                      : 'text-brandText-secondary group-hover:text-forest-700'
                  }`}
                >
                  {getParentCategoryName(parent)}
                </span>

                {/* Active Indicator Underline (Reference Image Accent Underline) */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-[#174F38] via-[#16875B] to-[#174F38] rounded-full animate-fade-in" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM GRID: Category Cards (Filtered dynamically by active tab with clean packshots) */}
      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 xs:gap-3 sm:gap-4 lg:gap-5 animate-fade-in">
        {currentCards.map((category) => (
          <div
            key={category.id}
            onClick={() => navigate(`/shop?category=${category.slug}`)}
            className="group flex flex-col items-center cursor-pointer select-none"
          >
            {/* Square Soft-Tinted Card Container with Transparent Packshot */}
            <div className="w-full aspect-square rounded-2xl sm:rounded-3xl bg-[#F6F8FC] hover:bg-[#EEF3FA] border border-slate-100/90 hover:border-forest-300/80 shadow-2xs hover:shadow-subtle transition-all duration-300 p-2 xs:p-2.5 sm:p-4 flex items-center justify-center overflow-hidden group-hover:-translate-y-0.5">
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-contain p-1 mix-blend-multiply group-hover:scale-108 transition-transform duration-300 filter drop-shadow-sm"
                loading="lazy"
              />
            </div>

            {/* Label Below Card (Clean, Bold, Centered) */}
            <h3 className="font-heading font-bold text-[10px] xs:text-[11px] sm:text-xs text-forest-900 group-hover:text-forest-700 mt-1.5 sm:mt-2 text-center transition-colors line-clamp-2 leading-tight">
              {t(category.name, category.name)}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;