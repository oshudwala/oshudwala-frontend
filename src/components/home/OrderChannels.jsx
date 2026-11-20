import React from 'react';
import { FileText, ArrowRight, Upload, PhoneCall, Zap, Sparkles } from 'lucide-react';
import Button from '../common/Button';

export const OrderChannels = ({ onOpenPrescription }) => {
  // Configurable helpline and WhatsApp numbers
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '+919800000000';
  const cleanWhatsappNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const helplineNumber = import.meta.env.VITE_HELPLINE_NUMBER || '+91 98000 00000';
  const cleanHelplineNumber = helplineNumber.replace(/[^0-9+]/g, '');

  const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
    'Hello Oshud Wala! I would like to order medicines through WhatsApp.'
  )}`;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
      {/* Section Heading - Concise on Mobile */}
      <div className="text-center mb-3 sm:mb-8">
        <h2 className="text-base sm:text-2xl lg:text-3xl font-heading font-extrabold text-forest-800 tracking-tight">
          Get your medicines via
        </h2>
        <p className="hidden sm:block text-xs sm:text-sm text-brandText-secondary mt-1 max-w-xl mx-auto">
          Choose your preferred channel to order verified medicines and healthcare essentials with express home delivery
        </p>
      </div>

      <div className="space-y-2.5 sm:space-y-5">
        {/* TOP ROW: Add Prescription (Concise on Mobile, Full on Desktop) */}
        <div
          onClick={onOpenPrescription}
          className="group relative bg-gradient-to-br from-[#EAF6ED] via-surface-pure to-[#E3F2E7] border border-forest-200/80 hover:border-forest-400 rounded-2xl sm:rounded-3xl p-3 sm:p-7 shadow-subtle hover:shadow-card transition-all duration-300 cursor-pointer overflow-hidden"
        >
          {/* Subtle ambient glow decoration */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-forest-200/40 blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

          <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-6">
            {/* Left Content */}
            <div className="flex items-center gap-2.5 sm:gap-5 min-w-0">
              {/* Prescription Icon */}
              <div className="w-9 h-9 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-forest-700 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-forest-800 transition-all shadow-sm sm:shadow-md">
                <FileText className="w-5 h-5 sm:w-8 sm:h-8" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-xs xs:text-sm sm:text-xl font-heading font-extrabold text-forest-900 group-hover:text-forest-700 transition-colors">
                    Add Prescription
                  </h3>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-forest-800 bg-forest-100/90 px-2 py-0.5 rounded-full border border-forest-200">
                    <Sparkles className="w-3 h-3 text-forest-600" />
                    Recommended & Fastest
                  </span>
                </div>

                {/* Subtitle: Short on Mobile, Detailed on Desktop */}
                <p className="sm:hidden text-[11px] text-brandText-secondary truncate mt-0.5">
                  Upload prescription for fast delivery
                </p>

                <p className="hidden sm:block text-xs sm:text-sm text-brandText-secondary mt-1 leading-relaxed max-w-2xl">
                  Upload your doctor's prescription directly. Our certified pharmacists will verify it, assemble your dosage, and arrange rapid delivery.
                </p>

                {/* Trust Badges on Desktop */}
                <div className="hidden sm:flex flex-wrap items-center gap-3 sm:gap-4 mt-2.5 text-[11px] font-semibold text-forest-800">
                  <span className="inline-flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-forest-600" />
                    30-Min Delivery
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Button */}
            <div className="flex-shrink-0">
              <Button
                variant="primary"
                size="sm"
                leftIcon={Upload}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPrescription();
                }}
                className="py-1.5 px-3 sm:py-2.5 sm:px-6 shadow-sm sm:shadow-md font-bold text-[11px] sm:text-sm rounded-xl sm:rounded-2xl"
              >
                <span className="hidden sm:inline">Upload Prescription</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Dual Cards (Side-by-Side 2-cols on Mobile, Concise & Tappable) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-5">
          {/* Card B1: Order On Call */}
          <a
            href={`tel:${cleanHelplineNumber}`}
            className="group relative bg-surface-pure hover:bg-forest-50/40 border border-brandBorder-subtle hover:border-forest-300 rounded-2xl sm:rounded-3xl p-2.5 xs:p-3 sm:p-6 shadow-subtle hover:shadow-card transition-all duration-300 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 xs:gap-3 sm:gap-5 min-w-0">
              {/* Phone Icon */}
              <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-14 sm:h-14 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-forest-200 transition-all border border-forest-200/60 shadow-xs">
                <PhoneCall className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>

              <div className="min-w-0">
                <h3 className="text-xs xs:text-sm sm:text-lg font-heading font-bold text-forest-800 group-hover:text-forest-700 transition-colors truncate">
                  <span className="hidden sm:inline">Order on Call</span>
                  <span className="sm:hidden">Call Us</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-forest-600 font-semibold truncate mt-0.5">
                  24/7 Helpline
                </p>
                <p className="hidden sm:block text-xs font-mono font-bold text-forest-700 mt-1">
                  {helplineNumber}
                </p>
              </div>
            </div>

            {/* Circular Call Action Button on Desktop */}
            <div className="hidden sm:flex flex-shrink-0 ml-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-forest-50 group-hover:bg-forest-700 text-forest-700 group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </a>

          {/* Card B2: Order On WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-surface-pure hover:bg-emerald-50/40 border border-brandBorder-subtle hover:border-emerald-300 rounded-2xl sm:rounded-3xl p-2.5 xs:p-3 sm:p-6 shadow-subtle hover:shadow-card transition-all duration-300 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 xs:gap-3 sm:gap-5 min-w-0">
              {/* WhatsApp Icon */}
              <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-14 sm:h-14 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#E8F8EE] text-[#25D366] flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-[#DCF5E5] transition-all border border-[#25D366]/20 shadow-xs">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </div>

              <div className="min-w-0">
                <h3 className="text-xs xs:text-sm sm:text-lg font-heading font-bold text-forest-800 group-hover:text-emerald-700 transition-colors truncate">
                  <span className="hidden sm:inline">Order on WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold truncate mt-0.5">
                  Instant Order
                </p>
                <p className="hidden sm:block text-xs font-mono font-bold text-emerald-700 mt-1">
                  Chat with Pharmacist
                </p>
              </div>
            </div>

            {/* Circular WhatsApp Action Button on Desktop */}
            <div className="hidden sm:flex flex-shrink-0 ml-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-50 group-hover:bg-[#25D366] text-[#25D366] group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default OrderChannels;