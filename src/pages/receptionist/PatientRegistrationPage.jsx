import React, { useState } from 'react';
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
} from 'lucide-react';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const PatientRegistrationPage = () => {
  const { generateToken } = useWorkspaceStore();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    age: '',
    gender: 'Male',
    doctor: 'Dr. Priya Sharma (General Medicine - Room 204)',
    symptoms: '',
  });

  const [generatedTicket, setGeneratedTicket] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.patientPhone) return;

    const token = generateToken({
      patientName: formData.patientName.trim(),
      patientPhone: formData.patientPhone.trim(),
      age: formData.age,
      gender: formData.gender,
      symptoms: formData.symptoms || 'General Checkup',
      type: 'WALK_IN',
    });

    setGeneratedTicket(token);
    addToast(`Token #${token.tokenNumber} successfully issued for ${token.patientName}!`, 'success');
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
      doctor: 'Dr. Priya Sharma (General Medicine - Room 204)',
      symptoms: '',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Walk-in Patient Desk & Token Generation
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Issue immediate queue tokens for walk-in arrivals at Apollo Clinic Salt Lake Kolkata.
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
                Auto-generates queue ticket and transmits vitals to doctor's screen
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="text-xs font-bold text-forest-800">Consulting Doctor</label>
              <select
                value={formData.doctor}
                onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
              >
                <option value="Dr. Priya Sharma (General Medicine - Room 204)">
                  Dr. Priya Sharma (General Medicine &bull; Room 204)
                </option>
                <option value="Dr. Rohit Mehta (Cardiology - Room 206)">
                  Dr. Rohit Mehta (Cardiology &bull; Room 206)
                </option>
                <option value="Dr. Sneha Das (Dermatology - Room 208)">
                  Dr. Sneha Das (Dermatology &bull; Room 208)
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-forest-800">
                Chief Symptoms & Health Complaints
              </label>
              <textarea
                rows={2}
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="e.g. Mild headache, throat irritation for 2 days..."
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
                  Apollo Clinic Salt Lake
                </p>
                <p className="text-[10px] text-brandText-muted">
                  OPD Queue Ticket &bull; Kolkata
                </p>
              </div>

              <div className="py-2">
                <p className="text-[11px] font-bold text-forest-800 uppercase tracking-widest">
                  YOUR TOKEN NUMBER
                </p>
                <span className="font-mono font-black text-6xl text-forest-900 tracking-tight block mt-1">
                  #{generatedTicket.tokenNumber}
                </span>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800 mt-1 uppercase">
                  Walk-in Token
                </span>
              </div>

              <div className="bg-surface-warm p-3.5 rounded-2xl border border-brandBorder-subtle text-xs text-left space-y-1">
                <p className="font-bold text-forest-900">{generatedTicket.patientName}</p>
                <p className="text-brandText-secondary">
                  {generatedTicket.gender}, {generatedTicket.age} yrs &bull; {generatedTicket.patientPhone}
                </p>
                <p className="text-forest-700 font-semibold pt-1">
                  Chamber: {generatedTicket.room} (Dr. Priya Sharma)
                </p>
                <p className="text-[10px] text-brandText-muted">
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
                Submit the patient form on the left to instantly issue and print a thermal token slip for the patient.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientRegistrationPage;
