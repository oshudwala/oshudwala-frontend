import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Mic,
  X,
  ShoppingBag,
  Stethoscope,
  Building2,
  Pill,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { productsData } from '../../data/productsData';
import { doctorsData } from '../../data/doctorsData';
import { clinicsData } from '../../data/clinicsData';
import VoiceSearchOverlay from '../common/VoiceSearchOverlay';

export const TopSearchBar = () => {
  const navigate = useNavigate();
  const { itemCount, subtotal, setIsCartDrawerOpen } = useCart();
  const { t, language } = useLanguage();

  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Live matching results
  const [matchingProducts, setMatchingProducts] = useState([]);
  const [matchingDoctors, setMatchingDoctors] = useState([]);
  const [matchingClinics, setMatchingClinics] = useState([]);

  useEffect(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      setMatchingProducts([]);
      setMatchingDoctors([]);
      setMatchingClinics([]);
      return;
    }

    // Match products (medicines)
    const prods = (productsData || [])
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(clean) ||
          p.category?.toLowerCase().includes(clean) ||
          p.brand?.toLowerCase().includes(clean)
      )
      .slice(0, 4);

    // Match doctors
    const docs = (doctorsData || [])
      .filter(
        (d) =>
          d.name?.toLowerCase().includes(clean) ||
          d.specialization?.toLowerCase().includes(clean) ||
          d.clinicName?.toLowerCase().includes(clean)
      )
      .slice(0, 3);

    // Match clinics
    const clins = (clinicsData || [])
      .filter(
        (c) =>
          c.name?.toLowerCase().includes(clean) ||
          c.area?.toLowerCase().includes(clean) ||
          c.address?.toLowerCase().includes(clean)
      )
      .slice(0, 2);

    setMatchingProducts(prods);
    setMatchingDoctors(docs);
    setMatchingClinics(clins);
  }, [query]);

  // Click outside listener for suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setIsFocused(false);
    // If query matches a doctor/clinic keyword, navigate to appointments; else shop
    if (
      clean.toLowerCase().includes('dr') ||
      clean.toLowerCase().includes('doctor') ||
      clean.toLowerCase().includes('clinic') ||
      clean.toLowerCase().includes('cardio')
    ) {
      navigate(`/appointments?search=${encodeURIComponent(clean)}`);
    } else {
      navigate(`/shop?search=${encodeURIComponent(clean)}`);
    }
  };

  const handleVoiceResult = (spokenText) => {
    setIsVoiceOpen(false);
    if (!spokenText) return;
    setQuery(spokenText);
    setIsFocused(true);

    const clean = spokenText.toLowerCase();
    if (
      clean.includes('doctor') ||
      clean.includes('clinic') ||
      clean.includes('chamber') ||
      clean.includes('dr.')
    ) {
      navigate(`/appointments?search=${encodeURIComponent(spokenText)}`);
    } else {
      navigate(`/shop?search=${encodeURIComponent(spokenText)}`);
    }
  };

  const hasSuggestions =
    isFocused &&
    query.trim().length > 0 &&
    (matchingProducts.length > 0 || matchingDoctors.length > 0 || matchingClinics.length > 0);

  return (
    <div className="w-full bg-surface-canvas/90 py-2 sm:py-3 transition-all z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Main Sleek Search Bar */}
          <div ref={searchContainerRef} className="relative flex-1">
            <form
              onSubmit={handleSearchSubmit}
              className={`relative flex items-center bg-surface-pure rounded-2xl sm:rounded-full border transition-all duration-200 shadow-xs ${
                isFocused
                  ? 'border-forest-600 ring-2 ring-forest-400/20 shadow-md'
                  : 'border-brandBorder-subtle hover:border-forest-300'
              }`}
            >
              {/* Search Icon */}
              <div className="pl-3.5 sm:pl-4 text-forest-700 flex-shrink-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-forest-700" />
              </div>

              {/* Text Input */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder={t('search_placeholder')}
                className="w-full py-2.5 sm:py-3 pl-2.5 pr-20 text-xs sm:text-sm font-medium text-forest-950 bg-transparent placeholder:text-brandText-muted focus:outline-none"
              />

              {/* Actions inside input: Clear (X) + Voice Mic Button */}
              <div className="absolute right-2 sm:right-2.5 flex items-center gap-1">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setIsFocused(false);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-forest-700 hover:bg-forest-50 transition-colors"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Voice Search Button */}
                <button
                  type="button"
                  onClick={() => setIsVoiceOpen(true)}
                  className="p-1.5 sm:p-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-all border border-emerald-200/80 shadow-2xs hover:scale-105 active:scale-95 group"
                  title={t('search_voice_tooltip')}
                >
                  <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 group-hover:text-emerald-800" />
                </button>
              </div>
            </form>

            {/* Live Autocomplete / Instant Suggestions Dropdown */}
            {hasSuggestions && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-surface-pure rounded-2xl border border-brandBorder-subtle shadow-floating overflow-hidden z-50 divide-y divide-brandBorder-light/60 animate-fade-in max-h-[75vh] overflow-y-auto">
                {/* Medicines / Products matches */}
                {matchingProducts.length > 0 && (
                  <div className="p-2 sm:p-3">
                    <p className="px-2 pb-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-brandText-muted flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-forest-600" />
                      <span>{t('search_medicines')}</span>
                    </p>
                    <div className="space-y-1">
                      {matchingProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            navigate(`/product/${p.id}`);
                            setIsFocused(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-forest-50/70 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-contain bg-surface-warm p-1 border border-brandBorder-subtle flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-forest-900 group-hover:text-forest-700 truncate">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-brandText-secondary truncate">
                                {p.dosage || p.brand} &bull; {p.category}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-xs text-forest-900 pl-2">
                            ₹{Number(p.price || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Doctors matches */}
                {matchingDoctors.length > 0 && (
                  <div className="p-2 sm:p-3">
                    <p className="px-2 pb-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-brandText-muted flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t('search_doctors')}</span>
                    </p>
                    <div className="space-y-1">
                      {matchingDoctors.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            navigate(`/appointments?doctor=${d.id}`);
                            setIsFocused(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={d.image}
                              alt={d.name}
                              className="w-8 h-8 rounded-full object-cover border border-brandBorder-subtle flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-forest-900 group-hover:text-blue-700 truncate">
                                {d.name}
                              </p>
                              <p className="text-[10px] text-brandText-secondary truncate">
                                {d.specialization} &bull; {d.clinicName}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full flex-shrink-0">
                            Book Slot
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinics matches */}
                {matchingClinics.length > 0 && (
                  <div className="p-2 sm:p-3">
                    <p className="px-2 pb-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-brandText-muted flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>{t('search_clinics')}</span>
                    </p>
                    <div className="space-y-1">
                      {matchingClinics.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            navigate(`/appointments?clinic=${c.id}`);
                            setIsFocused(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-purple-50/50 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={c.image}
                              alt={c.name}
                              className="w-8 h-8 rounded-lg object-cover border border-brandBorder-subtle flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-forest-900 group-hover:text-purple-700 truncate">
                                {c.name}
                              </p>
                              <p className="text-[10px] text-brandText-secondary truncate">
                                {c.area} &bull; {c.chamberCount}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full flex-shrink-0">
                            Chambers
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* View All search button */}
                <div className="p-2 bg-surface-warm/50 text-center">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full py-1.5 text-xs font-bold text-forest-800 hover:text-forest-900 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>{t('search_view_all')} for &ldquo;{query}&rdquo;</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Button placed directly beside searchbar & voice search (as requested) */}
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl sm:rounded-full bg-forest-800 hover:bg-forest-900 text-white shadow-sm hover:shadow-md transition-all active:scale-95 group border border-forest-700"
            aria-label="Open Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300 group-hover:scale-110 transition-transform" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-forest-900 animate-pulse">
                  {itemCount}
                </span>
              )}
            </div>
            <div className="hidden xs:flex flex-col items-start leading-none text-left">
              <span className="text-[11px] sm:text-xs font-bold tracking-tight text-white">
                {t('cart')}
              </span>
              {itemCount > 0 && (
                <span className="text-[9px] font-mono text-emerald-300 font-semibold mt-0.5">
                  ₹{subtotal.toFixed(0)}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Voice Search Overlay Modal */}
      <VoiceSearchOverlay
        open={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onResult={handleVoiceResult}
        locale={language}
      />
    </div>
  );
};

export default TopSearchBar;
