import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { locationApi } from '../services/api/location.api';

const LocationContext = createContext(null);

export const defaultLocations = [
  { id: 'loc-1', city: 'Durgapur', area: 'City Centre', state: 'West Bengal', pincode: '713216', label: 'City Centre, Durgapur', defaultPostal: '713216' },
  { id: 'loc-2', city: 'Durgapur', area: 'Bidhannagar', state: 'West Bengal', pincode: '713212', label: 'Bidhannagar, Durgapur', defaultPostal: '713212' },
  { id: 'loc-3', city: 'Kolkata', area: 'Salt Lake', state: 'West Bengal', pincode: '700091', label: 'Salt Lake, Kolkata', defaultPostal: '700091' },
  { id: 'loc-4', city: 'Kolkata', area: 'Park Street', state: 'West Bengal', pincode: '700016', label: 'Park Street, Kolkata', defaultPostal: '700016' },
];

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState(defaultLocations);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const debounceTimerRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(() => {
    const saved = localStorage.getItem('oshud_selected_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.label?.includes('Bangladesh') || parsed?.label?.includes('Dhaka')) {
          return defaultLocations[0];
        }
        return parsed;
      } catch {
        return defaultLocations[0];
      }
    }
    return defaultLocations[0];
  });

  const formatLocation = (loc) => ({
    id: loc.id,
    city: loc.city,
    area: loc.area || loc.city,
    state: loc.state,
    pincode: loc.pincode,
    defaultPostal: loc.pincode,
    label: loc.area ? `${loc.area}, ${loc.city}` : `${loc.city}, ${loc.state}`,
    latitude: loc.latitude,
    longitude: loc.longitude,
    isActive: loc.isActive,
  });

  // Fetch initial active locations from backend
  const fetchActiveLocations = useCallback(async (query = '') => {
    setIsLoadingLocations(true);
    try {
      const params = { page: 1, limit: 50 };
      if (query.trim()) params.q = query.trim();
      const response = await locationApi.getLocations(params);
      const items = response?.items || (Array.isArray(response) ? response : []);

      if (items.length > 0) {
        const formatted = items.map(formatLocation);
        setLocations(formatted);
        return formatted;
      }
      return defaultLocations;
    } catch (err) {
      console.warn('Backend /locations fetch error, using defaults:', err.message);
      return defaultLocations;
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveLocations();
  }, [fetchActiveLocations]);

  useEffect(() => {
    localStorage.setItem('oshud_selected_location', JSON.stringify(selectedLocation));
  }, [selectedLocation]);

  // Debounced search for locations
  const searchLocations = (query) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchActiveLocations(query);
    }, 350);
  };

  const changeLocation = (loc) => {
    setSelectedLocation(loc);
    setIsLocationModalOpen(false);
  };

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        changeLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
        locations,
        isLoadingLocations,
        searchLocations,
        refreshLocations: fetchActiveLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};

export default LocationContext;
