import React, { useState } from 'react';
import HeroBanner from '../components/home/HeroBanner';
import OrderChannels from '../components/home/OrderChannels';
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

export const HomePage = () => {
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);

  return (
    <div className="space-y-2 pb-12 animate-fade-in">
      {/* SECTION 2 — PROMOTIONAL BANNER */}
      <HeroBanner onOpenPrescription={() => setIsPrescriptionModalOpen(true)} />

      {/* SECTION 3 — GET YOUR MEDICINES VIA */}
      <OrderChannels onOpenPrescription={() => setIsPrescriptionModalOpen(true)} />

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
