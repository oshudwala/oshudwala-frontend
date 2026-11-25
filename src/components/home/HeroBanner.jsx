import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Tag } from 'lucide-react';
import promotionApi from '../../services/api/promotion.api';

export const HeroBanner = ({ onOpenPrescription }) => {
  const navigate = useNavigate();
  const [activeBanners, setActiveBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPromotions = async () => {
      try {
        const promos = await promotionApi.getPublicPromotions('HOME_TOP');
        if (isMounted) {
          if (Array.isArray(promos) && promos.length > 0) {
            const mapped = promos.map((p) => {
              let primaryText = p.buttonText || '';
              let primaryLink = p.buttonLink || '';
              let secondaryText = p.secondaryButtonText || '';
              let secondaryLink = p.secondaryButtonLink || '';

              if (!secondaryText && primaryLink && primaryLink.includes('||')) {
                const parts = primaryLink.split('||');
                primaryLink = parts[0] || '';
                secondaryText = parts[1] || '';
                secondaryLink = parts[2] || '';
              }

              return {
                id: p.id,
                heading: p.heading || '',
                headline: p.heading || '',
                paragraph: p.paragraph || '',
                subtext: p.paragraph || '',
                imageUrl: p.imageUrl || '',
                image: p.imageUrl || '',
                buttonText: primaryText,
                ctaText: primaryText,
                buttonLink: primaryLink,
                ctaLink: primaryLink,
                secondaryButtonText: secondaryText,
                secondaryCtaText: secondaryText,
                secondaryButtonLink: secondaryLink,
                secondaryCtaLink: secondaryLink,
                couponCode: p.couponCode || '',
                placement: p.placement || 'HOME_TOP',
                sortOrder: p.sortOrder ?? 0,
              };
            });

            setActiveBanners(mapped);
            try {
              localStorage.setItem('oshud_homepage_banners', JSON.stringify(mapped));
            } catch {}
          } else {
            setActiveBanners([]);
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('HeroBanner promotions notice:', err.message);
      }

      // Fallback: check cached banners from localStorage (strictly real banners, never demo)
      if (isMounted) {
        try {
          const raw = localStorage.getItem('oshud_homepage_banners');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const onlyActive = parsed.filter((b) => b.isActive !== false && (b.heading || b.imageUrl));
              setActiveBanners(onlyActive);
            } else {
              setActiveBanners([]);
            }
          } else {
            setActiveBanners([]);
          }
        } catch {
          setActiveBanners([]);
        }
        setIsLoading(false);
      }
    };

    fetchPromotions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Touch swipe support for mobile devices
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const nextSlide = () => {
    if (activeBanners.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    if (activeBanners.length <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  useEffect(() => {
    if (!isHovered && activeBanners.length > 1) {
      timerRef.current = setInterval(nextSlide, 5500);
    }
    return () => clearInterval(timerRef.current);
  }, [isHovered, activeBanners.length]);

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

  const handleActionClick = (link) => {
    if (!link) return;
    if (link === 'prescription_modal' || link === '/prescription' || link === 'upload_prescription') {
      if (onOpenPrescription) {
        onOpenPrescription();
        return;
      }
    }
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(link);
  };

  // SKELETON LOADER STATE
  if (isLoading) {
    return (
      <section className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-4 sm:pb-8">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-[#EAF6ED]/70 via-[#F3FAF5]/70 to-[#E2F1E6]/70 shadow-card select-none">
          <div className="w-full flex items-center justify-between p-3.5 sm:p-8 lg:p-12 gap-3 sm:gap-6 min-h-[145px] sm:min-h-[250px] md:min-h-[300px] animate-pulse">
            {/* Left text skeleton */}
            <div className="flex-1 space-y-2 sm:space-y-4 pr-2">
              <div className="w-24 sm:w-32 h-4 sm:h-5 rounded-full bg-emerald-200/60" />
              <div className="space-y-1.5 sm:space-y-2.5">
                <div className="w-3/4 sm:w-2/3 h-5 sm:h-8 md:h-10 rounded-lg bg-emerald-200/70" />
                <div className="w-1/2 sm:w-1/3 h-4 sm:h-6 md:h-8 rounded-lg bg-emerald-200/50" />
              </div>
              <div className="w-5/6 sm:w-3/4 h-3 sm:h-4 rounded bg-emerald-100/80" />
              <div className="flex items-center gap-2 pt-1 sm:pt-2">
                <div className="w-24 sm:w-32 h-7 sm:h-10 rounded-full bg-forest-600/30" />
                <div className="w-24 sm:w-32 h-7 sm:h-10 rounded-full bg-white/70 border border-emerald-100" />
              </div>
            </div>
            {/* Right image skeleton */}
            <div className="w-[38%] sm:w-[40%] flex-shrink-0 flex justify-end">
              <div className="w-full aspect-[4/3] max-w-[150px] sm:max-w-[280px] md:max-w-[340px] rounded-xl sm:rounded-2xl bg-emerald-200/50 border-2 sm:border-4 border-white/80" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ZERO BANNER STATE: If admin has not added any banners, render nothing
  if (!isLoading && activeBanners.length === 0) {
    return null;
  }

  const slide = activeBanners[currentSlide] || activeBanners[0];
  if (!slide) return null;

  const headline = (slide.heading || slide.headline || '').trim();
  const subtext = (slide.paragraph || slide.subtext || '').trim();
  const couponCode = (slide.couponCode || '').trim();
  const badge = couponCode ? `USE CODE: ${couponCode}` : (slide.badge || '');
  const imageUrl = slide.imageUrl || slide.image || '';

  const primaryBtnText = slide.buttonText || slide.ctaText || '';
  const primaryBtnLink = slide.buttonLink || slide.ctaLink || '/medicines';

  const secondaryBtnText = slide.secondaryButtonText || slide.secondaryCtaText || '';
  const secondaryBtnLink = slide.secondaryButtonLink || slide.secondaryCtaLink || '';

  return (
    <section className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-4 sm:pb-8">
      {/* Landscape Flipkart-Style Banner Card */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (primaryBtnLink) {
            handleActionClick(primaryBtnLink);
          } else if (secondaryBtnLink) {
            handleActionClick(secondaryBtnLink);
          }
        }}
        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-card border border-emerald-100/80 bg-gradient-to-br from-[#EAF6ED] via-[#F3FAF5] to-[#E2F1E6] select-none cursor-pointer"
      >
        {/* Subtle Ambient Shapes */}
        <div className="absolute -top-16 -left-16 sm:-top-24 sm:-left-24 w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-emerald-200/40 blur-2xl sm:blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 right-1/4 sm:-bottom-24 w-60 h-60 sm:w-96 sm:h-96 rounded-full bg-forest-100/50 blur-2xl sm:blur-3xl pointer-events-none" />

        {/* Strictly Landscape Layout across ALL screen sizes (Mobile + Desktop) */}
        <div className="relative z-10 w-full flex items-center justify-between p-3.5 sm:p-8 lg:p-12 gap-2.5 sm:gap-6 min-h-[145px] sm:min-h-[250px] md:min-h-[300px] lg:min-h-[360px]">
          {/* Left Text & CTA Section (58-62% width) */}
          <div className="flex-1 min-w-0 pr-2 sm:pr-4 space-y-1.5 sm:space-y-3">
            {badge && (
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-forest-700/10 text-forest-800 tracking-wide border border-forest-600/20">
                <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 inline text-forest-700" />
                {badge}
              </span>
            )}

            {headline && (
              <h1 className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-heading font-extrabold text-forest-900 tracking-tight leading-[1.2] whitespace-pre-line line-clamp-2 sm:line-clamp-3">
                {headline}
              </h1>
            )}

            {subtext && (
              <p className="text-[11px] sm:text-sm md:text-base text-brandText-secondary leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-3">
                {subtext}
              </p>
            )}

            {/* CTA Action Buttons (1 or 2 Buttons Max) */}
            {(primaryBtnText || secondaryBtnText) && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                {primaryBtnText && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(primaryBtnLink);
                    }}
                    className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                  >
                    <span>{primaryBtnText}</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                )}

                {secondaryBtnText && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActionClick(secondaryBtnLink);
                    }}
                    className="px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-white/95 hover:bg-white text-forest-800 font-bold text-xs sm:text-sm border border-emerald-200/90 shadow-xs flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                  >
                    <span>{secondaryBtnText}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Visual Image Composition (38-42% width) */}
          <div className="w-[38%] sm:w-[40%] flex-shrink-0 flex justify-end">
            <div className="relative w-full aspect-[4/3] max-w-[150px] sm:max-w-[300px] lg:max-w-md rounded-xl sm:rounded-2xl overflow-hidden shadow-xs sm:shadow-card border-2 sm:border-4 border-white/95 bg-white">
              <img
                src={imageUrl}
                alt={headline || 'Healthcare Oshud Wala'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=600';
                }}
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

        {/* Carousel Arrow Controls (Visible only if more than 1 banner exists) */}
        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="hidden sm:flex absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-forest-800 shadow-card items-center justify-center transition-all hover:scale-105 focus:outline-none z-20 cursor-pointer"
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
              className="hidden sm:flex absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-forest-800 shadow-card items-center justify-center transition-all hover:scale-105 focus:outline-none z-20 cursor-pointer"
              aria-label="Next banner"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Pagination Indicators */}
            <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20">
              {activeBanners.map((_, idx) => (
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
          </>
        )}
      </div>
    </section>
  );
};

export default HeroBanner;
