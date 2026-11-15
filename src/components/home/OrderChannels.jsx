import React from 'react';
import { FileText, ArrowRight, Upload } from 'lucide-react';
import Button from '../common/Button';

export const OrderChannels = ({ onOpenPrescription }) => {
  // Configurable WhatsApp ordering number from environment or official default
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '+8801700000000';
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
    'Hello Oshud Wala! I would like to order medicines through WhatsApp.'
  )}`;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Section Heading */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800">
          Get your medicines via
        </h2>
      </div>

      {/* Two Horizontal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Card A: Add Prescription */}
        <div
          onClick={onOpenPrescription}
          className="group relative bg-surface-pure hover:bg-forest-50/30 border border-brandBorder-subtle hover:border-forest-300 rounded-3xl p-5 sm:p-6 shadow-subtle hover:shadow-card transition-all duration-300 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Green Prescription Icon in Soft Mint Rounded Box */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-forest-100/90 text-forest-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-forest-200 transition-all border border-forest-200/50">
              <FileText className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-heading font-bold text-forest-800 group-hover:text-forest-700 transition-colors">
                Add Prescription
              </h3>
              <p className="text-xs sm:text-sm text-brandText-secondary mt-0.5 truncate">
                Add Prescription to place your order
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0 ml-3">
            <Button
              variant="primary"
              size="sm"
              rightIcon={ArrowRight}
              onClick={(e) => {
                e.stopPropagation();
                onOpenPrescription();
              }}
              className="py-2 px-4 shadow-sm group-hover:shadow-md"
            >
              Upload
            </Button>
          </div>
        </div>

        {/* Card B: Order On WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative bg-surface-pure hover:bg-emerald-50/30 border border-brandBorder-subtle hover:border-emerald-300 rounded-3xl p-5 sm:p-6 shadow-subtle hover:shadow-card transition-all duration-300 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* WhatsApp Icon in Green Circle */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E8F8EE] text-[#25D366] flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-[#DCF5E5] transition-all border border-[#25D366]/20">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </div>

            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-heading font-bold text-forest-800 group-hover:text-emerald-700 transition-colors">
                Order On WhatsApp
              </h3>
              <p className="text-xs sm:text-sm text-brandText-secondary mt-0.5 truncate">
                Place order through WhatsApp
              </p>
            </div>
          </div>

          {/* Circular Arrow Button */}
          <div className="flex-shrink-0 ml-3">
            <div className="w-10 h-10 rounded-full bg-forest-50 group-hover:bg-[#25D366] text-forest-700 group-hover:text-white flex items-center justify-center transition-all shadow-sm">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </a>
      </div>
    </section>
  );
};

export default OrderChannels;
