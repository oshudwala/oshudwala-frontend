import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

export const defaultLocations = [
  { id: 'loc-1', city: 'Kolkata', area: 'Salt Lake & New Town', label: 'Kolkata, West Bengal', defaultPostal: '700091' },
  { id: 'loc-2', city: 'Kolkata', area: 'Park Street & South Kolkata', label: 'South Kolkata, West Bengal', defaultPostal: '700016' },
  { id: 'loc-3', city: 'Durgapur', area: 'City Centre & Benachity', label: 'Durgapur, West Bengal', defaultPostal: '713216' },
  { id: 'loc-4', city: 'Hooghly', area: 'Chinsurah, Serampore & Chandannagar', label: 'Hooghly, West Bengal', defaultPostal: '712101' },
  { id: 'loc-5', city: 'Howrah', area: 'Howrah Maidan & Shibpur', label: 'Howrah, West Bengal', defaultPostal: '711101' },
  { id: 'loc-6', city: 'Asansol', area: 'GT Road & Burnpur', label: 'Asansol, West Bengal', defaultPostal: '713303' },
  { id: 'loc-7', city: 'Siliguri', area: 'Sevoke Road & Matigara', label: 'Siliguri, West Bengal', defaultPostal: '734001' },
  { id: 'loc-8', city: 'Kalyani', area: 'AIIMS Kalyani & Central Park', label: 'Kalyani, West Bengal', defaultPostal: '741235' }
];

export const LocationProvider = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const saved = localStorage.getItem('oshud_selected_location');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If old Bangladesh location is stored, fallback to Kolkata
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

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('oshud_selected_location', JSON.stringify(selectedLocation));
  }, [selectedLocation]);

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
        locations: defaultLocations
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
