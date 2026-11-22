import React, { useState, useEffect } from 'react';
import { Star, ArrowRight, MapPin, Clock } from 'lucide-react';
import { pharmacyApi } from '../../services/api/pharmacy.api';
import { useLanguage } from '../../context/LanguageContext';

export const PharmacyCard = ({ pharmacy, onSelect }) => {
  const { t } = useLanguage();
  const [liveStatus, setLiveStatus] = useState(() => {
    return pharmacyApi.getPharmacyStatus(pharmacy?.id);
  });

  useEffect(() => {
    const handleStatusSync = (e) => {
      const { pharmacyId, status } = e.detail || {};
      if (!pharmacyId || pharmacyId === 'current' || pharmacyId === pharmacy?.id) {
        setLiveStatus(status || 'OPEN');
      }
    };

    window.addEventListener('oshud_pharmacy_status_changed', handleStatusSync);
    return () => window.removeEventListener('oshud_pharmacy_status_changed', handleStatusSync);
  }, [pharmacy?.id]);

  return (
    <div
      onClick={() => onSelect && onSelect(pharmacy)}
      className="group bg-surface-pure rounded-2xl sm:rounded-3xl p-3 xs:p-3.5 sm:p-5 border border-brandBorder-subtle hover:border-forest-300 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer text-left h-full select-none"
    >
      <div>
        {/* Pharmacy Storefront Image */}
        <div className="relative mb-2.5 sm:mb-3.5 w-full aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden bg-forest-50 border border-forest-100">
          <img
            src={pharmacy.image}
            alt={pharmacy.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 bg-surface-pure/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-forest-800 shadow-sm">
            {pharmacy.distance}
          </div>
        </div>

        {/* Pharmacy Info */}
        <h3 className="font-heading font-bold text-xs xs:text-sm sm:text-base text-forest-800 group-hover:text-forest-600 transition-colors truncate">
          {pharmacy.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 sm:gap-1.5 pt-0.5 sm:pt-1 text-[10px] sm:text-xs">
          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
          <span className="font-bold text-brandText-main">{pharmacy.rating}</span>
          <span className="text-brandText-secondary">({pharmacy.reviewCount})</span>
        </div>

        {/* Delivery Availability Status - Live Connected */}
        <div className="pt-1.5 sm:pt-2 flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold">
          {liveStatus === 'OPEN' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 font-bold">{t('open_for_delivery', 'Open for Delivery')}</span>
            </>
          )}
          {liveStatus === 'BUSY' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-700 font-bold">{t('high_volume_delays', 'High Volume (Delays Expected)')}</span>
            </>
          )}
          {liveStatus === 'CLOSED' && (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-700 font-bold">{t('closed_for_delivery', 'Closed for Delivery')}</span>
            </>
          )}
        </div>
      </div>

      {/* Button: View Pharmacy */}
      <div className="pt-2.5 sm:pt-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(pharmacy);
          }}
          className="w-full py-1.5 xs:py-2 sm:py-2 px-2.5 sm:px-3.5 rounded-xl sm:rounded-full bg-forest-50 hover:bg-forest-100 text-forest-700 font-bold text-[10px] xs:text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-colors border border-forest-100"
        >
          <span>{t('view_pharmacy', 'View Pharmacy')}</span>
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default PharmacyCard;