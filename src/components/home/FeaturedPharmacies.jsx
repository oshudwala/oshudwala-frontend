import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { pharmaciesData } from '../../data/pharmaciesData';
import PharmacyCard from '../pharmacies/PharmacyCard';
import { useLanguage } from '../../context/LanguageContext';

export const FeaturedPharmacies = ({ onSelectPharmacy }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const { t } = useLanguage();

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
          {pharmaciesData.map((pharmacy) => (
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
