import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { bannersData } from '../../data/bannersData';
import { useLanguage } from '../../context/LanguageContext';

export const HeroBanner = ({ onOpenPrescription }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  // Touch swipe support for mobile swiping
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannersData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannersData.length) % bannersData.length);
  };

  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setInterval(nextSlide, 5500);
    }
    return () => clearInterval(timerRef.current);
  }, [isHovered]);

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 45) {
      nextSlide();
    } else if (distance < -45) {
      prevSlide();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const slide = bannersData[currentSlide];
  const slideIdx = currentSlide + 1;

  const headline = t(`banner_${slideIdx}_headline`, slide.headline);
  const subtext = t(`banner_${slideIdx}_subtext`, slide.subtext);
  const badge = t(`banner_${slideIdx}_badge`, slide.badge);
  const ctaText = t(`banner_${slideIdx}_cta`, slide.ctaText);
  const secCtaText = t('upload_prescription', slide.secondaryCtaText || 'Upload Prescription');

  return (
    <section className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-4 sm:pb-8">
      {/* Landscape Flipkart-Style Banner Card */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => navigate(slide.ctaLink)}
        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-card border border-emerald-100/80 bg-gradient-to-br from-[#EAF6ED] via-[#F3FAF5] to-[#E2F1E6] select-none cursor-pointer"
      >
        {/* Subtle Ambient Shapes */}
        <div className="absolute -top-16 -left-16 sm:-top-24 sm:-left-24 w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-emerald-200/40 blur-2xl sm:blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 right-1/4 sm:-bottom-24 w-60 h-60 sm:w-96 sm:h-96 rounded-full bg-forest-100/50 blur-2xl sm:blur-3xl pointer-events-none" />

        {/* Strictly Landscape Layout across ALL screen sizes (Mobile + Desktop) */}
        <div className="relative z-10 w-full flex items-center justify-between p-3.5 xs:p-4 sm:p-8 lg:p-12 gap-2.5 xs:gap-3 sm:gap-6 min-h-[145px] xs:min-h-[165px] sm:min-h-[250px] md:min-h-[320px] lg:min-h-[380px]">
          {/* Left Text & CTA Section (58-60% width) */}
          <div className="flex-1 min-w-0 pr-1 sm:pr-4 space-y-1 xs:space-y-1.5 sm:space-y-3.5">
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] sm:text-xs font-bold bg-forest-600/10 text-forest-700 tracking-wide border border-forest-600/20">
                {badge}
              </span>
            )}

            <h1 className="text-xs xs:text-sm sm:text-2xl md:text-3xl lg:text-5xl font-heading font-extrabold text-forest-800 tracking-tight leading-[1.18] whitespace-pre-line">
              {headline}
            </h1>

            <p className="hidden xs:line-clamp-1 sm:line-clamp-2 text-[10px] xs:text-xs sm:text-sm lg:text-base text-brandText-secondary leading-tight sm:leading-relaxed">
              {subtext}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 sm:gap-3 pt-0.5 sm:pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(slide.ctaLink);
                }}
                className="px-2.5 py-1 xs:px-3 xs:py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-forest-700 hover:bg-forest-800 text-white font-bold text-[10px] xs:text-xs sm:text-sm shadow-sm flex items-center gap-1 transition-all hover:scale-105"
              >
                <span>{ctaText}</span>
                <ArrowRight className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" />
              </button>

              {slide.secondaryCtaAction === 'upload_prescription' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPrescription();
                  }}
                  className="hidden sm:inline-flex px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/90 hover:bg-white text-forest-800 font-bold text-xs sm:text-sm border border-emerald-200 shadow-xs transition-all hover:scale-105"
                >
                  {secCtaText}
                </button>
              ) : slide.secondaryCtaText ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(slide.secondaryCtaLink || '/shop');
                  }}
                  className="hidden sm:inline-flex px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/90 hover:bg-white text-forest-800 font-bold text-xs sm:text-sm border border-emerald-200 shadow-xs transition-all hover:scale-105"
                >
                  {slide.secondaryCtaText}
                </button>
              ) : null}
            </div>
          </div>

          {/* Right Visual Image Composition (38-42% width) */}
          <div className="w-[38%] xs:w-[40%] sm:w-[42%] lg:w-[40%] flex-shrink-0 flex justify-end">
            <div className="relative w-full aspect-[4/3] max-w-[150px] xs:max-w-[185px] sm:max-w-[300px] lg:max-w-md rounded-xl sm:rounded-2xl overflow-hidden shadow-xs sm:shadow-card border-2 sm:border-4 border-white/95 bg-white">
              <img
                src={slide.image}
                alt="Healthcare Oshud Wala"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/30 via-transparent to-transparent pointer-events-none" />

              {/* Trust Badge Overlay (Visible on md+ screens) */}
              <div className="hidden md:flex absolute bottom-2.5 left-2.5 bg-surface-pure/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-subtle border border-brandBorder-subtle items-center gap-1.5 text-[10px] font-bold text-forest-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified West Bengal Pharmacies
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Arrow Controls (Visible on Tablet & Desktop) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          className="hidden sm:flex absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-forest-800 shadow-card items-center justify-center transition-all hover:scale-105 focus:outline-none z-20"
          aria-label="Previous banner"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          className="hidden sm:flex absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-forest-800 shadow-card items-center justify-center transition-all hover:scale-105 focus:outline-none z-20"
          aria-label="Next banner"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Pagination Indicators (Compact on mobile) */}
        <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20">
          {bannersData.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
              className={`h-1.5 sm:h-2 transition-all rounded-full ${
                currentSlide === idx
                  ? 'w-5 sm:w-7 bg-forest-600'
                  : 'w-1.5 sm:w-2 bg-forest-300 hover:bg-forest-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;