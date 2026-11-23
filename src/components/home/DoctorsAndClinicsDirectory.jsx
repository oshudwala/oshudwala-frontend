import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const DoctorsAndClinicsDirectory = () => {
  const navigate = useNavigate();
  const { t, isBengali } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
      {/* 2-Card Directory Grid: 2 columns horizontally in same line on mobile, 2 columns on desktop */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-6">
        {/* CARD 1: FIND DOCTORS */}
        <div
          onClick={() => navigate('/appointments?tab=doctors')}
          className="group relative bg-surface-pure hover:bg-forest-50/25 rounded-2xl sm:rounded-3xl border border-forest-200/90 sm:border-brandBorder-subtle hover:border-forest-500/50 shadow-[0_3px_12px_rgba(24,78,63,0.08)] sm:shadow-subtle hover:shadow-card transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row items-stretch"
        >
          {/* Top Image on Mobile, Right Image on Large Screen */}
          <div className="w-full sm:w-[42%] relative overflow-hidden bg-forest-50 h-28 xs:h-32 sm:h-auto sm:min-h-[170px] order-first sm:order-last flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600"
              alt="Find Doctors"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            {/* Subtle soft gradient fade into card body */}
            <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-surface-pure/40 via-transparent to-transparent pointer-events-none" />
            <div className="sm:hidden absolute inset-0 bg-gradient-to-t from-surface-pure/25 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Text Content (Left on desktop, Bottom on mobile) */}
          <div className="flex-1 p-2.5 xs:p-3.5 sm:p-7 flex flex-col justify-between z-10 space-y-2 sm:space-y-4 order-last sm:order-first">
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-3">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-forest-600 animate-pulse flex-shrink-0" />
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-forest-700 truncate">
                  {isBengali ? 'বিশেষজ্ঞ ডাক্তার' : 'Specialist Directory'}
                </span>
              </div>

              <h3 className="text-xs xs:text-sm sm:text-2xl font-heading font-extrabold text-forest-900 group-hover:text-forest-700 transition-colors leading-tight">
                {t('find_doctors_title', 'Find Doctors')}
              </h3>

              <p className="text-[10px] xs:text-[11px] sm:text-sm text-brandText-secondary leading-snug sm:leading-relaxed mt-0.5 sm:mt-1.5 line-clamp-1 sm:line-clamp-none max-w-sm">
                {t(
                  'find_doctors_subtitle',
                  'Browse certified specialists across General Medicine, Cardiology, Dermatology & more.'
                )}
              </p>
            </div>

            {/* Action Row */}
            <div className="pt-1.5 sm:pt-4 flex items-center justify-between sm:justify-start gap-1 sm:gap-2 text-[10px] xs:text-xs sm:text-sm font-bold text-forest-800 group-hover:text-forest-600 transition-colors">
              <span className="truncate">{t('browse_all_doctors', 'Browse All Doctors')}</span>
              <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full bg-forest-100 group-hover:bg-forest-700 text-forest-800 group-hover:text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-2xs flex-shrink-0">
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: EXPLORE CLINICS */}
        <div
          onClick={() => navigate('/appointments?tab=clinics')}
          className="group relative bg-surface-pure hover:bg-emerald-50/25 rounded-2xl sm:rounded-3xl border border-emerald-200/90 sm:border-brandBorder-subtle hover:border-emerald-500/50 shadow-[0_3px_12px_rgba(24,78,63,0.08)] sm:shadow-subtle hover:shadow-card transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row items-stretch"
        >
          {/* Top Image on Mobile, Right Image on Large Screen */}
          <div className="w-full sm:w-[42%] relative overflow-hidden bg-emerald-50 h-28 xs:h-32 sm:h-auto sm:min-h-[170px] order-first sm:order-last flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600"
              alt="Explore Clinics"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            {/* Subtle soft gradient fade into card body */}
            <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-surface-pure/40 via-transparent to-transparent pointer-events-none" />
            <div className="sm:hidden absolute inset-0 bg-gradient-to-t from-surface-pure/25 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Text Content (Left on desktop, Bottom on mobile) */}
          <div className="flex-1 p-2.5 xs:p-3.5 sm:p-7 flex flex-col justify-between z-10 space-y-2 sm:space-y-4 order-last sm:order-first">
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-3">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
                <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 truncate">
                  {isBengali ? 'চেম্বার ও ক্লিনিক' : 'Chambers & Clinics'}
                </span>
              </div>

              <h3 className="text-xs xs:text-sm sm:text-2xl font-heading font-extrabold text-forest-900 group-hover:text-emerald-700 transition-colors leading-tight">
                {t('explore_clinics_title', 'Explore Clinics')}
              </h3>

              <p className="text-[10px] xs:text-[11px] sm:text-sm text-brandText-secondary leading-snug sm:leading-relaxed mt-0.5 sm:mt-1.5 line-clamp-1 sm:line-clamp-none max-w-sm">
                {t(
                  'explore_clinics_subtitle',
                  'Locate partner polyclinics, diagnostic chambers & live digital queue tokens.'
                )}
              </p>
            </div>

            {/* Action Row */}
            <div className="pt-1.5 sm:pt-4 flex items-center justify-between sm:justify-start gap-1 sm:gap-2 text-[10px] xs:text-xs sm:text-sm font-bold text-forest-800 group-hover:text-emerald-700 transition-colors">
              <span className="truncate">{t('browse_all_clinics', 'Explore All Clinics')}</span>
              <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-2xs flex-shrink-0">
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorsAndClinicsDirectory;
