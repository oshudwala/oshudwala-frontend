import React, { useState } from 'react';
import {
  MapPin,
  Check,
  Search,
  Navigation,
  Loader2,
  Plus,
  ShieldCheck,
  X,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useLocation } from '../../context/LocationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LocationModal = () => {
  const { t } = useLanguage();
  const { isSuperAdmin } = useAuth();
  const { addToast } = useToast();
  const {
    selectedLocation,
    changeLocation,
    isLocationModalOpen,
    setIsLocationModalOpen,
    locations,
    isLoadingLocations,
    isDetectingLocation,
    locationError,
    detectLiveLocation,
    searchLocations,
    refreshLocations,
    addLocation,
  } = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAdminAdd, setShowAdminAdd] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    city: 'Durgapur',
    area: '',
    state: 'WB',
    pincode: '',
  });

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    searchLocations(val);
  };

  // Live GPS Detection + Serviceability Check
  const handleUseCurrentLocation = async () => {
    const result = await detectLiveLocation();
    if (result?.available && result?.location) {
      addToast(`Location set to ${result.location.label} via GPS!`, 'success');
    } else {
      addToast(result?.message || 'This location is not available', 'error');
    }
  };

  // SUPER_ADMIN: POST /locations
  const handleAdminCreateLocation = async (e) => {
    e.preventDefault();
    if (!adminForm.city || !adminForm.pincode) {
      addToast('City and Pincode are required.', 'error');
      return;
    }

    const cleanPin = adminForm.pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      addToast('Please enter a valid 6-digit Indian PIN code (e.g. 713216).', 'error');
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      const payload = {
        city: adminForm.city.trim(),
        area: adminForm.area.trim() || undefined,
        state: adminForm.state.trim() || 'WB',
        pincode: cleanPin,
      };

      await addLocation(payload);
      addToast(`Location "${payload.area || payload.city}" created and activated!`, 'success');
      setShowAdminAdd(false);
      setAdminForm({ city: 'Durgapur', area: '', state: 'WB', pincode: '' });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create location';
      addToast(msg, 'error');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const filteredLocations = locations.filter(
    (loc) =>
      loc.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.pincode?.includes(searchTerm)
  );

  return (
    <Modal
      isOpen={isLocationModalOpen}
      onClose={() => {
        setIsLocationModalOpen(false);
        setShowAdminAdd(false);
      }}
      title={t('select_location', 'Select Delivery Location')}
      subtitle={t('select_location_desc', 'Verified 45-minute express medicine delivery hubs')}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* GPS Quick Action Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isDetectingLocation}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-forest-50 hover:bg-forest-100/80 border border-forest-200/80 text-forest-900 transition-all group disabled:opacity-70"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-600 text-white flex items-center justify-center shadow-xs">
              {isDetectingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                <span>Use Current Location</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                  Live GPS
                </span>
              </p>
              <p className="text-[11px] text-brandText-secondary">
                {isDetectingLocation
                  ? 'Detecting live GPS location...'
                  : 'Auto-detect & check delivery availability'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-forest-700 group-hover:translate-x-0.5 transition-transform">
            Detect &rarr;
          </span>
        </button>

        {/* Unavailable / Error Banner when live detected location is not serviceable */}
        {(locationError || selectedLocation?.isUnavailable) && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-extrabold text-rose-800">
                {locationError || 'This location is not available'}
              </p>
              {selectedLocation?.label && selectedLocation?.isUnavailable && (
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Detected: <strong>{selectedLocation.label}</strong>. Please select an active delivery hub below.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Search from GET /locations */}
        <div className="relative">
          <Search className="w-4 h-4 text-brandText-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search area, city or PIN (e.g. City Centre, 713216)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500"
          />
          {isLoadingLocations && (
            <Loader2 className="w-4 h-4 text-forest-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Location List Header & Refresh */}
        <div className="flex items-center justify-between text-xs text-brandText-secondary pt-1">
          <span className="font-semibold text-forest-900">
            Available Hubs ({filteredLocations.length})
          </span>
          <button
            type="button"
            onClick={() => refreshLocations(searchTerm)}
            className="flex items-center gap-1 text-[11px] text-forest-700 hover:text-forest-900 font-semibold"
            title="Refresh locations from server"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingLocations ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Location Cards List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {filteredLocations.map((loc) => {
            const isSelected =
              !selectedLocation?.isUnavailable &&
              (selectedLocation?.id === loc.id ||
                (selectedLocation?.pincode === loc.pincode && selectedLocation?.area === loc.area));

            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => changeLocation(loc)}
                className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-forest-600 bg-forest-50/70 shadow-sm ring-1 ring-forest-600/30'
                    : 'border-brandBorder-subtle hover:border-forest-300 hover:bg-forest-50/20 bg-surface-pure'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      isSelected ? 'bg-forest-700 text-white' : 'bg-forest-100 text-forest-800'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-xs sm:text-sm font-bold ${
                          isSelected ? 'text-forest-900' : 'text-brandText-main'
                        }`}
                      >
                        {loc.label}
                      </p>
                      {loc.isActive && (
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-brandText-secondary mt-0.5">
                      {loc.area ? `${loc.area}, ` : ''}
                      {loc.city}, {loc.state} &bull; PIN:{' '}
                      <span className="font-mono font-medium">{loc.pincode}</span>
                    </p>
                  </div>
                </div>
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-forest-700 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-brandBorder-subtle shrink-0" />
                )}
              </button>
            );
          })}

          {filteredLocations.length === 0 && !isLoadingLocations && (
            <div className="py-6 text-center text-brandText-secondary text-xs bg-surface-warm rounded-2xl border border-dashed border-brandBorder-subtle">
              <p className="font-semibold text-forest-900">This location is not available</p>
              <p className="text-[11px] mt-1">Try another area name, road, or 6-digit PIN code</p>
            </div>
          )}
        </div>

        {/* ================= SUPER_ADMIN: POST /locations ================= */}
        {isSuperAdmin && (
          <div className="pt-2 border-t border-brandBorder-subtle">
            {!showAdminAdd ? (
              <button
                type="button"
                onClick={() => setShowAdminAdd(true)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-forest-300 text-xs font-bold text-forest-800 hover:bg-forest-50/60 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-forest-700" />
                <span>Add Delivery Location (Super Admin)</span>
              </button>
            ) : (
              <form
                onSubmit={handleAdminCreateLocation}
                className="p-3.5 bg-forest-50/50 rounded-2xl border border-forest-200 space-y-3 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-forest-700" />
                    <span>Create Location (POST /locations)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdminAdd(false)}
                    className="text-brandText-muted hover:text-forest-900 p-0.5 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-brandText-secondary mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminForm.city}
                      onChange={(e) => setAdminForm({ ...adminForm, city: e.target.value })}
                      placeholder="e.g. Durgapur"
                      className="w-full px-2.5 py-1.5 bg-white border border-brandBorder-subtle rounded-lg text-xs focus:outline-none focus:border-forest-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brandText-secondary mb-1">
                      Area *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminForm.area}
                      onChange={(e) => setAdminForm({ ...adminForm, area: e.target.value })}
                      placeholder="e.g. City Centre"
                      className="w-full px-2.5 py-1.5 bg-white border border-brandBorder-subtle rounded-lg text-xs focus:outline-none focus:border-forest-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brandText-secondary mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminForm.state}
                      onChange={(e) => setAdminForm({ ...adminForm, state: e.target.value })}
                      placeholder="e.g. WB"
                      className="w-full px-2.5 py-1.5 bg-white border border-brandBorder-subtle rounded-lg text-xs focus:outline-none focus:border-forest-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-brandText-secondary mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={adminForm.pincode}
                      onChange={(e) =>
                        setAdminForm({ ...adminForm, pincode: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="e.g. 713216"
                      className="w-full px-2.5 py-1.5 bg-white border border-brandBorder-subtle rounded-lg text-xs font-mono focus:outline-none focus:border-forest-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdminAdd(false)}
                    className="px-3 py-1.5 text-xs text-brandText-secondary hover:text-forest-900"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingAdmin}
                    className="text-xs font-bold shadow-sm"
                  >
                    {isSubmittingAdmin ? (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <span>Save Location</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LocationModal;
