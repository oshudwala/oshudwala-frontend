import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { doctorsData } from '../../data/doctorsData';
import DoctorCard from '../doctors/DoctorCard';
import { useLanguage } from '../../context/LanguageContext';

export const FeaturedDoctors = ({ onBookDoctor }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const { t } = useLanguage();
  const [featuredDoctorsList, setFeaturedDoctorsList] = useState(doctorsData.slice(0, 6));

  useEffect(() => {
    try {
      const raw = localStorage.getItem('oshud_featured_doctors');
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids) && ids.length > 0) {
          const regAccounts = JSON.parse(localStorage.getItem('oshud_registered_accounts') || '[]');
          const allDocs = [
            ...doctorsData,
            ...regAccounts
              .filter((a) => a.role === 'DOCTOR')
              .map((a) => ({
                id: a.id,
                name: a.fullName,
                specialty: a.entityData?.specialization || 'General Physician',
                degree: a.entityData?.qualifications || 'MBBS',
                experience: `${a.entityData?.experienceYears || 5}+ years exp`,
                fee: `₹${((a.entityData?.consultationFeePaise || 50000) / 100).toFixed(0)}`,
                image: a.entityData?.imageUrl || a.imageUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
                rating: 4.9,
                reviews: '120+ patients',
                nextAvailable: 'Today',
              })),
          ];
          const matched = allDocs.filter((d) => ids.includes(d.id));
          if (matched.length > 0) {
            setFeaturedDoctorsList(matched);
          }
        }
      }
    } catch (e) {
      console.warn('Error reading featured doctors list:', e);
    }
  }, []);

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
            {t('featured_doctors', 'Featured Doctors')}
          </h2>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            {t('featured_doctors_subtitle', 'Consult experienced doctors for better care')}
          </p>
        </div>

        <Link
          to="/appointments"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-forest-700 hover:text-forest-800 group transition-colors"
        >
          <span>{t('view_all', 'View All')}</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Relative Carousel Container with Arrow Overlays */}
      <div className="relative group">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-card border border-brandBorder-subtle text-forest-800 flex items-center justify-center hover:bg-forest-50 hover:scale-105 transition-all z-10"
          aria-label="Previous doctors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Doctor Cards Horizontal Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-3 sm:pb-4 pt-1 snap-x snap-mandatory"
        >
          {featuredDoctorsList.map((doctor) => (
            <div
              key={doctor.id}
              className="w-[235px] xs:w-[255px] sm:w-[285px] lg:w-[300px] flex-shrink-0 snap-start"
            >
              <DoctorCard
                doctor={doctor}
                onBook={onBookDoctor}
                onSelect={(doc) => navigate(`/appointments?doctor=${doc.id}`)}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-card border border-brandBorder-subtle text-forest-800 flex items-center justify-center hover:bg-forest-50 hover:scale-105 transition-all z-10"
          aria-label="Next doctors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default FeaturedDoctors;
