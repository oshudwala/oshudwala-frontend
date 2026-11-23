import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Building2 } from 'lucide-react';
import { clinicsData } from '../../data/clinicsData';
import ClinicCard from '../clinics/ClinicCard';
import ClinicDoctorsModal from '../clinics/ClinicDoctorsModal';
import { useLanguage } from '../../context/LanguageContext';

export const FeaturedClinics = ({ onBookDoctor }) => {
  const scrollContainerRef = useRef(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const { t } = useLanguage();
  const [featuredClinicsList, setFeaturedClinicsList] = useState(clinicsData);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('oshud_featured_clinics');
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids) && ids.length > 0) {
          const regAccounts = JSON.parse(localStorage.getItem('oshud_registered_accounts') || '[]');
          const allClins = [
            ...clinicsData,
            ...regAccounts
              .filter((a) => a.role === 'RECEPTIONIST')
              .map((a) => ({
                id: a.id,
                name: a.entityData?.name || `${a.fullName} Clinic`,
                address: a.entityData?.line1 || 'Salt Lake Sector 1',
                city: a.entityData?.city || 'Kolkata',
                pincode: a.entityData?.pincode || '700064',
                chambers: a.entityData?.chamberCount || '6 Chambers',
                image: a.entityData?.imageUrl || a.imageUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=350',
                rating: 4.8,
                doctorsCount: 8,
              })),
          ];
          const matched = allClins.filter((c) => ids.includes(c.id));
          if (matched.length > 0) {
            setFeaturedClinicsList(matched);
          }
        }
      }
    } catch (e) {
      console.warn('Error reading featured clinics list:', e);
    }
  }, []);

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
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 relative">
      {/* Header */}
      <div className="flex items-end justify-between mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-forest-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Chambers & Healthcare Desks</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-heading font-extrabold text-forest-800 tracking-tight">
            {t('featured_clinics', 'Featured Clinics')}
          </h2>
          <p className="hidden sm:block text-xs sm:text-sm text-brandText-secondary mt-1">
            {t('featured_clinics_subtitle', 'Certified partner clinics offering in-person consultations with live token tracking')}
          </p>
        </div>

        <Link
          to="/appointments"
          className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-bold text-forest-700 hover:text-forest-800 group transition-colors"
        >
          <span>{t('view_all', 'View All')}</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Horizontal Carousel Container with Left/Right Arrow Overlays */}
      <div className="relative group">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute -left-2 sm:-left-5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-card border border-brandBorder-subtle text-forest-800 flex items-center justify-center hover:bg-forest-50 hover:scale-105 transition-all z-10 focus:outline-none"
          aria-label="Previous clinics"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Horizontal Scrollable Row for Desktop and Mobile */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 sm:pb-4 pt-1 snap-x snap-mandatory"
        >
          {featuredClinicsList.map((clinic) => (
            <div
              key={clinic.id}
              className="w-[260px] xs:w-[285px] sm:w-[320px] lg:w-[340px] flex-shrink-0 snap-start"
            >
              <ClinicCard
                clinic={clinic}
                onSelect={(cln) => setSelectedClinic(cln)}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute -right-2 sm:-right-5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-card border border-brandBorder-subtle text-forest-800 flex items-center justify-center hover:bg-forest-50 hover:scale-105 transition-all z-10 focus:outline-none"
          aria-label="Next clinics"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Modal Showing Doctors Inside the Selected Clinic */}
      <ClinicDoctorsModal
        clinic={selectedClinic}
        isOpen={Boolean(selectedClinic)}
        onClose={() => setSelectedClinic(null)}
        onBookDoctor={(doc) => {
          setSelectedClinic(null);
          onBookDoctor && onBookDoctor(doc);
        }}
      />
    </section>
  );
};

export default FeaturedClinics;