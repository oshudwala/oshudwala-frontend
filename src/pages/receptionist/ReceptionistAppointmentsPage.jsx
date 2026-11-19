import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, Search, UserCheck } from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const ReceptionistAppointmentsPage = () => {
  const { generateToken } = useWorkspaceStore();
  const { addToast } = useToast();

  const [appointments, setAppointments] = useState([
    { id: 'APT-1001', patientName: 'Subhasis Deb', phone: '+91 98301 77889', age: 48, gender: 'Male', doctor: 'Dr. Priya Sharma (Room 204)', slot: '10:30 AM', checkedIn: true },
    { id: 'APT-1002', patientName: 'Debarati Ganguly', phone: '+91 98312 99001', age: 32, gender: 'Female', doctor: 'Dr. Priya Sharma (Room 204)', slot: '10:45 AM', checkedIn: true },
    { id: 'APT-1003', patientName: 'Priyanka Roy', phone: '+91 94321 00987', age: 27, gender: 'Female', doctor: 'Dr. Priya Sharma (Room 204)', slot: '11:00 AM', checkedIn: false },
    { id: 'APT-1004', patientName: 'Kunal Mukherjee', phone: '+91 98308 22119', age: 39, gender: 'Male', doctor: 'Dr. Rohit Mehta (Room 206)', slot: '11:15 AM', checkedIn: false },
    { id: 'APT-1005', patientName: 'Soma Chakraborty', phone: '+91 94331 88776', age: 51, gender: 'Female', doctor: 'Dr. Sneha Das (Room 208)', slot: '11:30 AM', checkedIn: false },
  ]);

  const handleCheckIn = (apt) => {
    generateToken({
      patientName: apt.patientName,
      patientPhone: apt.phone,
      age: apt.age,
      gender: apt.gender,
      symptoms: 'Scheduled OPD Consultation',
      type: 'APPOINTMENT',
    });

    setAppointments(
      appointments.map((a) => (a.id === apt.id ? { ...a, checkedIn: true } : a))
    );

    addToast(`Checked in ${apt.patientName} into live queue!`, 'success');
  };

  const columns = [
    {
      header: 'Appt Ref',
      key: 'id',
      render: (row) => <span className="font-mono font-bold text-xs text-forest-800">{row.id}</span>,
    },
    {
      header: 'Scheduled Slot',
      key: 'slot',
      render: (row) => (
        <div className="flex items-center gap-1.5 font-bold text-xs text-forest-900">
          <Clock className="w-3.5 h-3.5 text-forest-600" />
          <span>{row.slot}</span>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      key: 'patientName',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.patientName}</p>
          <p className="text-[11px] text-brandText-secondary">{row.gender}, {row.age} yrs &bull; {row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Consulting Doctor & Room',
      key: 'doctor',
      render: (row) => <span className="text-xs text-forest-800 font-medium">{row.doctor}</span>,
    },
    {
      header: 'Desk Action',
      key: 'action',
      align: 'right',
      render: (row) =>
        row.checkedIn ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Checked-in to Queue
          </span>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleCheckIn(row)}
            className="text-xs py-1"
          >
            Check-in Patient
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Pre-booked Appointment Check-in
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Mark patient arrival to generate and push token ticket into active doctor consultation queue.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={appointments}
        searchKey="patientName"
        searchPlaceholder="Search booked patient by name or phone..."
      />
    </div>
  );
};

export default ReceptionistAppointmentsPage;
