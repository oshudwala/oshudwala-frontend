import React, { useState } from 'react';
import {
  Stethoscope,
  Building2,
  Activity,
  Plus,
  MapPin,
  Star,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const AdminEntitiesPage = ({ initialTab = 'doctors' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { addToast } = useToast();

  const doctorsData = [
    { id: 'doc-01', name: 'Dr. Priya Sharma', qualification: 'MBBS, MD', specialty: 'General Physician', experience: '12 yrs', clinic: 'Apollo Clinic Salt Lake', rating: 4.8, consultations: 1420, status: 'ACTIVE' },
    { id: 'doc-02', name: 'Dr. Rohit Mehta', qualification: 'MBBS, DM (Cardio)', specialty: 'Cardiologist', experience: '15 yrs', clinic: 'BM Birla Heart Research', rating: 4.9, consultations: 980, status: 'ACTIVE' },
    { id: 'doc-03', name: 'Dr. Sneha Das', qualification: 'MBBS, DVD', specialty: 'Dermatologist', experience: '8 yrs', clinic: 'Skin & Cure Clinic Park Street', rating: 4.7, consultations: 730, status: 'ACTIVE' },
    { id: 'doc-04', name: 'Dr. Amit Verma', qualification: 'MBBS, DCH', specialty: 'Pediatrician', experience: '10 yrs', clinic: 'AMRI Hospital Dhakuria', rating: 4.7, consultations: 650, status: 'ACTIVE' },
  ];

  const pharmaciesData = [
    { id: 'pharma-01', name: 'MedPlus Pharmacy - Sector V', license: 'WB-BIO-2023-9942', area: 'Sector V, Salt Lake', city: 'Kolkata', contact: '+91 33 2357 8900', status: 'ACTIVE', ordersFulfilled: 3420 },
    { id: 'pharma-02', name: 'Wellness Forever - Golpark', license: 'WB-BIO-2022-4412', area: 'Gariahat Road', city: 'Kolkata', contact: '+91 33 2464 1200', status: 'ACTIVE', ordersFulfilled: 2190 },
    { id: 'pharma-03', name: 'Care N Cure Pharmacy', license: 'WB-BIO-2021-1190', area: 'Howrah Station Road', city: 'Howrah', contact: '+91 33 2666 4300', status: 'ACTIVE', ordersFulfilled: 1840 },
    { id: 'pharma-04', name: 'Apollo Pharmacy - Durgapur City Centre', license: 'WB-BUR-2023-8812', area: 'City Centre', city: 'Durgapur', contact: '+91 343 254 6700', status: 'ACTIVE', ordersFulfilled: 1290 },
  ];

  const clinicsData = [
    { id: 'cln-01', name: 'Apollo Clinic, Salt Lake Kolkata', address: 'Block DC, Sector 1, Salt Lake City', city: 'Kolkata', rooms: 6, doctorsEnrolled: 8, status: 'ACTIVE' },
    { id: 'cln-02', name: 'Skin & Cure Clinic', address: '12 Park Street, Camac Street Area', city: 'Kolkata', rooms: 3, doctorsEnrolled: 4, status: 'ACTIVE' },
    { id: 'cln-03', name: 'Durgapur Care PolyClinic', address: 'Benachity Main Road, Durgapur', city: 'Durgapur', rooms: 4, doctorsEnrolled: 5, status: 'ACTIVE' },
  ];

  const doctorColumns = [
    {
      header: 'Doctor Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary">{row.qualification} &bull; {row.specialty}</p>
        </div>
      ),
    },
    { header: 'Associated Clinic', key: 'clinic', render: (row) => <span className="text-xs text-forest-800">{row.clinic}</span> },
    { header: 'Experience', key: 'experience', render: (row) => <span className="text-xs">{row.experience}</span> },
    {
      header: 'Rating & Consults',
      key: 'rating',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-xs text-amber-700 flex items-center justify-end gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span>{row.rating}</span>
          </span>
          <span className="text-[10px] text-brandText-muted">{row.consultations} patients</span>
        </div>
      ),
    },
    { header: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const pharmacyColumns = [
    {
      header: 'Pharmacy Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-muted">License: {row.license}</p>
        </div>
      ),
    },
    { header: 'City & Area', key: 'area', render: (row) => <span className="text-xs text-forest-800">{row.area}, {row.city}</span> },
    { header: 'Contact', key: 'contact', render: (row) => <span className="text-xs font-mono">{row.contact}</span> },
    { header: 'Orders Fulfilled', key: 'ordersFulfilled', align: 'right', render: (row) => <span className="font-bold text-xs">{row.ordersFulfilled}</span> },
    { header: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  const clinicColumns = [
    {
      header: 'Clinic Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-muted">{row.address}</p>
        </div>
      ),
    },
    { header: 'City', key: 'city', render: (row) => <span className="text-xs">{row.city}</span> },
    { header: 'Rooms & Chambers', key: 'rooms', render: (row) => <span className="text-xs font-bold">{row.rooms} Consultation Rooms</span> },
    { header: 'Doctors Enrolled', key: 'doctorsEnrolled', render: (row) => <span className="text-xs font-semibold text-forest-700">{row.doctorsEnrolled} Specialists</span> },
    { header: 'Status', key: 'status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Healthcare Entity Network
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Manage certified doctors, partner pharmacies, and polyclinics in West Bengal.
          </p>
        </div>
      </div>

      {/* Entity Tabs */}
      <div className="flex items-center gap-2 border-b border-brandBorder-subtle pb-2">
        <button
          onClick={() => setActiveTab('doctors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'doctors'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctors ({doctorsData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pharmacies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pharmacies'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Pharmacies ({pharmaciesData.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('clinics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'clinics'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Polyclinics ({clinicsData.length})</span>
        </button>
      </div>

      {/* Active Table */}
      {activeTab === 'doctors' && (
        <DataTable
          columns={doctorColumns}
          data={doctorsData}
          searchKey="name"
          searchPlaceholder="Search doctor by name or specialty..."
        />
      )}

      {activeTab === 'pharmacies' && (
        <DataTable
          columns={pharmacyColumns}
          data={pharmaciesData}
          searchKey="name"
          searchPlaceholder="Search pharmacy by name or license..."
        />
      )}

      {activeTab === 'clinics' && (
        <DataTable
          columns={clinicColumns}
          data={clinicsData}
          searchKey="name"
          searchPlaceholder="Search polyclinic by name..."
        />
      )}
    </div>
  );
};

export default AdminEntitiesPage;
