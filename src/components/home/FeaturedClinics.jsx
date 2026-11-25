import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Building2, User, Stethoscope } from 'lucide-react';
import ClinicCard from '../clinics/ClinicCard';
import ClinicDoctorsModal from '../clinics/ClinicDoctorsModal';
import { pharmacyService } from '../../services/pharmacyService';
import { useLanguage } from '../../context/LanguageContext';

export const FeaturedClinics = ({ onBookDoctor }) => {
  const scrollContainerRef = useRef(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const { t } = useLanguage();
  const [featuredClinicsList, setFeaturedClinicsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchClinics = async () => {
      setIsLoading(true);
      try {
        const res = await pharmacyService.getPharmacies();
        if (isMounted) {
          const allPharmacies = Array.isArray(res?.pharmacies) ? res.pharmacies : [];
          const savedDoctorImages = (() => {
            try {
              const raw = localStorage.getItem('oshud_doctor_images');
              return raw ? JSON.parse(raw) : {};
            } catch {
              return {};
            }
          })();

          const savedClinOrders = (() => {
            try {
              const raw = localStorage.getItem('oshud_featured_clinics_order');
              return raw ? JSON.parse(raw) : {};
            } catch {
              return {};
            }
          })();
          const savedClinList = (() => {
            try {
              const raw = localStorage.getItem('oshud_featured_clinics');
              return raw ? JSON.parse(raw) : [];
            } catch {
              return [];
            }
          })();

          // Filter entities that offer clinic chambers and are marked as isFeatured
          const clinicEntities = allPharmacies.filter(
            (p) => (p.hasClinicService || (p.doctorsCount && p.doctorsCount > 0)) && Boolean(p.isFeatured)
          );

          // Strictly sort clinics by featured order number (ascending)
          clinicEntities.sort((a, b) => {
            const orderA = Number(a.clinOrder ?? a.featuredOrder ?? savedClinOrders[a.id] ?? (Array.isArray(savedClinList) && savedClinList.indexOf(a.id) !== -1 ? savedClinList.indexOf(a.id) + 1 : 9999));
            const orderB = Number(b.clinOrder ?? b.featuredOrder ?? savedClinOrders[b.id] ?? (Array.isArray(savedClinList) && savedClinList.indexOf(b.id) !== -1 ? savedClinList.indexOf(b.id) + 1 : 9999));
            return orderA - orderB;
          });

          const formatted = clinicEntities.map((c) => ({
            id: c.id,
            name: c.name,
            address: c.address || `${c.city || 'Durgapur'}, ${c.state || 'WB'}`,
            city: c.city || 'Durgapur',
            pincode: c.pincode || '713216',
            isPrimary: Boolean(c.isPrimary),
            isFeatured: Boolean(c.isFeatured),
            chamberCount: `${c.doctorsCount > 0 ? c.doctorsCount : 2} Chambers`,
            image: c.image || c.logoUrl || c.imageUrl || '',
            rating: c.rating || 4.8,
            reviewCount: c.reviewsCount || 85,
            distance: 'Express Hub',
            timing: '09:00 AM - 09:00 PM',
            receptionistName: c.receptionistName,
            doctorNames: c.doctorNames || [],
            doctors: c.raw?.doctors?.map((d) => {
              const docId = d.doctor?.id || d.id;
              const docPhoto = savedDoctorImages[docId] || d.doctor?.imageUrl || d.doctor?.photoUrl || '';
              return {
                id: docId,
                name: d.doctor?.fullName || 'Assigned Specialist',
                fullName: d.doctor?.fullName || 'Assigned Specialist',
                specialty: 'Chamber Specialist',
                specialization: 'Chamber Specialist',
                degree: d.doctor?.qualifications || 'MBBS',
                fee: `₹${((d.consultationFeePaise || 50000) / 100).toFixed(0)}`,
                image: docPhoto,
                imageUrl: docPhoto,
                rating: 4.9,
                reviews: '100+ patients',
                nextAvailable: 'Today',
              };
            }) || [],
          }));

          setFeaturedClinicsList(formatted);
        }
      } catch (err) {
        console.warn('FeaturedClinics fetch error:', err);
        if (isMounted) setFeaturedClinicsList([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchClinics();
    return () => {
      isMounted = false;
    };
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollContainerRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // While loading: Show skeleton loader (never blank during load)
  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div className="space-y-2">
            <div className="h-4 w-36 bg-forest-100 rounded animate-pulse" />
            <div className="h-6 w-48 bg-forest-100 rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-forest-50 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-3 sm:gap-5 overflow-hidden">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="w-[260px] sm:w-[320px] lg:w-[340px] flex-shrink-0 bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle animate-pulse space-y-3"
            >
              <div className="w-full aspect-[16/10] bg-forest-50/80 rounded-2xl" />
              <div className="h-4 w-3/4 bg-forest-100 rounded" />
              <div className="h-3 w-1/2 bg-forest-50 rounded" />
              <div className="h-8 w-full bg-forest-50 rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // If no clinics exist, remove section completely (no demo data)
  if (featuredClinicsList.length === 0) {
    return null;
  }

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