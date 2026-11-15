import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { pharmaciesData } from '../../data/pharmaciesData';
import PharmacyCard from '../pharmacies/PharmacyCard';

export const FeaturedPharmacies = ({ onSelectPharmacy }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.8;
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
            Featured Pharmacies
          </h2>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Trusted pharmacies near you
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-forest-700 hover:text-forest-800 group transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid on large screens, horizontal scroll on smaller */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {pharmaciesData.slice(0, 4).map((pharmacy) => (
          <PharmacyCard
            key={pharmacy.id}
            pharmacy={pharmacy}
            onSelect={(pharm) => {
              if (onSelectPharmacy) onSelectPharmacy(pharm);
              else navigate(`/shop?pharmacy=${pharm.id}`);
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedPharmacies;
