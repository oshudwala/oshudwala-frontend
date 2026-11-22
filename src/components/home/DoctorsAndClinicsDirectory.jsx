import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Building2,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const DoctorsAndClinicsDirectory = () => {
  const navigate = useNavigate();
  const { t, isBengali } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
      {/* Sleek 2-Card Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
        {/* CARD 1: FIND DOCTORS */}
        <div
          onClick={() => navigate('/appointments?tab=doctors')}
          className="group relative bg-surface-pure hover:bg-forest-50/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-brandBorder-subtle hover:border-forest-400 shadow-subtle hover:shadow-card transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          {/* Subtle ambient accent */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-forest-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform duration-500" />

          <div className="relative z-10 space-y-4">
            {/* Top row: Icon + Tag */}
            <div className="flex items-center justify-between gap-3">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-forest-200 transition-all border border-forest-200/80 shadow-2xs">
                <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-forest-700" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-[11px] sm:text-xs font-bold shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                <span>{t('registered_doctors_badge', 'Verified Specialists')}</span>
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h3 className="text-base sm:text-xl font-heading font-extrabold text-forest-900 group-hover:text-forest-700 transition-colors">
                {t('find_doctors_title', 'Find Doctors')}
              </h3>
              <p className="text-xs sm:text-sm text-brandText-secondary leading-relaxed max-w-md">
                {t('find_doctors_subtitle', 'Browse certified specialists across General Medicine, Cardiology, Dermatology & more.')}
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-forest-800">
              <span className="inline-flex items-center gap-1 bg-surface-warm px-2.5 py-1 rounded-lg border border-brandBorder-subtle">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{isBengali ? 'অনলাইন ও চেম্বার বুকিং' : 'In-Person & Online'}</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-surface-warm px-2.5 py-1 rounded-lg border border-brandBorder-subtle">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>{isBengali ? 'দেরি ছাড়া পরামর্শ' : 'Zero Wait Time'}</span>
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="relative z-10 pt-4 mt-3 border-t border-brandBorder-light/70 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-forest-700 group-hover:text-forest-800 transition-colors">
              {t('browse_all_doctors', 'Browse All Doctors')}
            </span>
            <div className="w-8 h-8 rounded-full bg-forest-100 group-hover:bg-forest-700 text-forest-700 group-hover:text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-2xs">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CARD 2: EXPLORE CLINICS */}
        <div
          onClick={() => navigate('/appointments?tab=clinics')}
          className="group relative bg-surface-pure hover:bg-emerald-50/30 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-brandBorder-subtle hover:border-emerald-400 shadow-subtle hover:shadow-card transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          {/* Subtle ambient accent */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-100/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:scale-125 transition-transform duration-500" />

          <div className="relative z-10 space-y-4">
            {/* Top row: Icon + Tag */}
            <div className="flex items-center justify-between gap-3">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-emerald-200 transition-all border border-emerald-200/80 shadow-2xs">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] sm:text-xs font-bold shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('registered_clinics_badge', 'Partner Chambers')}</span>
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h3 className="text-base sm:text-xl font-heading font-extrabold text-forest-900 group-hover:text-emerald-700 transition-colors">
                {t('explore_clinics_title', 'Explore Clinics')}
              </h3>
              <p className="text-xs sm:text-sm text-brandText-secondary leading-relaxed max-w-md">
                {t('explore_clinics_subtitle', 'Locate partner polyclinics, diagnostic chambers & live digital queue tokens.')}
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-emerald-800">
              <span className="inline-flex items-center gap-1 bg-surface-warm px-2.5 py-1 rounded-lg border border-brandBorder-subtle">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{isBengali ? 'ডিজিটাল সিরিয়াল টোকেন' : 'Live Queue Tokens'}</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-surface-warm px-2.5 py-1 rounded-lg border border-brandBorder-subtle">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>{isBengali ? 'যাচাইকৃত চেম্বার' : 'Certified Poly-Clinics'}</span>
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="relative z-10 pt-4 mt-3 border-t border-brandBorder-light/70 flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
              {t('browse_all_clinics', 'Explore All Clinics')}
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-700 text-emerald-700 group-hover:text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-2xs">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorsAndClinicsDirectory;
