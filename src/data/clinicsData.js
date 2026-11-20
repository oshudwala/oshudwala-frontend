import { doctorsData } from './doctorsData';

export const clinicsData = [
  {
    id: "clinic-1",
    name: "Apollo Clinic, Salt Lake Sector 1",
    area: "Salt Lake Sector 1, Kolkata",
    address: "Block BD, Sector 1, Salt Lake, Kolkata-700064",
    phone: "+91 98000 00000",
    timing: "Mon - Sat: 08:00 AM - 08:30 PM",
    rating: 4.8,
    reviewCount: "850+",
    distance: "1.4 km away",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600",
    chamberCount: "12 Chambers",
    doctors: [
      doctorsData.find(d => d.id === "doc-1") || doctorsData[0]
    ]
  },
  {
    id: "clinic-2",
    name: "Fortis Medical Centre, Gariahat",
    area: "Gariahat / Anandapur, Kolkata",
    address: "730 Anandapur, EM Bypass / Gariahat Road, Kolkata-700107",
    phone: "+91 98000 00000",
    timing: "Mon - Sun: 08:00 AM - 09:00 PM",
    rating: 4.8,
    reviewCount: "640+",
    distance: "3.2 km away",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600",
    chamberCount: "16 Chambers",
    doctors: [
      doctorsData.find(d => d.id === "doc-2") || doctorsData[1]
    ]
  },
  {
    id: "clinic-3",
    name: "Belle Vue Skin & Laser Clinic",
    area: "Loudon Street, Central Kolkata",
    address: "9 Dr. U.N. Brahmachari Street, Loudon Street Area, Kolkata-700017",
    phone: "+91 98000 00000",
    timing: "Mon - Sat: 10:00 AM - 07:00 PM",
    rating: 4.7,
    reviewCount: "520+",
    distance: "4.5 km away",
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600",
    chamberCount: "8 Chambers",
    doctors: [
      doctorsData.find(d => d.id === "doc-3") || doctorsData[2]
    ]
  },
  {
    id: "clinic-4",
    name: "Woodlands Multispeciality Center",
    area: "Alipore, Kolkata",
    address: "8/5 Alipore Road, Kolkata-700027",
    phone: "+91 98000 00000",
    timing: "Mon - Sat: 09:00 AM - 08:00 PM",
    rating: 4.9,
    reviewCount: "1.1k+",
    distance: "5.8 km away",
    image: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=600",
    chamberCount: "20 Chambers",
    doctors: [
      doctorsData.find(d => d.id === "doc-5") || doctorsData[4]
    ]
  },
  {
    id: "clinic-5",
    name: "Little Stars Child Clinic, Durgapur",
    area: "City Centre, Durgapur",
    address: "Plot A-12, City Centre Commercial Complex, Durgapur-713216",
    phone: "+91 98000 00000",
    timing: "Mon - Sat: 09:30 AM - 08:30 PM",
    rating: 4.7,
    reviewCount: "490+",
    distance: "Serving Durgapur",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=600",
    chamberCount: "6 Chambers",
    doctors: [
      doctorsData.find(d => d.id === "doc-4") || doctorsData[3]
    ]
  },
  {
    id: "clinic-6",
    name: "Care Orthopedic & Trauma Centre",
    area: "Chinsurah, Hooghly",
    address: "GT Road, Chinsurah Station Area, Hooghly-712101",
    phone: "+91 98000 00000",
    timing: "Mon - Sat: 10:00 AM - 08:30 PM",
    rating: 4.8,
    reviewCount: "610+",
    distance: "Serving Hooghly",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600",
    chamberCount: "10 Chambers",
    doctors: [
      doctorsData.find(d => d.id === "doc-6") || doctorsData[5]
    ]
  }
];
