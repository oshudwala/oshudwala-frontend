import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, Search, Filter, Play, Check } from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';
import { clinicApi } from '../../services/api/clinic.api';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const DoctorAppointmentsPage = () => {
  const { user } = useAuth();
  const { callNextToken, tokens } = useWorkspaceStore();
  const { addToast } = useToast();

  const doctorId = user?.id || 'default';
  const doctorName = user?.fullName || user?.name || 'Dr. Priya Sharma';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const allAppts = await clinicApi.getClinicAppointments('default');
      // Relevant to this doctor or general chamber appointments
      const forDoctor = allAppts.filter(
        (a) =>
          !a.doctorId ||
          a.doctorId === doctorId ||
          a.doctorId === 'doc-01' ||
          (a.doctor && doctorName && a.doctor.toLowerCase().includes(doctorName.toLowerCase())) ||
          (a.doctorName && doctorName && a.doctorName.toLowerCase().includes(doctorName.toLowerCase()))
      );
      setAppointments(forDoctor.length > 0 ? forDoctor : allAppts);
    } catch (e) {
      console.warn('Error loading appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    const handleUpdate = () => loadAppointments();
    window.addEventListener('oshud_clinic_appointments_updated', handleUpdate);
    return () => {
      window.removeEventListener('oshud_clinic_appointments_updated', handleUpdate);
    };
  }, [user]);

  const handleCallPatient = (appt) => {
    callNextToken(doctorId);
    addToast(`Called ${appt.patientName} (${appt.slot || 'Chamber Slot'}) to chamber!`, 'success');
  };

  const handleUpdateStatus = (apptId, nextStatus) => {
    const updated = appointments.map((a) => (a.id === apptId ? { ...a, status: nextStatus } : a));
    setAppointments(updated);
    addToast(`Appointment ${apptId} marked as ${nextStatus}!`, 'info');
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  const columns = [
    {
      header: 'Appt ID',
      key: 'id',
      render: (row) => <span className="font-mono font-bold text-xs text-forest-800">{row.id}</span>,
    },
    {
      header: 'Time Slot',
      key: 'slot',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-forest-900">
          <Clock className="w-3.5 h-3.5 text-forest-600" />
          <span>{row.slot || row.time || '10:30 AM'}</span>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      key: 'patientName',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.patientName}</p>
          <p className="text-[11px] text-brandText-secondary">
            {row.gender || 'Patient'}, {row.age || 35} yrs &bull; {row.phone}
          </p>
        </div>
      ),
    },
    {
      header: 'Chamber Room',
      key: 'room',
      render: (row) => (
        <span className="text-xs text-brandText-secondary font-medium">
          {row.room || 'Room 204 (2nd Floor)'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.status !== 'COMPLETED' && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={Play}
              onClick={(e) => {
                e.stopPropagation();
                handleCallPatient(row);
              }}
              className="text-[10px] font-bold py-1 px-2.5 text-forest-800 hover:bg-forest-50"
            >
              Call In
            </Button>
          )}
          {row.status !== 'COMPLETED' ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateStatus(row.id, 'COMPLETED');
              }}
              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold"
              title="Mark Completed"
            >
              <Check className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[11px] text-brandText-muted italic">Finished</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            Booked Consultations Schedule
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Confirmed patient appointments for today across affiliated clinics and chambers.
          </p>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 bg-surface-warm p-1 rounded-xl border border-brandBorder-subtle text-xs">
          {['ALL', 'SERVING', 'SCHEDULED', 'COMPLETED'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterStatus === status
                  ? 'bg-forest-800 text-white shadow-sm'
                  : 'text-brandText-secondary hover:text-forest-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredAppointments}
        searchKey="patientName"
        searchPlaceholder="Search patient by name or phone..."
      />
    </div>
  );
};

export default DoctorAppointmentsPage;
