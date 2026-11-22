import React from 'react';
import { Star, Calendar, MapPin, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';

export const DoctorCard = ({ doctor, onBook, onSelect }) => {
  const { t } = useLanguage();

  const liveStatus = doctor.id ? localStorage.getItem(`oshud_doctor_status_${doctor.id}`) : null;

  return (
    <div
      onClick={() => onSelect && onSelect(doctor)}
      className="group bg-surface-pure rounded-3xl p-3 sm:p-4 border border-brandBorder-subtle hover:border-forest-400 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between cursor-pointer relative h-full select-none hover:-translate-y-1"
    >
      <div>
        {/* Creative Doctor Portrait Container */}
        <div className="relative mb-3 w-full aspect-square rounded-2xl overflow-hidden bg-forest-50/70 border border-forest-100/90 shadow-2xs">
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Top-Left Floating Specialty Tag */}
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-forest-950/80 backdrop-blur-md text-emerald-300 text-[10px] font-extrabold shadow-sm border border-emerald-400/20">
              {t(doctor.specialization, doctor.specialization)}
            </span>
          </div>

          {/* Top-Right Floating Rating */}
          <div className="absolute top-2 right-2 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-amber-900 text-[10px] font-extrabold shadow-sm border border-amber-200">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{doctor.rating}</span>
            </span>
          </div>

          {/* Verified Doctor Badge at Bottom-Right */}
          <div className="absolute bottom-2 right-2 z-10" title="Verified Medical Practitioner">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md ring-2 ring-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Doctor Information */}
        <div className="space-y-1 text-left px-0.5">
          <h3 className="font-heading font-extrabold text-sm sm:text-base text-forest-900 group-hover:text-forest-700 transition-colors line-clamp-1">
            {doctor.name}
          </h3>

          <p className="text-[11px] text-brandText-secondary font-medium truncate">
            {doctor.degrees || 'MBBS, MD'}
          </p>

          {/* Chamber / Clinic Location */}
          <div className="flex items-center gap-1 text-[11px] text-forest-800 font-semibold truncate pt-0.5">
            <MapPin className="w-3 h-3 text-forest-600 flex-shrink-0" />
            <span className="truncate">{doctor.clinicName || 'Apollo Clinic, Salt Lake'}</span>
          </div>

          {/* Badges Row: Experience + Live Status */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
            {doctor.experienceYears && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-warm text-brandText-secondary border border-brandBorder-subtle">
                <Award className="w-3 h-3 text-forest-600" />
                <span>{doctor.experienceYears}+ {t('experience_years', 'Yrs Exp')}</span>
              </span>
            )}

            {/* Live Chamber Status */}
            {liveStatus === 'ON_BREAK' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{t('on_break', 'On Break')}</span>
              </span>
            ) : liveStatus === 'OFFLINE' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <span>{t('chamber_offline', 'Offline')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{liveStatus === 'IN_CONSULTATION' ? t('in_chamber', 'In Chamber') : t('available_today', 'Available')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fee & Action Button */}
      <div className="pt-3 mt-2 border-t border-brandBorder-light/70 flex items-center justify-between gap-2">
        <div className="text-left">
          <span className="text-[9px] uppercase font-bold text-brandText-muted block leading-none">
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
          className="text-[11px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 font-bold shadow-xs group-hover:shadow rounded-xl bg-forest-800 hover:bg-forest-900 flex-1 max-w-[140px] justify-center"
        >
          {t('book_appointment', 'Book')}
        </Button>
      </div>
    </div>
  );
};

export default DoctorCard;
