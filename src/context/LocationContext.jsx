import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { locationApi } from '../services/api/location.api';

const LocationContext = createContext(null);

export const defaultLocations = [
  { id: 'loc-1', city: 'Durgapur', area: 'City Centre', state: 'West Bengal', pincode: '713216', label: 'City Centre, Durgapur', defaultPostal: '713216' },
  { id: 'loc-2', city: 'Durgapur', area: 'Bidhannagar', state: 'West Bengal', pincode: '713212', label: 'Bidhannagar, Durgapur', defaultPostal: '713212' },
  { id: 'loc-3', city: 'Kolkata', area: 'Salt Lake', state: 'West Bengal', pincode: '700091', label: 'Salt Lake, Kolkata', defaultPostal: '700091' },
  { id: 'loc-4', city: 'Kolkata', area: 'Park Street', state: 'West Bengal', pincode: '700016', label: 'Park Street, Kolkata', defaultPostal: '700016' },
];

// Haversine distance in km (used when DB locations have latitude/longitude)
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState(defaultLocations);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isLocationServiceable, setIsLocationServiceable] = useState(true);
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

        setSelectedLocation((prev) => {
          if (!prev || prev.isUnavailable) return prev;
          if (String(prev.id).startsWith('loc-')) {
            const match =
              formatted.find(
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
      setIsLocationServiceable(!selectedLocation.isUnavailable);
    }
  }, [selectedLocation]);

  // Live GPS Detection + Serviceability Check
  const detectLiveLocation = useCallback(async () => {
    setLocationError('');

    if (!navigator.geolocation) {
      const msg = 'Live location is not supported by your browser.';
      setLocationError(msg);
      return { available: false, message: msg };
    }

    setIsDetectingLocation(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Reverse geocode via OpenStreetMap Nominatim
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const geoData = await geoRes.json();
            const addr = geoData?.address || {};

            const detectedPincode = String(addr.postcode || '').trim();
            const detectedCity = String(
              addr.city || addr.town || addr.village || addr.county || addr.state_district || ''
            ).trim();
            const detectedArea = String(
              addr.suburb || addr.neighbourhood || addr.road || detectedCity || ''
            ).trim();
            const detectedState = String(addr.state || 'West Bengal').trim();

            // Fetch latest active locations list from backend
            const activeList = await fetchActiveLocations();
            const pool = activeList && activeList.length > 0 ? activeList : locations;

            // Match by Pincode -> City/Area -> Coordinate radius (<= 15km)
            let matched =
              (detectedPincode &&
                pool.find((loc) => String(loc.pincode || '').trim() === detectedPincode)) ||
              (detectedCity &&
                pool.find(
                  (loc) =>
                    loc.city?.toLowerCase() === detectedCity.toLowerCase() &&
                    (!detectedArea ||
                      loc.area?.toLowerCase().includes(detectedArea.toLowerCase()) ||
                      detectedArea.toLowerCase().includes(loc.area?.toLowerCase()))
                )) ||
              (detectedCity &&
                pool.find((loc) => loc.city?.toLowerCase() === detectedCity.toLowerCase())) ||
              pool.find(
                (loc) =>
                  loc.latitude != null &&
                  loc.longitude != null &&
                  getDistanceKm(latitude, longitude, Number(loc.latitude), Number(loc.longitude)) <= 15
              );

            if (matched) {
              const resolvedLoc = { ...matched, latitude, longitude, isUnavailable: false };
              setSelectedLocation(resolvedLoc);
              setIsLocationServiceable(true);
              setLocationError('');
              setIsLocationModalOpen(false);
              setIsDetectingLocation(false);
              resolve({ available: true, location: resolvedLoc });
            } else {
              const displayPlace = [detectedArea, detectedCity, detectedPincode]
                .filter(Boolean)
                .join(', ');
              const unavailableLoc = {
                id: 'unavailable-live',
                city: detectedCity || 'Unknown',
                area: detectedArea || 'Current Location',
                state: detectedState,
                pincode: detectedPincode,
                defaultPostal: detectedPincode,
                label: displayPlace || 'Current Location',
                latitude,
                longitude,
                isUnavailable: true,
              };
              const msg = 'This location is not available';
              setSelectedLocation(unavailableLoc);
              setIsLocationServiceable(false);
              setLocationError(msg);
              setIsDetectingLocation(false);
              resolve({ available: false, message: msg, location: unavailableLoc });
            }
          } catch (err) {
            const msg = 'Unable to verify your current location. Please select manually.';
            setLocationError(msg);
            setIsDetectingLocation(false);
            resolve({ available: false, message: msg });
          }
        },
        (err) => {
          const msg =
            err.code === 1
              ? 'Location permission denied. Please allow location access in browser.'
              : 'Could not detect your live location. Please try again.';
          setLocationError(msg);
          setIsDetectingLocation(false);
          resolve({ available: false, message: msg });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [fetchActiveLocations, locations]);

  // Debounced search for locations
  const searchLocations = (query) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchActiveLocations(query);
    }, 300);
  };

  const changeLocation = (loc) => {
    setLocationError('');
    setIsLocationServiceable(true);
    setSelectedLocation({ ...loc, isUnavailable: false });
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
      setLocationError('');
      setIsLocationServiceable(true);
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
        isDetectingLocation,
        locationError,
        isLocationServiceable,
        detectLiveLocation,
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