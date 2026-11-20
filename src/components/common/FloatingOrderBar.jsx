import React, { useState, useEffect } from 'react';
import { FileText, PhoneCall, Upload, ArrowUp } from 'lucide-react';

export const FloatingOrderBar = ({ onOpenPrescription }) => {
  const [isVisible, setIsVisible] = useState(false);

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '+919800000000';
  const cleanWhatsappNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const helplineNumber = import.meta.env.VITE_HELPLINE_NUMBER || '+91 98000 00000';
  const cleanHelplineNumber = helplineNumber.replace(/[^0-9+]/g, '');

  const whatsappUrl = `https://wa.me/${cleanWhatsappNumber}?text=${encodeURIComponent(
    'Hello Oshud Wala! I would like to order medicines.'
  )}`;

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past 180px
      if (window.scrollY > 180) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 z-40 animate-slide-up">
      <div className="bg-surface-pure/95 backdrop-blur-md border border-forest-200/90 shadow-floating rounded-2xl p-1.5 sm:p-2 flex items-center justify-between gap-1.5 sm:gap-2.5 max-w-md mx-auto sm:mx-0 ring-1 ring-forest-900/5">
        {/* Section 1: Prescription */}
        <button
          type="button"
          onClick={onOpenPrescription}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 sm:px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs sm:text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-95"
          title="Upload doctor's prescription"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-300" />
          <span className="whitespace-nowrap">Upload Rx</span>
        </button>

        {/* Section 2: Call */}
        <a
          href={`tel:${cleanHelplineNumber}`}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-2.5 sm:px-3.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs border border-forest-200/80 transition-all hover:scale-[1.02] active:scale-95"
          title="Call 24/7 Helpline"
        >
          <PhoneCall className="w-3.5 h-3.5 text-forest-700" />
          <span className="whitespace-nowrap">Call</span>
        </a>

        {/* Section 3: WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 sm:px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-95"
          title="Order via WhatsApp"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span className="whitespace-nowrap">WhatsApp</span>
        </a>
      </div>
    </div>
  );
};

export default FloatingOrderBar;