import React, { useState } from 'react';
import { MapPin, Check, Search } from 'lucide-react';
import Modal from '../common/Modal';
import { useLocation } from '../../context/LocationContext';
import { useLanguage } from '../../context/LanguageContext';

export const LocationModal = () => {
  const { t, isBengali } = useLanguage();
  const {
    selectedLocation,
    changeLocation,
    isLocationModalOpen,
    setIsLocationModalOpen,
    locations,
    isLoadingLocations,
    searchLocations
  } = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    searchLocations(val);
  };

  const filteredLocations = locations.filter(loc =>
    loc.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isLocationModalOpen}
      onClose={() => setIsLocationModalOpen(false)}
      title={t('select_location', 'Select Delivery Location')}
      subtitle={t('select_location_desc', 'Ensure fast 45-minute delivery from nearby verified pharmacies')}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-brandText-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search area, road, or city..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 focus:ring-1 focus:ring-forest-500"
          />
        </div>

        {/* Location List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {isLoadingLocations && (
            <p className="text-center py-2 text-xs text-brandText-secondary">Searching locations...</p>
          )}
          {filteredLocations.map((loc) => {
            const isSelected = selectedLocation.id === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => changeLocation(loc)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-forest-600 bg-forest-50/70 shadow-sm'
                    : 'border-brandBorder-subtle hover:border-forest-300 hover:bg-forest-50/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl mt-0.5 ${isSelected ? 'bg-forest-600 text-white' : 'bg-forest-100 text-forest-700'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isSelected ? 'text-forest-800' : 'text-brandText-main'}`}>
                      {loc.label}
                    </p>
                    <p className="text-xs text-brandText-secondary mt-0.5">
                      {loc.area} (Postal: {loc.defaultPostal})
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-forest-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default LocationModal;
