import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  User,
  Calendar,
  Building2,
  ExternalLink,
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Drawer from '../../components/workspace/Drawer';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export const AdminPrescriptionsPage = () => {
  const { prescriptions, verifyPrescription, rejectPrescription } = useWorkspaceStore();
  const { addToast } = useToast();
  const [selectedRx, setSelectedRx] = useState(null);

  const filterOptions = [
    { label: 'Pending Audit', value: 'PENDING_VERIFICATION' },
    { label: 'Verified', value: 'VERIFIED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  const handleVerify = (rxId) => {
    verifyPrescription(rxId);
    addToast(`Prescription ${rxId} verified successfully`, 'success');
    setSelectedRx(null);
  };

  const handleReject = (rxId) => {
    rejectPrescription(rxId, 'Invalid prescription format or doctor credentials.');
    addToast(`Prescription ${rxId} rejected`, 'error');
    setSelectedRx(null);
  };

  const columns = [
    {
      header: 'Rx ID',
      key: 'id',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-forest-800">{row.id}</span>
          <p className="text-[10px] text-brandText-muted">{row.submittedAt}</p>
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
            {row.patientGender}, {row.patientAge} yrs &bull; {row.patientPhone}
          </p>
        </div>
      ),
    },
    {
      header: 'Prescription Document',
      key: 'imageUrl',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt="Rx"
              className="w-10 h-10 rounded-xl object-cover border border-brandBorder-subtle shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center font-bold text-xs">
              Rx
            </div>
          )}
          <span className="text-xs font-semibold text-forest-800">Uploaded Document</span>
        </div>
      ),
    },
    {
      header: 'Audit Notes',
      key: 'notes',
      render: (row) => (
        <span className="text-xs text-brandText-secondary line-clamp-1 max-w-xs">
          {row.notes || 'Pending CDSCO schedule compliance verification'}
        </span>
      ),
    },
    {
      header: 'Audit Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Prescription Verification & Compliance
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          CDSCO & Drugs and Cosmetics Act Schedule H/H1 digital verification log.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={prescriptions}
        searchKey="patientName"
        searchPlaceholder="Search by patient name, Rx ID..."
        filterOptions={filterOptions}
        filterKey="status"
        onRowClick={(row) => setSelectedRx(row)}
      />

      {/* Prescription Audit Drawer */}
      <Drawer
        isOpen={Boolean(selectedRx)}
        onClose={() => setSelectedRx(null)}
        title={`Prescription Review: ${selectedRx?.id}`}
        subtitle={`Patient: ${selectedRx?.patientName}`}
        footer={
          selectedRx?.status === 'PENDING_VERIFICATION' && (
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleReject(selectedRx.id)}
                className="text-xs"
              >
                Reject Prescription
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleVerify(selectedRx.id)}
                className="text-xs px-5"
              >
                Approve & Mark Verified
              </Button>
            </div>
          )
        }
      >
        {selectedRx && (
          <div className="space-y-5">
            {/* Image Preview */}
            <div className="rounded-2xl overflow-hidden border border-brandBorder-subtle bg-slate-900 shadow-inner max-h-72 flex items-center justify-center">
              <img
                src={selectedRx.imageUrl}
                alt="Prescription Document"
                className="w-full object-contain max-h-72"
              />
            </div>

            {/* Patient & Prescription Details */}
            <div className="p-3.5 rounded-xl bg-forest-50/60 border border-forest-100 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-forest-900">{selectedRx.patientName}</span>
                <span className="text-[10px] font-bold text-forest-700 bg-forest-100 px-2 py-0.5 rounded-full">
                  {selectedRx.patientGender}, {selectedRx.patientAge} years
                </span>
              </div>
              <p className="text-brandText-secondary">Contact: {selectedRx.patientPhone}</p>
              <p className="text-[11px] text-brandText-muted">Submitted: {selectedRx.submittedAt || selectedRx.rxDate}</p>
            </div>

            {/* Compliance Notes */}
            <div className="p-3 bg-surface-warm rounded-xl border border-brandBorder-subtle text-xs">
              <p className="font-bold text-forest-900">Compliance & Audit Notes:</p>
              <p className="text-brandText-secondary mt-0.5">{selectedRx.notes || 'Prescription uploaded for pharmacist dispensation audit.'}</p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AdminPrescriptionsPage;
