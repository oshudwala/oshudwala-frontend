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

  // Fetch active locations from backend GET /api/v1/locations
  const fetchActiveLocations = useCallback(async (query = '') => {
    setIsLoadingLocations(true);
    try {
      const params = { page: 1, limit: 50 };
      if (query && query.trim()) params.q = query.trim();
      const response = await locationApi.getLocations(params);
      const items = Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      if (items.length > 0) {
        const formatted = items.map(formatLocation);
        setLocations(formatted);

        // If currently selected location is mock or missing, link to active DB location
        setSelectedLocation((prev) => {
          if (!prev || String(prev.id).startsWith('loc-')) {
            const match = formatted.find(
              (f) => f.pincode === prev?.pincode || (f.city === prev?.city && f.area === prev?.area)
            ) || formatted[0];
            return match;
          }
          const stillActive = formatted.find((f) => f.id === prev.id);
          return stillActive || formatted[0];
        });
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
    if (selectedLocation) {
      localStorage.setItem('oshud_selected_location', JSON.stringify(selectedLocation));
    }
  }, [selectedLocation]);

  // Debounced search for locations
  const searchLocations = (query) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchActiveLocations(query);
    }, 300);
  };

  const changeLocation = (loc) => {
    setSelectedLocation(loc);
    setIsLocationModalOpen(false);
  };

  // Super Admin: Create new location and select it
  const addLocation = async (locationData) => {
    const res = await locationApi.createLocation(locationData);
    const newLoc = res?.data || res;
    await fetchActiveLocations();
    if (newLoc?.id) {
      const formatted = formatLocation(newLoc);
      setSelectedLocation(formatted);
    }
    return newLoc;
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
        addLocation,
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
