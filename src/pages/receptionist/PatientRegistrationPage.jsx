import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Printer,
  CheckCircle,
  Plus,
  Stethoscope,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  Building2,
  Loader2,
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { clinicApi } from '../../services/api/clinic.api';

export const PatientRegistrationPage = () => {
  const { user } = useAuth();
  const { generateToken } = useWorkspaceStore();
  const { addToast } = useToast();

  const [clinic, setClinic] = useState({ name: 'Apollo Clinic & Polyclinic', city: 'Kolkata' });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    age: '',
    gender: 'Male',
    symptoms: '',
  });

  const [generatedTicket, setGeneratedTicket] = useState(null);

  // Load clinic profile and active clinic doctors from backend
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [profile, docs] = await Promise.all([
          clinicApi.getClinicProfile(user),
          clinicApi.getClinicDoctors(user?.id || 'default'),
        ]);
        if (isMounted) {
          setClinic(profile);
          setDoctors(docs);
          if (docs.length > 0 && !selectedDoctorId) {
            setSelectedDoctorId(docs[0].id);
          }
        }
      } catch (e) {
        console.warn('Failed to load clinic registration context:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    const handleRosterUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setDoctors(e.detail);
        if (e.detail.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(e.detail[0].id);
        }
      } else {
        loadData();
      }
    };

    window.addEventListener('oshud_clinic_doctors_updated', handleRosterUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('oshud_clinic_doctors_updated', handleRosterUpdate);
    };
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.patientPhone) return;

    const chosenDoc = doctors.find((d) => d.id === selectedDoctorId || d.doctorId === selectedDoctorId) || doctors[0];

    const token = generateToken({
      patientName: formData.patientName.trim(),
      patientPhone: formData.patientPhone.trim(),
      age: formData.age,
      gender: formData.gender,
      symptoms: formData.symptoms || 'General OPD Checkup',
      type: 'WALK_IN',
      doctorId: chosenDoc?.id || 'doc-01',
      doctorName: chosenDoc?.name || 'Dr. Priya Sharma',
      clinicName: clinic.name,
      room: chosenDoc?.room || 'Room 204',
      slot: 'Walk-in Queue',
    });

    setGeneratedTicket(token);
    addToast(
      `Token #${token.tokenNumber} issued for ${token.patientName} (${chosenDoc?.name || 'Doctor'})!`,
      'success'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleNewRegistration = () => {
    setGeneratedTicket(null);
    setFormData({
      patientName: '',
      patientPhone: '',
      age: '',
      gender: 'Male',
      symptoms: '',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto min-h-[380px] flex flex-col items-center justify-center p-12 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card space-y-3">
        <Loader2 className="w-8 h-8 text-forest-700 animate-spin" />
        <p className="text-sm font-bold text-forest-900">Loading Walk-in Intake Desk...</p>
        <p className="text-xs text-brandText-secondary">Fetching active doctor chambers and clinic roster</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Walk-in Patient Desk & Token Generation
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Doctor-wise token issuing desk for walk-in arrivals at {clinic.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Form (7 Cols) */}
        <div className="md:col-span-7 bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-forest-900">
                Patient Intake Form
              </h2>
              <p className="text-xs text-brandText-secondary">
                Auto-generates queue ticket and transmits patient to doctor's chamber queue
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-forest-800">Consulting Doctor & Chamber</label>
              <select
                required
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium text-forest-900"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialty} ({doc.room})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-forest-800">Patient Full Name</label>
              <input
                type="text"
                required
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="e.g. Ramesh Chandra Sen"
                className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-forest-800">Phone Number</label>
                <input
                  type="text"
                  required
                  value={formData.patientPhone}
                  onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                  placeholder="e.g. +91 98300 00000"
                  className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Age</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="45"
                  className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-forest-800">Gender</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {['Male', 'Female', 'Other'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      formData.gender === g
                        ? 'bg-forest-800 text-white border-forest-800 shadow-sm'
                        : 'bg-surface-warm text-brandText-secondary border-brandBorder-subtle hover:bg-forest-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-forest-800">
                Chief Symptoms & Health Complaints
              </label>
              <textarea
                rows={2}
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="e.g. Mild headache, feverish feeling for 2 days..."
                className="w-full mt-1 p-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={Plus}
              className="w-full text-xs font-bold py-2.5 shadow-md"
            >
              Generate Queue Token Slip
            </Button>
          </form>
        </div>

        {/* Right Ticket Preview (5 Cols) */}
        <div className="md:col-span-5 space-y-4">
          {generatedTicket ? (
            <div className="bg-surface-pure rounded-3xl border-2 border-forest-600 shadow-floating p-6 text-center space-y-5 animate-scale-up">
              <div className="border-b border-brandBorder-subtle pb-4 space-y-1">
                <p className="font-heading font-black text-sm text-forest-900 uppercase tracking-wider">
                  {clinic.name}
                </p>
                <p className="text-[10px] text-brandText-muted">
                  OPD Queue Ticket &bull; {clinic.city}
                </p>
              </div>

              <div className="py-2">
                <p className="text-[11px] font-bold text-forest-800 uppercase tracking-widest">
                  YOUR TOKEN NUMBER
                </p>
                <span className="font-mono font-black text-6xl text-forest-900 tracking-tight block mt-1">
                  #{generatedTicket.tokenNumber}
                </span>
                <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800 mt-1 uppercase">
                  Walk-in Token
                </span>
              </div>

              <div className="bg-surface-warm p-4 rounded-2xl border border-brandBorder-subtle text-xs text-left space-y-1.5">
                <p className="font-bold text-forest-900 text-sm">{generatedTicket.patientName}</p>
                <p className="text-brandText-secondary">
                  {generatedTicket.gender}, {generatedTicket.age} yrs &bull; {generatedTicket.patientPhone}
                </p>
                <div className="pt-1.5 border-t border-brandBorder-subtle space-y-0.5">
                  <p className="text-forest-900 font-bold">
                    Doctor: {generatedTicket.doctorName}
                  </p>
                  <p className="text-forest-700 font-semibold">
                    Consultation Chamber: {generatedTicket.room}
                  </p>
                </div>
                <p className="text-[10px] text-brandText-muted pt-1">
                  Issued at: {generatedTicket.arrivedAt}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Printer}
                  onClick={handlePrint}
                  className="flex-1 text-xs"
                >
                  Print Ticket
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleNewRegistration}
                  className="flex-1 text-xs"
                >
                  Next Patient
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle p-8 text-center space-y-3 shadow-card">
              <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-base text-forest-900">
                Instant Token Printing
              </h3>
              <p className="text-xs text-brandText-secondary">
                Submit patient intake on the left to immediately generate and print a queue token routed to the selected doctor's chamber.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientRegistrationPage;
