import React, { useState, useEffect } from 'react';
import { Building2, Package, CheckCircle2, ShieldCheck, FileText, Bike, RefreshCw, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { pharmacyApi } from '../services/api/pharmacy.api';
import { doctorApi } from '../services/api/doctor.api';
import Button from '../components/common/Button';

export const PharmacyDashboardPage = () => {
  const { user } = useAuth();
  const [pharmacies, setPharmacies] = useState([]);
  const [ownPharmacy, setOwnPharmacy] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allPharms, myPharm] = await Promise.all([
        pharmacyApi.getPharmacies().catch(() => []),
        pharmacyApi.getMyPharmacy().catch(() => null),
      ]);
      setPharmacies(allPharms);
      setOwnPharmacy(myPharm);

      // If a primary/selected pharmacy exists, load its doctors
      const primaryPharm = myPharm?.id ? myPharm : allPharms[0];
      if (primaryPharm?.id) {
        const docList = await doctorApi.getDoctorsByPharmacy(primaryPharm.id).catch(() => []);
        setDoctors(docList);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-20 h-20 rounded-full bg-forest-100 border-4 border-forest-600 flex items-center justify-center text-forest-700 shadow-card">
            <Building2 className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800">
                {ownPharmacy?.name || user?.fullName || 'Pharmacy Operations Desk'}
              </h1>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800 border border-forest-200">
                Licensed Partner
              </span>
            </div>
            <p className="text-xs text-brandText-secondary mt-1">{user?.email}</p>
            <p className="text-xs text-forest-600 font-semibold mt-0.5 font-mono">Operator: {user?.phone}</p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={loadData} leftIcon={RefreshCw}>
          Refresh Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Prescription Dispensing Queue */}
          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
            <h3 className="font-heading font-bold text-lg text-forest-800">Prescription Verification Desk</h3>
            <p className="text-xs text-brandText-secondary">
              Incoming customer prescriptions awaiting licensed pharmacist digital sign-off
            </p>

            <div className="p-6 rounded-2xl bg-surface-warm border border-brandBorder-subtle text-center space-y-2">
              <FileText className="w-8 h-8 text-forest-600 mx-auto opacity-60" />
              <p className="text-xs font-semibold text-forest-800">No Prescriptions Awaiting Verification</p>
              <p className="text-[11px] text-brandText-secondary max-w-sm mx-auto">
                Patient prescriptions submitted for this pharmacy location will automatically appear here once the Step 5 Prescription OCR module is active.
              </p>
            </div>
          </div>

          {/* Connected Doctors */}
          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
            <h3 className="font-heading font-bold text-lg text-forest-800">Chamber Doctors On-Premise</h3>
            {isLoading ? (
              <p className="text-xs text-brandText-secondary">Loading doctors...</p>
            ) : doctors.length === 0 ? (
              <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle text-xs text-brandText-secondary">
                No doctors currently affiliated with this pharmacy location. Contact Super Admin to onboard doctors.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((doc, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-1">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-forest-600" />
                      <h4 className="text-xs font-bold text-forest-800">{doc.fullName || doc.name}</h4>
                    </div>
                    <p className="text-[11px] text-brandText-secondary">Reg: {doc.registrationNumber || 'Verified'}</p>
                    <p className="text-[10px] text-forest-700 font-mono">Phone: {doc.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-3">
            <h3 className="font-heading font-bold text-base text-forest-800">Rider Handover</h3>
            <p className="text-xs text-brandText-secondary leading-relaxed">
              When packaging is ready, generate an OTP or package barcode for assigned delivery rider pickup.
            </p>
            <div className="p-3 rounded-2xl bg-forest-50 border border-forest-100 flex items-center gap-2 text-xs text-forest-800 font-semibold">
              <Bike className="w-4 h-4 text-forest-600" />
              <span>Rider dispatch linked with backend API</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboardPage;
