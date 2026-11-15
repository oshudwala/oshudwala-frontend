import React from 'react';
import { Star, ArrowRight, MapPin, Clock } from 'lucide-react';

export const PharmacyCard = ({ pharmacy, onSelect }) => {
  return (
    <div
      onClick={() => onSelect && onSelect(pharmacy)}
      className="group bg-surface-pure rounded-3xl p-4 sm:p-5 border border-brandBorder-subtle hover:border-forest-300 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer text-left"
    >
      <div>
        {/* Pharmacy Storefront Image */}
        <div className="relative mb-3.5 w-full aspect-[16/10] rounded-2xl overflow-hidden bg-forest-50 border border-forest-100">
          <img
            src={pharmacy.image}
            alt={pharmacy.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2.5 right-2.5 bg-surface-pure/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-forest-800 shadow-sm">
            {pharmacy.distance}
          </div>
        </div>

        {/* Pharmacy Info */}
        <h3 className="font-heading font-bold text-base text-forest-800 group-hover:text-forest-600 transition-colors truncate">
          {pharmacy.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 pt-1 text-xs">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="font-bold text-brandText-main">{pharmacy.rating}</span>
          <span className="text-brandText-secondary">({pharmacy.reviewCount})</span>
        </div>

        {/* Delivery Availability Status */}
        <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Delivery Available</span>
        </div>
      </div>

      {/* Button: View Pharmacy */}
      <div className="pt-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(pharmacy);
          }}
          className="w-full py-2 px-3.5 rounded-full bg-forest-50 hover:bg-forest-100 text-forest-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-forest-100"
        >
          <span>View Pharmacy</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default PharmacyCard;
