
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const DoctorsAndClinicsDirectory = () => {
  const navigate = useNavigate();
  const { t, isBengali } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
      <div className="grid grid-cols-2 gap-2.5 sm:gap-6">

        {/* CARD 1: FIND DOCTORS */}
        <div
          onClick={() => navigate('/appointments?tab=doctors')}
          className="group relative bg-surface-pure hover:bg-forest-50/25 rounded-2xl sm:rounded-3xl border border-forest-200/90 sm:border-brandBorder-subtle hover:border-forest-500/50 shadow-[0_3px_12px_rgba(24,78,63,0.08)] sm:shadow-subtle hover:shadow-card transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row items-stretch"
        >
          {/* Image */}
          <div className="w-full sm:w-[42%] relative overflow-hidden bg-forest-50 h-32 xs:h-36 sm:h-auto sm:min-h-[170px] order-first sm:order-last flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600"
              alt="Find Doctors"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />

            <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-surface-pure/40 via-transparent to-transparent pointer-events-none" />
            <div className="sm:hidden absolute inset-0 bg-gradient-to-t from-surface-pure/25 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Content */}
          <div className="flex-1 p-3 sm:p-7 flex flex-col justify-center sm:justify-between z-10 space-y-2 sm:space-y-4 order-last sm:order-first">

            {/* Mobile: Only Title */}
            <h3 className="sm:hidden text-sm font-heading font-extrabold text-forest-900 text-center py-1">
              {t('find_doctors_title', 'Find Doctors')}
            </h3>

            {/* Desktop: Full Content */}
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-forest-600 animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
                  {isBengali ? 'বিশেষজ্ঞ ডাক্তার' : 'Specialist Directory'}
                </span>
              </div>

              <h3 className="text-2xl font-heading font-extrabold text-forest-900 group-hover:text-forest-700 transition-colors leading-tight">
                {t('find_doctors_title', 'Find Doctors')}
              </h3>

              <p className="text-sm text-brandText-secondary leading-relaxed mt-1.5 max-w-sm">
                {t(
                  'find_doctors_subtitle',
                  'Browse certified specialists across General Medicine, Cardiology, Dermatology & more.'
                )}
              </p>
            </div>

            {/* Desktop Action */}
            <div className="hidden sm:flex pt-4 items-center gap-2 text-sm font-bold text-forest-800 group-hover:text-forest-600 transition-colors">
              <span>{t('browse_all_doctors', 'Browse All Doctors')}</span>

              <div className="w-7 h-7 rounded-full bg-forest-100 group-hover:bg-forest-700 text-forest-800 group-hover:text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-2xs flex-shrink-0">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: FIND CLINICS */}
        <div
          onClick={() => navigate('/appointments?tab=clinics')}
          className="group relative bg-surface-pure hover:bg-emerald-50/25 rounded-2xl sm:rounded-3xl border border-emerald-200/90 sm:border-brandBorder-subtle hover:border-emerald-500/50 shadow-[0_3px_12px_rgba(24,78,63,0.08)] sm:shadow-subtle hover:shadow-card transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row items-stretch"
        >
          {/* Image */}
          <div className="w-full sm:w-[42%] relative overflow-hidden bg-emerald-50 h-32 xs:h-36 sm:h-auto sm:min-h-[170px] order-first sm:order-last flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600"
              alt="Find Clinics"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />

            <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-surface-pure/40 via-transparent to-transparent pointer-events-none" />
            <div className="sm:hidden absolute inset-0 bg-gradient-to-t from-surface-pure/25 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Content */}
          <div className="flex-1 p-3 sm:p-7 flex flex-col justify-center sm:justify-between z-10 space-y-2 sm:space-y-4 order-last sm:order-first">

            {/* Mobile: Only Title */}
            <h3 className="sm:hidden text-sm font-heading font-extrabold text-emerald-800 text-center py-1">
              {t('explore_clinics_title', 'Find Clinics')}
            </h3>

            {/* Desktop: Full Content */}
            <div className="hidden sm:block">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  {isBengali ? 'চেম্বার ও ক্লিনিক' : 'Chambers & Clinics'}
                </span>
              </div>

              <h3 className="text-2xl font-heading font-extrabold text-forest-900 group-hover:text-emerald-700 transition-colors leading-tight">
                {t('explore_clinics_title', 'Explore Clinics')}
              </h3>

              <p className="text-sm text-brandText-secondary leading-relaxed mt-1.5 max-w-sm">
                {t(
                  'explore_clinics_subtitle',
                  'Locate partner polyclinics, diagnostic chambers & live digital queue tokens.'
                )}
              </p>
            </div>

            {/* Desktop Action */}
            <div className="hidden sm:flex pt-4 items-center gap-2 text-sm font-bold text-forest-800 group-hover:text-emerald-700 transition-colors">
              <span>{t('browse_all_clinics', 'Explore All Clinics')}</span>

              <div className="w-7 h-7 rounded-full bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center transition-all group-hover:translate-x-1 shadow-2xs flex-shrink-0">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default DoctorsAndClinicsDirectory;
