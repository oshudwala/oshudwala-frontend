import React from 'react';
import { Star, MapPin, Clock, Building2, User, ArrowRight, Stethoscope } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const ClinicCard = ({ clinic, onSelect }) => {
  const { t } = useLanguage();

  return (
    <div
      onClick={() => onSelect && onSelect(clinic)}
      className="group bg-surface-pure rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-brandBorder-subtle hover:border-forest-300 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between h-full select-none text-left cursor-pointer"
    >
      <div>
        {/* Clinic Image & Badges */}
        <div className="relative mb-3 sm:mb-4 w-full aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden bg-forest-50 border border-forest-100 flex items-center justify-center">
          {clinic.image ? (
            <img
              src={clinic.image}
              alt={clinic.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-forest-50/90 text-forest-700">
              <Building2 className="w-10 h-10 text-forest-600 mb-1" />
              <span className="text-[11px] font-bold text-forest-800 line-clamp-1 px-2">{clinic.name}</span>
            </div>
          )}
          <div className="absolute top-2 left-2 bg-surface-pure/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-forest-800 shadow-sm flex items-center gap-1">
            <Building2 className="w-3 h-3 text-forest-600" />
            <span>{clinic.chamberCount}</span>
          </div>
          {clinic.isPrimary && (
            <div className="absolute bottom-2 left-2 bg-forest-800/95 text-white backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm">
              Primary Hub
            </div>
          )}
          <div className="absolute top-2 right-2 bg-surface-pure/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-forest-800 shadow-sm">
            {clinic.distance}
          </div>
        </div>

        {/* Clinic Name & Location */}
        <h3 className="font-heading font-bold text-sm sm:text-base text-forest-800 group-hover:text-forest-600 transition-colors line-clamp-1">
          {clinic.name}
        </h3>

        <p className="text-[11px] sm:text-xs text-brandText-secondary flex items-center gap-1 mt-1 truncate">
          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-forest-500 flex-shrink-0" />
          <span className="truncate">{clinic.address}</span>
        </p>

        {/* Rating & Hours */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs pt-1.5 pb-2 border-b border-brandBorder-light">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-bold text-brandText-main">{clinic.rating}</span>
            <span className="text-brandText-secondary">({clinic.reviewCount})</span>
          </div>
          <span className="text-emerald-700 font-semibold text-[10px] sm:text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('open_today', 'Open Today')}
          </span>
        </div>

        {/* Available Doctors & Receptionist Summary */}
        <div className="mt-3 p-2.5 rounded-xl bg-forest-50/70 border border-forest-100 text-xs space-y-1.5">
          {clinic.receptionistName && (
            <div className="flex items-center gap-1.5 text-forest-800 text-[11px] font-semibold truncate">
              <User className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
              <span className="truncate">Reception Desk: <strong>{clinic.receptionistName}</strong></span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-forest-100 text-forest-700 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-3 h-3" />
              </div>
              <div className="min-w-0 truncate">
                <p className="font-bold text-forest-800 text-[11px] truncate">
                  {clinic.doctorNames && clinic.doctorNames.length > 0
                    ? `Doctors: ${clinic.doctorNames.slice(0, 2).join(', ')}${clinic.doctorNames.length > 2 ? ' +' + (clinic.doctorNames.length - 2) : ''}`
                    : `${clinic.doctors?.length || 0} Doctors Available`}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
              {t('tokens_open', 'Tokens Open')}
            </span>
          </div>
        </div>
      </div>

      {/* Button: View Doctors for Appointment */}
      <div className="pt-3 sm:pt-4 mt-2 border-t border-brandBorder-light">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(clinic);
          }}
          className="w-full py-2 px-3.5 rounded-xl sm:rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all group-hover:scale-[1.01]"
        >
          <span>{t('view_doctors_book', 'View Doctors & Book')}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default ClinicCard;