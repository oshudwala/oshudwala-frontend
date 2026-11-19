import React, { useState, useEffect } from 'react';
import { Stethoscope, Calendar, Clock, User, CheckCircle2, AlertCircle, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doctorApi } from '../services/api/doctor.api';
import { pharmacyApi } from '../services/api/pharmacy.api';
import Button from '../components/common/Button';

export const DoctorDashboardPage = () => {
  const { user } = useAuth();
  const [specializations, setSpecializations] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [specs, pharms] = await Promise.all([
          doctorApi.getSpecializations().catch(() => []),
          pharmacyApi.getPharmacies().catch(() => []),
        ]);
        setSpecializations(specs);
        setPharmacies(pharms);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-20 h-20 rounded-full bg-forest-100 border-4 border-forest-600 flex items-center justify-center text-forest-700 shadow-card">
            <Stethoscope className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800">
                {user?.fullName || user?.name || 'Doctor Workspace'}
              </h1>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Authorized Doctor
              </span>
            </div>
            <p className="text-xs text-brandText-secondary mt-1">{user?.email || 'doctor@oshudwala.com'}</p>
            <p className="text-xs text-forest-600 font-semibold mt-0.5 font-mono">Phone: {user?.phone}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="px-3 py-1 rounded-full bg-forest-50 text-forest-700 border border-forest-200 text-xs font-bold">
            Live Clinical Queue
          </span>
        </div>
      </div>

      {/* Grid: Chamber Information & Live Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-forest-800">Assigned Pharmacy Chambers</h3>
                <p className="text-xs text-brandText-secondary">
                  Pharmacies affiliated with your chamber consultations
                </p>
              </div>
            </div>

            {isLoading ? (
              <p className="text-xs text-brandText-secondary">Loading chamber affiliations...</p>
            ) : pharmacies.length === 0 ? (
              <p className="text-xs text-brandText-secondary">No affiliated pharmacy chambers found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pharmacies.map((p) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-forest-600" />
                      <h4 className="font-bold text-xs text-forest-800">{p.name}</h4>
                    </div>
                    <p className="text-[11px] text-brandText-secondary leading-relaxed">{p.line1}, {p.city}</p>
                    <p className="text-[10px] text-forest-700 font-mono">Contact: {p.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
            <h3 className="font-heading font-bold text-lg text-forest-800">Patient Queue Token Controller</h3>
            <p className="text-xs text-brandText-secondary">
              Real-time patient serving controls sync with chamber LCD display and patient SMS notifications.
            </p>
            <div className="p-6 rounded-2xl bg-forest-50 border border-forest-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-forest-700 font-semibold">Current Serving Token</p>
                <p className="text-3xl font-extrabold text-forest-900 mt-1">TOKEN #14</p>
                <p className="text-[11px] text-brandText-secondary mt-0.5">Patient: Rahul Sen • General Physician</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Recall</Button>
                <Button variant="outline" size="sm">Skip</Button>
                <Button variant="primary" size="md">Call Next Token</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
            <h3 className="font-heading font-bold text-base text-forest-800">Specializations</h3>
            <div className="flex flex-wrap gap-2">
              {specializations.map((s) => (
                <span key={s.id} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-forest-100 text-forest-800">
                  {s.name}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-surface-pure border border-brandBorder-subtle shadow-subtle space-y-3">
            <div className="flex items-center gap-2 text-forest-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Prescription Standards</span>
            </div>
            <p className="text-xs text-brandText-secondary leading-relaxed">
              Prescriptions written in this clinical module undergo instant verification by affiliated Oshud Wala pharmacies before dispensing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardPage;
