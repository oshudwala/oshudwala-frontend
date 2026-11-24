import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import PharmacyCard from '../pharmacies/PharmacyCard';
import { pharmacyService } from '../../services/pharmacyService';
import { useLanguage } from '../../context/LanguageContext';

export const FeaturedPharmacies = ({ onSelectPharmacy }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const { t } = useLanguage();
  const [pharmaciesList, setPharmaciesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPharmacies = async () => {
      setIsLoading(true);
      try {
        const res = await pharmacyService.getPharmacies();
        if (isMounted) {
          const list = Array.isArray(res?.pharmacies) ? res.pharmacies : [];
          // Prioritize pharmacies with medicine service (Single Entity rule)
          const medicineHubs = list.filter((p) => p.hasMedicineService !== false);
          setPharmaciesList(medicineHubs);
        }
      } catch (err) {
        console.warn('FeaturedPharmacies fetch error:', err);
        if (isMounted) setPharmaciesList([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPharmacies();
    return () => {
      isMounted = false;
    };
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // While loading: Show skeleton loader (never blank during load)
  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="flex items-end justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-forest-100 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-forest-50 rounded-lg animate-pulse" />
          </div>
          <div className="h-4 w-20 bg-forest-50 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-3 sm:gap-5 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="w-[195px] xs:w-[220px] sm:w-[280px] lg:w-[310px] flex-shrink-0 bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle animate-pulse space-y-3"
            >
              <div className="w-full aspect-[16/10] bg-forest-50/80 rounded-2xl" />
              <div className="h-4 w-3/4 bg-forest-100 rounded" />
              <div className="h-3 w-1/2 bg-forest-50 rounded" />
              <div className="h-7 w-full bg-forest-50 rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // If no pharmacies exist, remove section completely (no demo data)
  if (pharmaciesList.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800 tracking-tight">
            {t('featured_pharmacies', 'Featured Pharmacies')}
          </h2>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            {t('featured_pharmacies_subtitle', 'Trusted, certified partner pharmacies delivering near you')}
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-forest-700 hover:text-forest-800 group transition-colors"
        >
          <span>{t('view_all', 'View All')}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Horizontal Carousel Container with Left/Right Arrow Overlays */}
      <div className="relative group">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-card border border-brandBorder-subtle text-forest-800 flex items-center justify-center hover:bg-forest-50 hover:scale-105 transition-all z-10 focus:outline-none"
          aria-label="Previous pharmacies"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Horizontal Scrollable Row for Desktop and Mobile */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 sm:pb-4 pt-1 snap-x snap-mandatory"
        >
          {pharmaciesList.map((pharmacy) => (
            <div
              key={pharmacy.id}
              className="w-[195px] xs:w-[220px] sm:w-[280px] lg:w-[310px] flex-shrink-0 snap-start"
            >
              <PharmacyCard
                pharmacy={pharmacy}
                onSelect={(pharm) => {
                  if (onSelectPharmacy) onSelectPharmacy(pharm);
                  else navigate(`/shop?pharmacy=${pharm.id}`);
                }}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-card border border-brandBorder-subtle text-forest-800 flex items-center justify-center hover:bg-forest-50 hover:scale-105 transition-all z-10 focus:outline-none"
          aria-label="Next pharmacies"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default FeaturedPharmacies;
