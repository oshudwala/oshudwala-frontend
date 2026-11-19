import React, { useState } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, Search, Filter } from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';

export const DoctorAppointmentsPage = () => {
  const appointments = [
    { id: 'APT-1001', patientName: 'Subhasis Deb', phone: '+91 98301 77889', age: 48, gender: 'Male', time: '10:30 AM - 10:45 AM', type: 'IN_CLINIC', clinic: 'Apollo Clinic Salt Lake', status: 'COMPLETED' },
    { id: 'APT-1002', patientName: 'Debarati Ganguly', phone: '+91 98312 99001', age: 32, gender: 'Female', time: '10:45 AM - 11:00 AM', type: 'IN_CLINIC', clinic: 'Apollo Clinic Salt Lake', status: 'SERVING' },
    { id: 'APT-1003', patientName: 'Priyanka Roy', phone: '+91 94321 00987', age: 27, gender: 'Female', time: '11:00 AM - 11:15 AM', type: 'IN_CLINIC', clinic: 'Apollo Clinic Salt Lake', status: 'WAITING' },
    { id: 'APT-1004', patientName: 'Dr. Indranil Bose', phone: '+91 98305 11992', age: 52, gender: 'Male', time: '11:30 AM - 11:45 AM', type: 'VIDEO_CONSULT', clinic: 'Tele-Consultation Portal', status: 'WAITING' },
    { id: 'APT-1005', patientName: 'Madhumita Das', phone: '+91 98318 66771', age: 41, gender: 'Female', time: '11:45 AM - 12:00 PM', type: 'IN_CLINIC', clinic: 'Apollo Clinic Salt Lake', status: 'WAITING' },
  ];

  const columns = [
    {
      header: 'Appt ID',
      key: 'id',
      render: (row) => <span className="font-mono font-bold text-xs text-forest-800">{row.id}</span>,
    },
    {
      header: 'Time Slot',
      key: 'time',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-forest-900">
          <Clock className="w-3.5 h-3.5 text-forest-600" />
          <span>{row.time}</span>
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
      header: 'Consultation Mode',
      key: 'type',
      render: (row) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-50 text-forest-800 border border-forest-100">
          {row.type === 'VIDEO_CONSULT' ? '📹 Video Consult' : '🏥 In-Clinic'}
        </span>
      ),
    },
    {
      header: 'Clinic Chamber',
      key: 'clinic',
      render: (row) => <span className="text-xs text-brandText-secondary">{row.clinic}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Booked Appointments Schedule
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Confirmed patient appointments scheduled for today at Apollo Clinic & Tele-Consults.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={appointments}
        searchKey="patientName"
        searchPlaceholder="Search patient by name or phone..."
      />
    </div>
  );
};

export default DoctorAppointmentsPage;
