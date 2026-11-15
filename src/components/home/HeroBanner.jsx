import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { bannersData } from '../../data/bannersData';
import Button from '../common/Button';

export const HeroBanner = ({ onOpenPrescription }) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

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

  const slide = bannersData[currentSlide];

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden rounded-3xl min-h-[380px] sm:min-h-[440px] flex items-center shadow-card border border-emerald-100/80 bg-gradient-to-br from-[#EAF6ED] via-[#F3FAF5] to-[#E2F1E6]"
      >
        {/* Medical Background Ambient Shapes */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-forest-100/50 blur-3xl pointer-events-none" />

        {/* Content Grid */}
        <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 items-center p-6 sm:p-10 lg:p-14 gap-8">
          {/* Left Text & CTA */}
          <div className="lg:col-span-7 space-y-5 animate-fade-in">
            {slide.badge && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-forest-600/10 text-forest-700 tracking-wide border border-forest-600/20">
                {slide.badge}
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-forest-800 tracking-tight leading-[1.15] whitespace-pre-line">
              {slide.headline}
            </h1>

            <p className="text-sm sm:text-base text-brandText-secondary max-w-lg leading-relaxed whitespace-pre-line">
              {slide.subtext}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                rightIcon={ArrowRight}
                onClick={() => navigate(slide.ctaLink)}
                className="shadow-floating hover:shadow-2xl"
              >
                {slide.ctaText}
              </Button>

              {slide.secondaryCtaAction === 'upload_prescription' ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={onOpenPrescription}
                  className="bg-white/80 hover:bg-white text-forest-800 border border-emerald-200"
                >
                  {slide.secondaryCtaText}
                </Button>
              ) : slide.secondaryCtaLink ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate(slide.secondaryCtaLink)}
                  className="bg-white/80 hover:bg-white text-forest-800 border border-emerald-200"
                >
                  {slide.secondaryCtaText}
                </Button>
              ) : null}
            </div>
          </div>

          {/* Right Visual Image Composition */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden shadow-card border-4 border-white/90 bg-white">
              <img
                src={slide.image}
                alt="Healthcare services Oshud Wala"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/30 via-transparent to-transparent pointer-events-none" />
              {/* Trust Badge Overlay */}
              <div className="absolute bottom-3 left-3 bg-surface-pure/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-subtle border border-brandBorder-subtle flex items-center gap-1.5 text-[11px] font-bold text-forest-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Verified West Bengal Partner Pharmacies
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Arrow Controls (Left & Right) */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-forest-800 shadow-card flex items-center justify-center transition-all hover:scale-105 focus:outline-none z-20"
          aria-label="Previous banner"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-forest-800 shadow-card flex items-center justify-center transition-all hover:scale-105 focus:outline-none z-20"
          aria-label="Next banner"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Pagination Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {bannersData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 transition-all rounded-full ${
                currentSlide === idx
                  ? 'w-7 bg-forest-600'
                  : 'w-2 bg-forest-300 hover:bg-forest-400'
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
