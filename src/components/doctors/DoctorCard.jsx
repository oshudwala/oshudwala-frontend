import React from 'react';
import { Star, Calendar, MapPin } from 'lucide-react';
import Button from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';

export const DoctorCard = ({ doctor, onBook, onSelect }) => {
  const { t } = useLanguage();

  const liveStatus = doctor.id ? localStorage.getItem(`oshud_doctor_status_${doctor.id}`) : null;

  return (
    <div
      onClick={() => onSelect && onSelect(doctor)}
      className="group bg-surface-pure rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-brandBorder-subtle hover:border-forest-400/80 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer relative h-full select-none hover:-translate-y-1"
    >
      <div>
        {/* Doctor Image with Theme-Matched Radiant Glow & Delicate Border */}
        <div className="relative mb-3.5 w-full aspect-square rounded-2xl p-[1.5px] bg-gradient-to-br from-forest-500/35 via-emerald-400/25 to-forest-700/40 shadow-[0_4px_18px_rgba(24,78,63,0.13)] group-hover:shadow-[0_6px_25px_rgba(16,185,129,0.25)] group-hover:from-forest-400/60 group-hover:to-emerald-500/60 transition-all duration-300">
          <div className="w-full h-full rounded-[14px] overflow-hidden bg-forest-50/70">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          </div>
        </div>

        {/* Doctor Information */}
        <div className="space-y-1 text-left px-0.5">
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-forest-900 group-hover:text-forest-700 transition-colors line-clamp-1">
            {doctor.name}
          </h3>

          <p className="text-[11px] text-brandText-secondary font-medium truncate">
            {doctor.specialization || doctor.specialty || 'General Physician'}
            {doctor.degrees ? ` • ${doctor.degrees.split('(')[0].trim()}` : ''}
          </p>

          {/* Chamber / Clinic Location */}
          <div className="flex items-center gap-1 text-[11px] text-forest-800 font-medium truncate pt-0.5">
            <MapPin className="w-3 h-3 text-forest-600 flex-shrink-0" />
            <span className="truncate">{doctor.clinicName || 'Partner Chamber, Kolkata'}</span>
          </div>

          {/* Minimalist Meta Row: Rating, Experience & Status */}
          <div className="flex items-center justify-between text-[11px] pt-2 text-brandText-secondary">
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="inline-flex items-center gap-0.5 font-bold text-forest-900">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{doctor.rating || 4.8}</span>
              </span>
              <span className="text-brandBorder-subtle">•</span>
              <span className="text-[10px] text-brandText-muted">
                {doctor.experienceYears || 5}+ yrs exp
              </span>
            </div>

            {/* Clean Live Status Indicator */}
            {liveStatus === 'ON_BREAK' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{t('on_break', 'Break')}</span>
              </span>
            ) : liveStatus === 'OFFLINE' ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                <span>{t('chamber_offline', 'Offline')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {liveStatus === 'IN_CONSULTATION'
                    ? t('in_chamber', 'In Chamber')
                    : t('available_today', 'Available')}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fee & Action Button */}
      <div className="pt-3 mt-2.5 border-t border-brandBorder-light/70 flex items-center justify-between gap-2">
        <div className="text-left">
          <span className="text-[9px] uppercase tracking-wider font-bold text-brandText-muted block leading-none">
            {t('consultation_fee', 'Fee')}
          </span>
          <span className="font-mono font-extrabold text-xs sm:text-sm text-forest-900 mt-0.5 block">
            ₹{doctor.consultationFee || 500}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={Calendar}
          onClick={(e) => {
            e.stopPropagation();
            onBook && onBook(doctor);
          }}
          className="text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 font-bold rounded-xl bg-forest-800 hover:bg-forest-900 flex-1 max-w-[130px] justify-center shadow-xs"
        >
          {t('book_appointment', 'Book')}
        </Button>
      </div>
    </div>
  );
};

export default DoctorCard;
