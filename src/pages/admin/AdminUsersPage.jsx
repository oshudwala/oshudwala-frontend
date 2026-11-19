import React, { useState } from 'react';
import { Users, UserPlus, Shield, Stethoscope, Building2, Bike, UserCheck, Search, Filter } from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

const initialUsersList = [
  { id: 'usr-001', name: 'Rajiv Sen', email: 'rajiv.sen@oshudwala.in', phone: '+91 98301 22334', role: 'SUPER_ADMIN', status: 'ACTIVE', location: 'Kolkata HQ' },
  { id: 'usr-002', name: 'Dr. Priya Sharma', email: 'dr.priya@oshudwala.in', phone: '+91 98302 33445', role: 'DOCTOR', status: 'ACTIVE', location: 'Salt Lake Kolkata' },
  { id: 'usr-003', name: 'Dr. Rohit Mehta', email: 'dr.rohit@oshudwala.in', phone: '+91 98302 99881', role: 'DOCTOR', status: 'ACTIVE', location: 'Park Circus Kolkata' },
  { id: 'usr-004', name: 'Subhash Bose', email: 'medplus.sector5@oshudwala.in', phone: '+91 98303 44556', role: 'PHARMACY', status: 'ACTIVE', location: 'Sector V, Salt Lake' },
  { id: 'usr-005', name: 'Rahul Das', email: 'rahul.rider@oshudwala.in', phone: '+91 98304 55667', role: 'RIDER', status: 'ACTIVE', location: 'Kolkata South Zone' },
  { id: 'usr-006', name: 'Ananya Roy', email: 'ananya.desk@apollo.oshudwala.in', phone: '+91 98305 66778', role: 'RECEPTIONIST', status: 'ACTIVE', location: 'Apollo Clinic Salt Lake' },
  { id: 'usr-007', name: 'Ayon Paul', email: 'ayon.paul@example.com', phone: '+91 98300 11223', role: 'PATIENT', status: 'ACTIVE', location: 'New Town, Kolkata' },
];

export const AdminUsersPage = () => {
  const [users, setUsers] = useState(initialUsersList);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'DOCTOR', location: 'Kolkata' });
  const { addToast } = useToast();

  const filterOptions = [
    { label: 'Super Admins', value: 'SUPER_ADMIN' },
    { label: 'Doctors', value: 'DOCTOR' },
    { label: 'Pharmacies', value: 'PHARMACY' },
    { label: 'Riders', value: 'RIDER' },
    { label: 'Receptionists', value: 'RECEPTIONIST' },
    { label: 'Patients', value: 'PATIENT' },
  ];

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const newUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: formData.name,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '')}@oshudwala.in`,
      phone: formData.phone,
      role: formData.role,
      status: 'ACTIVE',
      location: formData.location,
    };

    setUsers([newUser, ...users]);
    addToast(`Staff account for ${newUser.name} created successfully!`, 'success');
    setIsAddModalOpen(false);
    setFormData({ name: '', email: '', phone: '', role: 'DOCTOR', location: 'Kolkata' });
  };

  const columns = [
    {
      header: 'Full Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Phone Number',
      key: 'phone',
      render: (row) => <span className="font-mono text-xs">{row.phone}</span>,
    },
    {
      header: 'System Role',
      key: 'role',
      render: (row) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-forest-100 text-forest-800 uppercase tracking-wider">
          {row.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Operating Location',
      key: 'location',
      render: (row) => <span className="text-xs text-brandText-secondary">{row.location}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-forest-900">
            User & Role Management
          </h1>
          <p className="text-xs text-brandText-secondary mt-0.5">
            Manage authenticated users, staff roles, permissions and platform accounts.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={UserPlus}
          onClick={() => setIsAddModalOpen(true)}
          className="text-xs font-bold"
        >
          Add Staff / Provider
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Search users by name, phone or email..."
        filterOptions={filterOptions}
        filterKey="role"
      />

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative bg-surface-pure rounded-3xl max-w-md w-full p-6 shadow-floating border border-brandBorder-subtle z-10 space-y-4">
            <h3 className="font-heading font-bold text-lg text-forest-900">
              Provision New Platform User
            </h3>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-forest-800">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Subrata Sen"
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Phone Number</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98300 00000"
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Assign Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs bg-surface-warm focus:outline-none focus:border-forest-500"
                >
                  <option value="DOCTOR">Doctor</option>
                  <option value="PHARMACY">Pharmacist / Pharmacy</option>
                  <option value="RIDER">Delivery Rider</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-forest-800">Operating City / Branch</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Kolkata (Salt Lake)"
                  className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs bg-surface-warm focus:outline-none focus:border-forest-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="text-xs">
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
