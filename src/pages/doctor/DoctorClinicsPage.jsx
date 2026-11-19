import React from 'react';
import { Building2, MapPin, Phone, Users, Clock, ExternalLink } from 'lucide-react';
import Button from '../../components/common/Button';

export const DoctorClinicsPage = () => {
  const clinics = [
    {
      id: 'cln-01',
      name: 'Apollo Clinic, Salt Lake Kolkata',
      address: 'Block DC, Sector 1, Salt Lake City, Kolkata 700064',
      phone: '+91 33 4012 3456',
      chamber: 'Room 204, 2nd Floor',
      deskStaff: 'Ananya Roy (Receptionist Desk)',
      consultationFee: '₹600',
      activeQueue: '4 Patients Waiting',
      status: 'PRIMARY_CHAMBER',
    },
    {
      id: 'cln-02',
      name: 'BM Birla Heart Research Centre',
      address: '1/1 National Library Avenue, Alipore, Kolkata 700027',
      phone: '+91 33 2456 7890',
      chamber: 'OPD Block C, Chamber 12',
      deskStaff: 'Hospital OPD Desk',
      consultationFee: '₹900',
      activeQueue: 'Wednesdays Only',
      status: 'SECONDARY_CHAMBER',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Associated Chambers & Polyclinics
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Practicing polyclinic affiliations, consultation fees, and reception desk coordinators.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clinics.map((clinic) => (
          <div
            key={clinic.id}
            className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4 hover:border-forest-300 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-forest-50 text-forest-700">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-forest-900">
                    {clinic.name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 uppercase">
                    {clinic.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-brandText-secondary">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
                <span>{clinic.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-forest-600 flex-shrink-0" />
                <span>{clinic.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-forest-600 flex-shrink-0" />
                <span>Reception Coordinator: {clinic.deskStaff}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-brandBorder-subtle flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] text-brandText-muted uppercase">Consultation Fee</p>
                <p className="font-extrabold text-base text-forest-900">{clinic.consultationFee}</p>
              </div>
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {clinic.activeQueue}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorClinicsPage;
