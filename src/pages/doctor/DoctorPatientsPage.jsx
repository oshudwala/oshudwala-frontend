import React, { useState } from 'react';
import { Users, FileText, Heart, Clock, Search, ExternalLink } from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import Drawer from '../../components/workspace/Drawer';

export const DoctorPatientsPage = () => {
  const [selectedPatient, setSelectedPatient] = useState(null);

  const patients = [
    { id: 'PAT-901', name: 'Subhasis Deb', phone: '+91 98301 77889', age: 48, gender: 'Male', bloodGroup: 'O+', visits: 4, lastVisit: '19 Nov 2026', chronicConditions: 'Hypertension, Allergic Bronchitis' },
    { id: 'PAT-902', name: 'Debarati Ganguly', phone: '+91 98312 99001', age: 32, gender: 'Female', bloodGroup: 'B+', visits: 2, lastVisit: '19 Nov 2026', chronicConditions: 'Migraine' },
    { id: 'PAT-903', name: 'Monojit Ghosh', phone: '+91 98366 11234', age: 55, gender: 'Male', bloodGroup: 'A+', visits: 6, lastVisit: '19 Nov 2026', chronicConditions: 'Type 2 Diabetes, High BP' },
    { id: 'PAT-904', name: 'Alok Nath Mukherjee', phone: '+91 98300 44556', age: 63, gender: 'Male', bloodGroup: 'AB+', visits: 8, lastVisit: '18 Nov 2026', chronicConditions: 'Diabetic Nephropathy, Dyslipidemia' },
  ];

  const columns = [
    {
      header: 'Patient Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary">{row.gender}, {row.age} yrs &bull; {row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Blood Group',
      key: 'bloodGroup',
      render: (row) => (
        <span className="font-bold text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
          {row.bloodGroup}
        </span>
      ),
    },
    {
      header: 'Known Conditions',
      key: 'chronicConditions',
      render: (row) => <span className="text-xs text-forest-800">{row.chronicConditions}</span>,
    },
    {
      header: 'Total Visits',
      key: 'visits',
      align: 'right',
      render: (row) => <span className="font-bold text-xs">{row.visits} Consultations</span>,
    },
    {
      header: 'Last Consulted',
      key: 'lastVisit',
      render: (row) => <span className="text-xs text-brandText-muted">{row.lastVisit}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Patient Clinical Records
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          EHR consultation history, clinical vitals logs, and issued e-prescriptions.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        searchKey="name"
        searchPlaceholder="Search patients by name or phone..."
        onRowClick={(row) => setSelectedPatient(row)}
      />

      <Drawer
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        title={`Patient Record: ${selectedPatient?.name}`}
        subtitle={`${selectedPatient?.gender}, ${selectedPatient?.age} yrs &bull; Blood Group: ${selectedPatient?.bloodGroup}`}
      >
        {selectedPatient && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-forest-50 rounded-xl border border-forest-100 space-y-1">
              <p className="font-bold text-forest-900">Chronic Medical Profile:</p>
              <p className="text-forest-800">{selectedPatient.chronicConditions}</p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-forest-900">Recent Prescription History:</p>
              <div className="p-3 rounded-xl border border-brandBorder-subtle bg-surface-pure space-y-1.5">
                <div className="flex justify-between font-bold text-forest-800">
                  <span>Visit on {selectedPatient.lastVisit}</span>
                  <span className="text-emerald-700">Completed</span>
                </div>
                <p className="text-brandText-secondary">
                  Prescribed: Augmentin 625 Duo, Pan 40, Dolo 650.
                </p>
                <p className="text-[11px] text-brandText-muted">Advice: Repeat fasting labs in 14 days.</p>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DoctorPatientsPage;
