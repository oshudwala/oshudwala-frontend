import React from 'react';
import { Stethoscope, Building2, Clock, Phone, AlertCircle } from 'lucide-react';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';

export const ReceptionistDoctorsPage = () => {
  const { tokens } = useWorkspaceStore();
  const servingToken = tokens.find((t) => t.status === 'SERVING');

  const doctors = [
    {
      id: 'doc-01',
      name: 'Dr. Priya Sharma',
      specialty: 'General Medicine & Diabetology',
      room: 'Room 204 (2nd Floor)',
      status: 'CONSULTING',
      currentServing: servingToken ? `Token #${servingToken.tokenNumber}` : 'Chamber Free',
      patientsWaiting: tokens.filter((t) => t.status === 'WAITING').length,
      shift: '09:30 AM – 01:30 PM',
      phoneExt: 'Ext 204',
    },
    {
      id: 'doc-02',
      name: 'Dr. Rohit Mehta',
      specialty: 'Cardiology',
      room: 'Room 206 (2nd Floor)',
      status: 'CONSULTING',
      currentServing: 'Token #08',
      patientsWaiting: 2,
      shift: '10:00 AM – 02:00 PM',
      phoneExt: 'Ext 206',
    },
    {
      id: 'doc-03',
      name: 'Dr. Sneha Das',
      specialty: 'Dermatology & Cosmetology',
      room: 'Room 208 (2nd Floor)',
      status: 'ON_BREAK',
      currentServing: 'Resumes 11:30 AM',
      patientsWaiting: 3,
      shift: '10:30 AM – 01:30 PM',
      phoneExt: 'Ext 208',
    },
    {
      id: 'doc-04',
      name: 'Dr. Amit Verma',
      specialty: 'Pediatrics',
      room: 'Room 210 (2nd Floor)',
      status: 'AVAILABLE',
      currentServing: 'Ready for Patient',
      patientsWaiting: 0,
      shift: '11:00 AM – 03:00 PM',
      phoneExt: 'Ext 210',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Clinic Doctor Roster & Chamber Availability
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Real-time room occupancy, live consulting tokens, and intercom extensions at Apollo Clinic Salt Lake.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {doctors.map((doc) => (
          <div
            key={doc.id}
            className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card p-6 space-y-4 hover:border-forest-300 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading font-extrabold text-base text-forest-900">{doc.name}</h3>
                <p className="text-xs text-forest-700 font-semibold">{doc.specialty}</p>
                <p className="text-[11px] text-brandText-secondary mt-0.5">{doc.room} &bull; {doc.phoneExt}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  doc.status === 'CONSULTING'
                    ? 'bg-emerald-100 text-emerald-800'
                    : doc.status === 'ON_BREAK'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {doc.status.replace('_', ' ')}
              </span>
            </div>

            <div className="p-3.5 bg-surface-warm rounded-2xl border border-brandBorder-subtle flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] text-brandText-muted uppercase">Now In Chamber</p>
                <p className="font-mono font-extrabold text-forest-900 text-sm mt-0.5">
                  {doc.currentServing}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-brandText-muted uppercase">Lobby Waiting</p>
                <p className="font-bold text-forest-900 text-sm mt-0.5">
                  {doc.patientsWaiting} Patients
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-brandText-secondary">
              <span>Shift: <strong>{doc.shift}</strong></span>
              <span className="text-emerald-700 font-bold">On Schedule</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReceptionistDoctorsPage;
