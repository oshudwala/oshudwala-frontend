import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Heart,
  Clock,
  Search,
  ExternalLink,
  Plus,
  HeartPulse,
  Save,
  X,
  FilePlus,
  Activity,
  Calendar,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import Drawer from '../../components/workspace/Drawer';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import doctorApi from '../../services/api/doctor.api';

export const DoctorPatientsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const doctorName = user?.fullName || user?.name || 'Dr. Priya Sharma';

  const [patients, setPatients] = useState(() => doctorApi.getPatientRecords());
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    chronicConditions: '',
    allergies: '',
    bp: '120/80',
    pulse: '72',
    temp: '98.4',
    weight: '68',
    spO2: '99',
    symptoms: '',
    diagnosis: '',
    medicines: '',
    advice: 'Follow up as needed.',
  });

  const loadPatients = () => {
    const list = doctorApi.getPatientRecords();
    setPatients(list);
    if (selectedPatient) {
      const refreshed = list.find((p) => p.id === selectedPatient.id);
      if (refreshed) setSelectedPatient(refreshed);
    }
  };

  useEffect(() => {
    loadPatients();
    const handleUpdate = () => loadPatients();
    window.addEventListener('oshud_patient_records_updated', handleUpdate);
    return () => {
      window.removeEventListener('oshud_patient_records_updated', handleUpdate);
    };
  }, []);

  const handleSavePatient = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      addToast('Patient name and phone number are required.', 'error');
      return;
    }

    const saved = doctorApi.savePatientRecord({
      name: form.name,
      phone: form.phone,
      age: form.age,
      gender: form.gender,
      bloodGroup: form.bloodGroup,
      chronicConditions: form.chronicConditions,
      allergies: form.allergies,
      vitals: {
        bp: form.bp,
        pulse: form.pulse,
        temp: form.temp,
        weight: form.weight,
        spO2: form.spO2,
      },
      symptoms: form.symptoms,
      diagnosis: form.diagnosis,
      doctorName,
      prescription: {
        medicines: form.medicines
          ? form.medicines.split(',').map((m) => ({ name: m.trim(), dosage: '1 tab daily', duration: '5 days' }))
          : [],
        advice: form.advice,
      },
    });

    addToast(`Patient record for ${form.name} saved successfully!`, 'success');
    setShowAddModal(false);
    setForm({
      name: '',
      phone: '',
      age: '',
      gender: 'Male',
      bloodGroup: 'O+',
      chronicConditions: '',
      allergies: '',
      bp: '120/80',
      pulse: '72',
      temp: '98.4',
      weight: '68',
      spO2: '99',
      symptoms: '',
      diagnosis: '',
      medicines: '',
      advice: 'Follow up as needed.',
    });
    loadPatients();
  };

  const columns = [
    {
      header: 'Patient Details',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary">
            {row.gender}, {row.age} yrs &bull; {row.phone}
          </p>
        </div>
      ),
    },
    {
      header: 'Blood Group',
      key: 'bloodGroup',
      render: (row) => (
        <span className="font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
          {row.bloodGroup || 'O+'}
        </span>
      ),
    },
    {
      header: 'Latest Vitals',
      key: 'latestVitals',
      render: (row) => (
        <div className="text-[11px] font-mono text-forest-800">
          <span>BP: {row.latestVitals?.bp || '120/80'}</span>
          <span className="text-brandText-muted mx-1">&bull;</span>
          <span>HR: {row.latestVitals?.pulse || '72'}</span>
        </div>
      ),
    },
    {
      header: 'Conditions / Diagnosis',
      key: 'chronicConditions',
      render: (row) => (
        <span className="text-xs text-brandText-main truncate max-w-[200px] block">
          {row.chronicConditions || 'General Health'}
        </span>
      ),
    },
    {
      header: 'Total Consultations',
      key: 'visits',
      align: 'right',
      render: (row) => <span className="font-bold text-xs text-forest-900">{row.visits || 1} Visits</span>,
    },
    {
      header: 'Last Consulted',
      key: 'lastVisit',
      render: (row) => <span className="text-xs text-brandText-muted">{row.lastVisit || 'Today'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Patient Clinical EHR Records
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            EHR consultation histories, blood group logs, recorded vital signs, and past e-prescriptions.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={Plus}
          onClick={() => setShowAddModal(true)}
          className="text-xs font-bold shadow-sm"
        >
          Add Patient Record
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search patients by name or phone..."
        onRowClick={(row) => setSelectedPatient(row)}
      />

      {/* Patient Detailed EHR Drawer */}
      <Drawer
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        title={`Patient Record: ${selectedPatient?.name}`}
        subtitle={`${selectedPatient?.gender}, ${selectedPatient?.age} yrs • Blood Group: ${selectedPatient?.bloodGroup || 'O+'}`}
      >
        {selectedPatient && (
          <div className="space-y-5 text-xs">
            {/* Vitals Snapshot */}
            <div className="p-3.5 bg-surface-warm rounded-2xl border border-brandBorder-subtle space-y-2">
              <p className="font-bold text-forest-900 text-xs flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Latest Recorded Vitals</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-surface-pure rounded-xl border border-brandBorder-subtle">
                  <p className="text-[10px] text-brandText-muted">BP</p>
                  <p className="font-bold text-sm text-forest-900">{selectedPatient.latestVitals?.bp || '120/80'}</p>
                </div>
                <div className="p-2 bg-surface-pure rounded-xl border border-brandBorder-subtle">
                  <p className="text-[10px] text-brandText-muted">Pulse</p>
                  <p className="font-bold text-sm text-forest-900">{selectedPatient.latestVitals?.pulse || '74'} bpm</p>
                </div>
                <div className="p-2 bg-surface-pure rounded-xl border border-brandBorder-subtle">
                  <p className="text-[10px] text-brandText-muted">Temp</p>
                  <p className="font-bold text-sm text-forest-900">{selectedPatient.latestVitals?.temp || '98.4'} °F</p>
                </div>
                <div className="p-2 bg-surface-pure rounded-xl border border-brandBorder-subtle">
                  <p className="text-[10px] text-brandText-muted">Weight</p>
                  <p className="font-bold text-sm text-forest-900">{selectedPatient.latestVitals?.weight || '68'} kg</p>
                </div>
              </div>
            </div>

            {/* Chronic Conditions & Allergies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-forest-50/70 rounded-xl border border-forest-100 space-y-1">
                <p className="font-bold text-forest-900">Chronic Profile:</p>
                <p className="text-forest-800">{selectedPatient.chronicConditions || 'None reported'}</p>
              </div>
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 space-y-1">
                <p className="font-bold text-rose-900">Known Allergies:</p>
                <p className="text-rose-800">{selectedPatient.allergies || 'None reported'}</p>
              </div>
            </div>

            {/* Visit & E-Prescription History */}
            <div className="space-y-3">
              <p className="font-bold text-forest-900 text-sm">Consultation & E-Rx Timeline:</p>

              {(!selectedPatient.history || selectedPatient.history.length === 0) ? (
                <p className="text-brandText-secondary italic">No past consultation records logged yet.</p>
              ) : (
                selectedPatient.history.map((hist, idx) => (
                  <div
                    key={hist.id || idx}
                    className="p-3.5 rounded-2xl border border-brandBorder-subtle bg-surface-pure space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-forest-900">
                        <Calendar className="w-3.5 h-3.5 text-forest-600" />
                        <span>Visit Date: {hist.date}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Completed
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-brandText-secondary">
                        <strong className="text-forest-800">Doctor / Clinic:</strong> {hist.doctorName} &bull; {hist.clinicName}
                      </p>
                      <p className="text-brandText-secondary">
                        <strong className="text-forest-800">Complaints:</strong> {hist.symptoms}
                      </p>
                      <p className="text-brandText-secondary">
                        <strong className="text-forest-800">Diagnosis:</strong> {hist.diagnosis}
                      </p>
                    </div>

                    {hist.prescription?.medicines?.length > 0 && (
                      <div className="pt-2 border-t border-brandBorder-subtle space-y-1">
                        <p className="font-bold text-forest-900">Prescription:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-brandText-main">
                          {hist.prescription.medicines.map((m, mIdx) => (
                            <li key={mIdx}>
                              <strong>{m.name}</strong> &mdash; {m.dosage} ({m.duration})
                            </li>
                          ))}
                        </ul>
                        {hist.prescription.advice && (
                          <p className="text-[11px] text-forest-700 italic pt-0.5">
                            Advice: {hist.prescription.advice}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Manual Patient Record Adding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-forest-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-floating max-w-lg w-full p-6 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-3">
              <h3 className="font-heading font-extrabold text-lg text-forest-900">
                Add Patient Health Record
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-brandText-muted hover:text-forest-900 hover:bg-surface-warm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-forest-800">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sourav Mukherjee"
                  className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-forest-800">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98301 22334"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-medium focus:outline-none focus:border-forest-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-800">Blood Group</label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl font-bold text-rose-700 focus:outline-none focus:border-forest-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-forest-800">Age</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="35"
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-forest-800">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Vitals row */}
              <div className="grid grid-cols-4 gap-2 bg-surface-warm p-2.5 rounded-xl border border-brandBorder-subtle">
                <div>
                  <label className="text-[10px] font-bold text-forest-800">BP</label>
                  <input
                    type="text"
                    value={form.bp}
                    onChange={(e) => setForm({ ...form, bp: e.target.value })}
                    placeholder="120/80"
                    className="w-full mt-0.5 px-2 py-1 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-forest-800">Pulse</label>
                  <input
                    type="text"
                    value={form.pulse}
                    onChange={(e) => setForm({ ...form, pulse: e.target.value })}
                    placeholder="72"
                    className="w-full mt-0.5 px-2 py-1 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-forest-800">Temp</label>
                  <input
                    type="text"
                    value={form.temp}
                    onChange={(e) => setForm({ ...form, temp: e.target.value })}
                    placeholder="98.4"
                    className="w-full mt-0.5 px-2 py-1 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-forest-800">Weight</label>
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="68"
                    className="w-full mt-0.5 px-2 py-1 bg-surface-pure border border-brandBorder-subtle rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-forest-800">Diagnosis / Clinical Notes</label>
                <input
                  type="text"
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  placeholder="e.g. Type 2 Diabetes follow-up"
                  className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-forest-800">Prescription Medicines (comma separated)</label>
                <input
                  type="text"
                  value={form.medicines}
                  onChange={(e) => setForm({ ...form, medicines: e.target.value })}
                  placeholder="e.g. Metformin 500mg, Atorvastatin 10mg"
                  className="w-full mt-1 px-3 py-2 bg-surface-warm border border-brandBorder-subtle rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brandBorder-subtle">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={Save}
                  className="font-bold shadow-md"
                >
                  Save Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatientsPage;
