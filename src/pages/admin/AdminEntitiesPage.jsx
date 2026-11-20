import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Stethoscope,
  Building2,
  Activity,
  Bike,
  Users,
  Plus,
  Trash2,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  FileText,
  Star,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Search,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import adminApi from '../../services/api/admin.api';

export const AdminEntitiesPage = ({ initialTab = 'clinics' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  // Tab: 'clinics' | 'doctors' | 'pharmacies' | 'riders' | 'users'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data states
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [riders, setRiders] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form inputs for Add Entity
  const [formData, setFormData] = useState({
    // Common
    fullName: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700064',
    // Doctor specific
    registrationNumber: '',
    qualifications: '',
    experienceYears: '5',
    specialization: 'General Physician',
    consultationFee: '500',
    clinicName: '',
    // Pharmacy specific
    ownerName: '',
    licenseNumber: '',
    // Clinic specific
    managerName: '',
    chamberCount: '6 Chambers',
    // Rider specific
    vehicleType: 'Motorcycle',
    vehicleNumber: '',
    licenseNo: '',
  });

  // Sync tab with route if path changes
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (['clinics', 'doctors', 'pharmacies', 'riders', 'users'].includes(path)) {
      setActiveTab(path);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [location.pathname, initialTab]);

  // Load real data from backend
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clinicsRes, doctorsRes, pharmaciesRes, ridersRes, usersRes] = await Promise.all([
        adminApi.getClinics(),
        adminApi.getDoctors(),
        adminApi.getPharmacies(),
        adminApi.getRiders(),
        adminApi.getUsers({ roleName: 'PATIENT' }),
      ]);

      setClinics(clinicsRes.clinics || []);
      setDoctors(doctorsRes.doctors || []);
      setPharmacies(pharmaciesRes.pharmacies || []);
      setRiders(ridersRes.riders || []);
      setUsers(usersRes.users || []);
    } catch (err) {
      console.error('Error fetching admin entities:', err);
      addToast('Notice: Could not load some network entities from server.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/admin/${tab}`);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Add Entity
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeTab === 'doctors') {
        const payload = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone.replace(/[^0-9]/g, ''),
          password: formData.password,
          registrationNumber: formData.registrationNumber,
          qualifications: formData.qualifications,
          experienceYears: Number(formData.experienceYears) || 0,
          specialization: formData.specialization,
          consultationFeePaise: (Number(formData.consultationFee) || 500) * 100,
          clinicName: formData.clinicName,
        };
        const created = await adminApi.createDoctor(payload);
        setDoctors((prev) => [created, ...prev]);
        addToast(`Doctor ${created.fullName} registered! Dedicated login profile active.`, 'success');
      } else if (activeTab === 'pharmacies') {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/[^0-9]/g, ''),
          password: formData.password,
          ownerName: formData.ownerName || formData.fullName,
          licenseNumber: formData.licenseNumber,
          line1: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        };
        const created = await adminApi.createPharmacy(payload);
        setPharmacies((prev) => [created, ...prev]);
        addToast(`Pharmacy "${created.name}" and Pharmacist login created successfully!`, 'success');
      } else if (activeTab === 'clinics') {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/[^0-9]/g, ''),
          password: formData.password,
          managerName: formData.managerName || formData.fullName,
          line1: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          chamberCount: formData.chamberCount,
        };
        const created = await adminApi.createClinic(payload);
        setClinics((prev) => [created, ...prev]);
        addToast(`Clinic "${created.name}" and Receptionist login created successfully!`, 'success');
      } else if (activeTab === 'riders') {
        const payload = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone.replace(/[^0-9]/g, ''),
          password: formData.password,
          vehicleType: formData.vehicleType,
          vehicleNumber: formData.vehicleNumber,
          licenseNumber: formData.licenseNo,
          city: formData.city,
        };
        const created = await adminApi.createRider(payload);
        setRiders((prev) => [created, ...prev]);
        addToast(`Rider ${created.user?.fullName || payload.fullName} registered! Login profile active.`, 'success');
      }

      setIsAddModalOpen(false);
      // Reset form
      setFormData({
        fullName: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700064',
        registrationNumber: '',
        qualifications: '',
        experienceYears: '5',
        specialization: 'General Physician',
        consultationFee: '500',
        clinicName: '',
        ownerName: '',
        licenseNumber: '',
        managerName: '',
        chamberCount: '6 Chambers',
        vehicleType: 'Motorcycle',
        vehicleNumber: '',
        licenseNo: '',
      });
      // Refresh real backend data
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to create profile. Please check the entered data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete / Remove Item
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);

    try {
      const { id, userId, type } = itemToDelete;
      const targetUserId = userId || id;

      if (type === 'doctors') {
        await adminApi.deleteDoctor(id, targetUserId);
        setDoctors((prev) =>
          prev.filter((d) => d.id !== id && d.userId !== targetUserId && d.id !== targetUserId)
        );
        addToast('Doctor removed and login access deactivated.', 'success');
      } else if (type === 'pharmacies') {
        await adminApi.deletePharmacy(id, targetUserId);
        setPharmacies((prev) =>
          prev.filter((p) => p.id !== id && p.userId !== targetUserId && p.id !== targetUserId)
        );
        addToast('Pharmacy and owner account removed.', 'success');
      } else if (type === 'clinics') {
        await adminApi.deleteClinic(id, targetUserId);
        setClinics((prev) =>
          prev.filter((c) => c.id !== id && c.userId !== targetUserId && c.id !== targetUserId)
        );
        addToast('Clinic and receptionist account removed.', 'success');
      } else if (type === 'riders') {
        await adminApi.deleteRider(id, targetUserId);
        setRiders((prev) =>
          prev.filter((r) => r.id !== id && r.userId !== targetUserId && r.id !== targetUserId)
        );
        addToast('Rider profile and login access removed.', 'success');
      } else if (type === 'users') {
        await adminApi.deactivateUser(targetUserId);
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUserId ? { ...u, status: 'DEACTIVATED' } : u))
        );
        addToast('Patient account access deactivated.', 'success');
      }

      setItemToDelete(null);
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to remove entity.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= COLUMNS CONFIGURATION =================

  const clinicColumns = [
    {
      header: 'Clinic Name & Chambers',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary">{row.line1 || row.address}, {row.city}</p>
          <span className="inline-block mt-0.5 text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded">
            {row.settings?.chamberCount || row.chamberCount || '6 Chambers'}
          </span>
        </div>
      ),
    },
    {
      header: 'Receptionist / Contact',
      key: 'contact',
      render: (row) => {
        const staff = row.staff?.[0]?.user;
        return (
          <div>
            <p className="text-xs font-semibold text-brandText-main">{staff?.fullName || row.manager?.fullName || 'Front Desk'}</p>
            <p className="text-[11px] text-brandText-secondary">{staff?.email || row.email}</p>
            <p className="text-[10px] text-brandText-muted font-mono">{staff?.phone || row.phone}</p>
          </div>
        );
      },
    },
    {
      header: 'City & Pincode',
      key: 'city',
      render: (row) => <span className="text-xs">{row.city} &bull; {row.pincode}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status || 'ACTIVE'} />,
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() =>
            setItemToDelete({
              id: row.id,
              userId: row.manager?.id || row.userId || row.staff?.[0]?.user?.id || row.id,
              name: row.name,
              type: 'clinics',
            })
          }
          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
          title="Remove Clinic"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const doctorColumns = [
    {
      header: 'Doctor Name & Credentials',
      key: 'fullName',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.fullName}</p>
          <p className="text-[11px] text-forest-700 font-medium">
            {row.specializations?.[0]?.specialization?.name || row.specialization || 'General Physician'}
          </p>
          <p className="text-[10px] text-brandText-muted">
            {row.qualifications || 'MBBS'} &bull; Reg: {row.registrationNumber || 'Verified'}
          </p>
        </div>
      ),
    },
    {
      header: 'Login Email & Phone',
      key: 'email',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-brandText-main">{row.user?.email || row.email}</p>
          <p className="text-[11px] text-brandText-secondary font-mono">{row.user?.phone || row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Experience & Fee',
      key: 'experience',
      render: (row) => (
        <div>
          <span className="text-xs font-bold text-forest-900">{row.experienceYears || 0} yrs exp</span>
          <p className="text-[10px] text-brandText-muted">
            Fee: ₹{((row.consultationFeePaise || 50000) / 100).toFixed(0)}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.user?.status || row.status || 'ACTIVE'} />,
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() =>
            setItemToDelete({
              id: row.id,
              userId: row.userId || row.user?.id || row.id,
              name: row.fullName,
              type: 'doctors',
            })
          }
          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
          title="Remove Doctor"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const pharmacyColumns = [
    {
      header: 'Pharmacy Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-muted">License: {row.licenseNumber || 'Verified'}</p>
          <p className="text-[10px] text-brandText-secondary">{row.line1}, {row.city}</p>
        </div>
      ),
    },
    {
      header: 'Pharmacist In-charge / Login',
      key: 'owner',
      render: (row) => {
        const staff = row.staff?.[0]?.user;
        return (
          <div>
            <p className="text-xs font-semibold text-brandText-main">{staff?.fullName || row.owner?.fullName || 'Pharmacist'}</p>
            <p className="text-[11px] text-brandText-secondary">{staff?.email || row.email}</p>
            <p className="text-[10px] text-brandText-muted font-mono">{staff?.phone || row.phone}</p>
          </div>
        );
      },
    },
    {
      header: 'City & State',
      key: 'city',
      render: (row) => <span className="text-xs">{row.city}, {row.state || 'West Bengal'}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status || 'ACTIVE'} />,
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() =>
            setItemToDelete({
              id: row.id,
              userId: row.owner?.id || row.userId || row.staff?.[0]?.user?.id || row.id,
              name: row.name,
              type: 'pharmacies',
            })
          }
          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
          title="Remove Pharmacy"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const riderColumns = [
    {
      header: 'Rider Name & Vehicle',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.user?.fullName || row.fullName || 'Rider'}</p>
          <p className="text-[11px] text-forest-700 font-medium">
            {row.vehicleType || 'Motorcycle'} &bull; {row.vehicleNumber || 'Reg Pending'}
          </p>
          <p className="text-[10px] text-brandText-muted">DL: {row.licenseNumber || 'Verified'}</p>
        </div>
      ),
    },
    {
      header: 'Login Email & Phone',
      key: 'email',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-brandText-main">{row.user?.email || row.email}</p>
          <p className="text-[11px] text-brandText-secondary font-mono">{row.user?.phone || row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Fleet Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status || 'AVAILABLE'} />,
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() =>
            setItemToDelete({
              id: row.id,
              userId: row.userId || row.user?.id || row.id,
              name: row.user?.fullName || row.fullName || 'Rider',
              type: 'riders',
            })
          }
          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
          title="Remove Rider"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const userColumns = [
    {
      header: 'Patient Name',
      key: 'fullName',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.fullName || 'Patient'}</p>
          <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded uppercase">
            PATIENT
          </span>
        </div>
      ),
    },
    {
      header: 'Registered Phone & Email',
      key: 'contact',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold font-mono text-brandText-main">+91 {row.phone}</p>
          <p className="text-[11px] text-brandText-secondary">{row.email || 'No email registered'}</p>
        </div>
      ),
    },
    {
      header: 'Joined Date',
      key: 'createdAt',
      render: (row) => (
        <span className="text-xs text-brandText-secondary">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : 'Recent'}
        </span>
      ),
    },
    {
      header: 'Account Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status || 'ACTIVE'} />,
    },
    {
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (row) =>
        row.status !== 'DEACTIVATED' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setItemToDelete({
                id: row.id,
                userId: row.id,
                name: row.fullName || row.phone,
                type: 'users',
              })
            }
            className="text-xs py-1 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            Deactivate
          </Button>
        ) : (
          <span className="text-[11px] text-rose-500 font-semibold">Deactivated</span>
        ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Network Operations & Management
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Manage authenticated profiles for Clinics, Doctors, Pharmacists, Riders, and Patients across West Bengal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={isLoading}
            leftIcon={RefreshCw}
            className="text-xs"
          >
            Sync
          </Button>

          {activeTab !== 'users' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs shadow-card font-bold"
            >
              Add {activeTab === 'clinics' ? 'Clinic' : activeTab === 'doctors' ? 'Doctor' : activeTab === 'pharmacies' ? 'Pharmacist' : 'Rider'}
            </Button>
          )}
        </div>
      </div>

      {/* 5 Dedicated Management Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-brandBorder-subtle pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleTabChange('clinics')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'clinics'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Clinics ({clinics.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('doctors')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'doctors'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctors ({doctors.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('pharmacies')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'pharmacies'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Pharmacists ({pharmacies.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('riders')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'riders'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Riders ({riders.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users / Patients ({users.length})</span>
        </button>
      </div>

      {/* Active Tab Table Display */}
      {isLoading ? (
        <div className="p-12 text-center bg-surface-pure rounded-3xl border border-brandBorder-subtle space-y-3">
          <div className="w-8 h-8 border-3 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-brandText-secondary">
            Loading verified {activeTab} from database...
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'clinics' && (
            <DataTable
              columns={clinicColumns}
              data={clinics}
              searchKey="name"
              searchPlaceholder="Search clinic by name, address, or receptionist..."
            />
          )}

          {activeTab === 'doctors' && (
            <DataTable
              columns={doctorColumns}
              data={doctors}
              searchKey="fullName"
              searchPlaceholder="Search doctor by name, qualification, or email..."
            />
          )}

          {activeTab === 'pharmacies' && (
            <DataTable
              columns={pharmacyColumns}
              data={pharmacies}
              searchKey="name"
              searchPlaceholder="Search pharmacy by name, license, or area..."
            />
          )}

          {activeTab === 'riders' && (
            <DataTable
              columns={riderColumns}
              data={riders}
              searchKey="fullName"
              searchPlaceholder="Search rider by name, vehicle number, or email..."
            />
          )}

          {activeTab === 'users' && (
            <DataTable
              columns={userColumns}
              data={users}
              searchKey="fullName"
              searchPlaceholder="Search registered patient by name or phone..."
            />
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD NEW ENTITY WITH DEDICATED EMAIL & PASSWORD          */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
            <div className="w-full max-w-xl bg-surface-pure rounded-3xl p-6 sm:p-7 shadow-floating border border-brandBorder-subtle text-left relative overflow-hidden animate-scale-up my-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-brandBorder-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
                    {activeTab === 'clinics' ? (
                      <Activity className="w-5 h-5" />
                    ) : activeTab === 'doctors' ? (
                      <Stethoscope className="w-5 h-5" />
                    ) : activeTab === 'pharmacies' ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      <Bike className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-extrabold text-forest-800">
                      Add New {activeTab === 'clinics' ? 'Clinic & Receptionist' : activeTab === 'doctors' ? 'Doctor Profile' : activeTab === 'pharmacies' ? 'Pharmacy & Pharmacist' : 'Delivery Rider'}
                    </h2>
                    <p className="text-xs text-brandText-secondary">
                      Create verified entity profile with dedicated login credentials.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-brandText-secondary hover:text-forest-700 hover:bg-forest-50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
                {/* 1. Name */}
                {activeTab === 'clinics' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Clinic / Polyclinic Name *
                      </label>
                      <input
                        type="text"
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. Apollo Clinic Salt Lake"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Receptionist / Manager Name *
                      </label>
                      <input
                        type="text"
                        required
                        name="managerName"
                        value={formData.managerName}
                        onChange={handleInputChange}
                        placeholder="e.g. Sujit Sen"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                  </div>
                ) : activeTab === 'pharmacies' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Pharmacy Store Name *
                      </label>
                      <input
                        type="text"
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g. MedPlus Pharmacy Sector V"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Pharmacist / In-charge Name *
                      </label>
                      <input
                        type="text"
                        required
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        placeholder="e.g. Subhash Bose"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder={activeTab === 'doctors' ? 'e.g. Dr. Debabrata Mukherjee' : 'e.g. Rahul Das'}
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>
                )}

                {/* 2. Dedicated Credentials (Email & Password) */}
                <div className="p-3.5 bg-forest-50/70 border border-forest-100 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-forest-800">
                    <Shield className="w-3.5 h-3.5 text-forest-600" />
                    <span>Dedicated Staff & Workspace Login Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Login Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="e.g. staff@oshudwala.in"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Password (min. 6 characters) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-brandText-muted p-0.5"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Contact Mobile Number (10 digits) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-forest-700">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="9876543210"
                        className="w-full pl-12 pr-3 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Entity Specific Fields */}
                {activeTab === 'doctors' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          Specialization *
                        </label>
                        <select
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        >
                          <option value="General Physician">General Physician</option>
                          <option value="Cardiologist">Cardiologist</option>
                          <option value="Pediatrician">Pediatrician</option>
                          <option value="Dermatologist">Dermatologist</option>
                          <option value="Orthopedic">Orthopedic</option>
                          <option value="Gynecologist">Gynecologist</option>
                          <option value="ENT Specialist">ENT Specialist</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          Qualifications & Degrees
                        </label>
                        <input
                          type="text"
                          name="qualifications"
                          value={formData.qualifications}
                          onChange={handleInputChange}
                          placeholder="e.g. MBBS, MD (Cardio)"
                          className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          Reg Number
                        </label>
                        <input
                          type="text"
                          name="registrationNumber"
                          value={formData.registrationNumber}
                          onChange={handleInputChange}
                          placeholder="WBMC-78912"
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          Experience (Yrs)
                        </label>
                        <input
                          type="number"
                          name="experienceYears"
                          value={formData.experienceYears}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          Chamber Fee (₹)
                        </label>
                        <input
                          type="number"
                          name="consultationFee"
                          value={formData.consultationFee}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(activeTab === 'pharmacies' || activeTab === 'clinics') && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Physical Address Line 1 *
                      </label>
                      <input
                        type="text"
                        required
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Block DC, Sector 1, Salt Lake City"
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">Pincode</label>
                        <input
                          type="text"
                          maxLength={6}
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          {activeTab === 'clinics' ? 'Chambers' : 'Drug License No.'}
                        </label>
                        <input
                          type="text"
                          name={activeTab === 'clinics' ? 'chamberCount' : 'licenseNumber'}
                          value={activeTab === 'clinics' ? formData.chamberCount : formData.licenseNumber}
                          onChange={handleInputChange}
                          placeholder={activeTab === 'clinics' ? '8 Chambers' : 'WB-DL-9901'}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'riders' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Vehicle Type
                      </label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      >
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Scooter">Scooter</option>
                        <option value="EV Bike">EV Bike</option>
                        <option value="Bicycle">Bicycle</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Vehicle Reg Number
                      </label>
                      <input
                        type="text"
                        name="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={handleInputChange}
                        placeholder="WB-02-AK-9921"
                        className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        City Zone
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Kolkata South"
                        className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="pt-3 border-t border-brandBorder-subtle flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className="font-bold shadow-card px-5"
                  >
                    Save & Create Login
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE / REMOVE CONFIRMATION                            */}
      {/* ============================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setItemToDelete(null)}
          />
          <div className="min-h-full flex items-center justify-center p-4 text-center">
            <div className="w-full max-w-md bg-surface-pure rounded-3xl p-6 shadow-floating border border-rose-200 text-left relative overflow-hidden animate-scale-up">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-forest-900">
                    Confirm Removal
                  </h3>
                  <p className="text-xs text-brandText-secondary mt-1">
                    Are you sure you want to remove <strong className="text-rose-700">{itemToDelete.name}</strong>?
                    This will revoke their access and deactivate the associated workspace credentials.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-brandBorder-subtle">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItemToDelete(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDeleteConfirm}
                  isLoading={isSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4"
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEntitiesPage;
