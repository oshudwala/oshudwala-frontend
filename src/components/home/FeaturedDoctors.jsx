import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import DoctorCard from '../doctors/DoctorCard';
import { doctorService } from '../../services/doctorService';
import { useLanguage } from '../../context/LanguageContext';

export const FeaturedDoctors = ({ onBookDoctor }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const { t } = useLanguage();
  const [featuredDoctorsList, setFeaturedDoctorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const res = await doctorService.getDoctors();
        if (isMounted) {
          if (Array.isArray(res?.doctors) && res.doctors.length > 0) {
            setFeaturedDoctorsList(res.doctors.slice(0, 8));
          } else {
            setFeaturedDoctorsList([]);
          }
        }
      } catch (err) {
        console.warn('FeaturedDoctors fetch error:', err);
        if (isMounted) setFeaturedDoctorsList([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDoctors();
    return () => {
      isMounted = false;
    };
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.8;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // While loading: Show clean skeleton loader (never blank during load)
  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="flex items-end justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-forest-100 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-forest-50 rounded-lg animate-pulse" />
          </div>
          <div className="h-4 w-20 bg-forest-50 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-4 sm:gap-6 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="w-[235px] sm:w-[285px] lg:w-[300px] flex-shrink-0 bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle animate-pulse space-y-3"
            >
              <div className="w-full aspect-square bg-forest-50/80 rounded-2xl" />
              <div className="h-4 w-3/4 bg-forest-100 rounded" />
              <div className="h-3 w-1/2 bg-forest-50 rounded" />
              <div className="h-3 w-2/3 bg-forest-50 rounded" />
              <div className="pt-2 border-t border-brandBorder-subtle flex justify-between">
                <div className="h-4 w-12 bg-forest-100 rounded" />
                <div className="h-7 w-20 bg-forest-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // If no doctors exist in database, remove section completely (no demo data)
  if (featuredDoctorsList.length === 0) {
    return null;
  }

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
