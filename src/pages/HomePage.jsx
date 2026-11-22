import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import TopSearchBar from '../components/home/TopSearchBar';
import HeroBanner from '../components/home/HeroBanner';
import OrderChannels from '../components/home/OrderChannels';
import DoctorsAndClinicsDirectory from '../components/home/DoctorsAndClinicsDirectory';
import FeaturedDoctors from '../components/home/FeaturedDoctors';
import FeaturedClinics from '../components/home/FeaturedClinics';
import FeaturedPharmacies from '../components/home/FeaturedPharmacies';
import CategoryGrid from '../components/home/CategoryGrid';
import HowItWorks from '../components/home/HowItWorks';
import WhyChooseUs from '../components/home/WhyChooseUs';
import FaqSection from '../components/home/FaqSection';
import PrescriptionModal from '../components/home/PrescriptionModal';
import BookingModal from '../components/doctors/BookingModal';
import FloatingOrderBar from '../components/common/FloatingOrderBar';
import { useLanguage } from '../context/LanguageContext';

export const HomePage = () => {
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const { t } = useLanguage();

  return (
    <div className="space-y-2 pb-12 animate-fade-in">
      {/* SECTION 1 — SLEEK TOP SEARCH BAR, VOICE RECOGNITION & CART PILL */}
      <TopSearchBar />

      {/* SECTION 2 — PROMOTIONAL BANNER */}
      <HeroBanner onOpenPrescription={() => setIsPrescriptionModalOpen(true)} />

      {/* SECTION 3 — GET YOUR MEDICINES VIA (Prescription, Call, WhatsApp) */}
      <OrderChannels onOpenPrescription={() => setIsPrescriptionModalOpen(true)} />

      {/* SECTION 3.5 — REGISTERED DIRECTORY CARDS (Find Doctors & Explore Clinics) */}
      <DoctorsAndClinicsDirectory
        onBookDoctor={(doc) => setSelectedDoctorForBooking(doc)}
      />

      {/* SECTION 4 — FEATURED DOCTORS */}
      <FeaturedDoctors
        onBookDoctor={(doc) => setSelectedDoctorForBooking(doc)}
      />

      {/* SECTION 4.5 — FEATURED CLINICS (with doctors available for appointment) */}
      <FeaturedClinics
        onBookDoctor={(doc) => setSelectedDoctorForBooking(doc)}
      />

      {/* SECTION 5 — FEATURED PHARMACIES */}
      <FeaturedPharmacies />

      {/* SECTION 6 — CATEGORIES */}
      <CategoryGrid />

      {/* SECTION 7 — HOW IT WORKS */}
      <HowItWorks />

      {/* SECTION 8 — WHY CHOOSE OSHUD WALA */}
      <WhyChooseUs />

      {/* SECTION 9 — FAQ */}
      <FaqSection />

      {/* SECTION 10 — HEALTHCARE SAFETY & LEGAL COMPLIANCE BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-forest-50/80 border border-brandBorder-subtle rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-forest-700" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-forest-900 text-sm">
                {t('safety_title', 'Certified Patient Safety & Data Confidentiality')}
              </p>
              <p className="text-brandText-secondary text-[11px] sm:text-xs mt-0.5 max-w-xl">
                {t('safety_desc', 'Every prescription is verified by registered pharmacists. Medical consultations and deliveries are governed by official healthcare standards and privacy safeguards.')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0 w-full sm:w-auto justify-end">
            <Link
              to="/privacy-policy"
              className="px-4 py-2 rounded-xl bg-surface-pure hover:bg-forest-100 border border-brandBorder-subtle text-forest-900 font-bold text-xs transition-colors shadow-xs"
            >
              {t('privacy_policy', 'Privacy Policy')}
            </Link>
            <Link
              to="/terms-conditions"
              className="px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs transition-colors shadow-xs"
            >
              {t('terms_conditions', 'Terms & Conditions')}
            </Link>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
      />

      <BookingModal
        isOpen={Boolean(selectedDoctorForBooking)}
        doctor={selectedDoctorForBooking}
        onClose={() => setSelectedDoctorForBooking(null)}
      />

      {/* Persistent floating quick-action bar when scrolling */}
      <FloatingOrderBar onOpenPrescription={() => setIsPrescriptionModalOpen(true)} />
    </div>
  );
};

export default HomePage;
