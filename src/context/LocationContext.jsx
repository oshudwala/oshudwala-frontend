import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

export const defaultLocations = [
  { id: 'loc-1', city: 'Dhaka', area: 'Dhanmondi, Road 7', label: 'Dhaka, Bangladesh', defaultPostal: '1205' },
  { id: 'loc-2', city: 'Dhaka', area: 'Banani & Gulshan', label: 'Banani, Dhaka', defaultPostal: '1213' },
  { id: 'loc-3', city: 'Dhaka', area: 'Uttara Model Town', label: 'Uttara, Dhaka', defaultPostal: '1230' },
  { id: 'loc-4', city: 'Dhaka', area: 'Bashundhara R/A', label: 'Bashundhara, Dhaka', defaultPostal: '1229' },
  { id: 'loc-5', city: 'Dhaka', area: 'Mirpur DOHS', label: 'Mirpur, Dhaka', defaultPostal: '1216' },
  { id: 'loc-6', city: 'Chattogram', area: 'GEC Circle & Agrabad', label: 'Chattogram, Bangladesh', defaultPostal: '4000' },
  { id: 'loc-7', city: 'Sylhet', area: 'Zindabazar & Subidbazar', label: 'Sylhet, Bangladesh', defaultPostal: '3100' }
];

export const LocationProvider = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const saved = localStorage.getItem('oshud_selected_location');
    return saved ? JSON.parse(saved) : defaultLocations[0];
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
