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
  X,
  Edit3,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Clock,
  Calendar,
  Check,
  Power,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import adminApi from '../../services/api/admin.api';
import accountRegistry from '../../services/api/accountRegistry';
import ImageDropzone from '../../components/common/ImageDropzone';

const STANDARD_TIME_SLOTS = [
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
  '07:30 PM',
  '08:00 PM',
  '08:30 PM',
  '09:00 PM',
];

export const AdminEntitiesPage = ({ initialTab = 'clinics' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  // Tab: 'clinics' | 'doctors' | 'pharmacies' | 'riders' | 'receptionists' | 'users'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data states - load cached entities if fresh, else start clean with loader
  const hasCache = adminApi.hasCachedEntities();
  const cached = adminApi.getCachedEntities();
  const [clinics, setClinics] = useState(cached?.clinics || []);
  const [doctors, setDoctors] = useState(cached?.doctors || []);
  const [pharmacies, setPharmacies] = useState(cached?.pharmacies || []);
  const [riders, setRiders] = useState(cached?.riders || []);
  const [receptionists, setReceptionists] = useState(cached?.receptionists || []);
  const [users, setUsers] = useState(cached?.users || []);
  const [isLoading, setIsLoading] = useState(!hasCache);
  const [isSyncing, setIsSyncing] = useState(false);
  const [togglingStatusId, setTogglingStatusId] = useState(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
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
    imageUrl: '',
    // Doctor specific
    registrationNumber: '',
    qualifications: '',
    experienceYears: '5',
    specialization: 'General Physician',
    consultationFee: '500',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
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

  // Form inputs for Edit Entity
  const [editFormData, setEditFormData] = useState({});

  // Form inputs for Assign Doctor to Clinic
  const [assignData, setAssignData] = useState({
    clinicId: '',
    doctorId: '',
    consultationFee: '500',
    chamberNo: 'Chamber 1',
    availableDays: ['Mon', 'Wed', 'Fri'],
    timeSlot: '10:00 AM - 01:00 PM',
    maxPatients: '25',
  });

  // Sync tab with route if path or query param changes
  useEffect(() => {
    const searchTab = new URLSearchParams(location.search).get('tab');
    const path = location.pathname.split('/').pop();
    if (['clinics', 'doctors', 'pharmacies', 'riders', 'receptionists', 'users'].includes(searchTab)) {
      setActiveTab(searchTab);
    } else if (['clinics', 'doctors', 'pharmacies', 'riders', 'receptionists', 'users'].includes(path)) {
      setActiveTab(path);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [location.pathname, location.search, initialTab]);

  // Load real data from backend
  const loadData = async (forceRefresh = false) => {
    if (forceRefresh || !adminApi.hasCachedEntities()) {
      setIsLoading(true);
    }
    setIsSyncing(true);
    try {
      const [res, settingsRes] = await Promise.all([
        adminApi.fetchAllEntities(forceRefresh),
        adminApi.getSettings(),
      ]);

      // Read featured lists from settings if available
      const featuredDocs = settingsRes?.find?.((s) => s.key === 'featured_doctors')?.value || [];
      const featuredClins = settingsRes?.find?.((s) => s.key === 'featured_clinics')?.value || [];

      setClinics(
        (res.clinics || []).map((c) => ({
          ...c,
          isFeatured: featuredClins.includes(c.id) || Boolean(c.isFeatured),
        }))
      );
      setDoctors(
        (res.doctors || []).map((d) => ({
          ...d,
          isFeatured: featuredDocs.includes(d.id) || Boolean(d.isFeatured),
        }))
      );
      setPharmacies(res.pharmacies || []);
      setRiders(res.riders || []);
      setReceptionists(res.receptionists || []);
      setUsers(res.users || []);
    } catch (err) {
      console.error('Error fetching admin entities:', err);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (location.pathname.includes('/staff')) {
      navigate(`/admin/staff?tab=${tab}`);
    } else {
      navigate(`/admin/${tab}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Calculate 30 days deadline countdown
  const getDeadlineBadge = (row) => {
    const isDeactivated = row.status === 'DEACTIVATED' || row.user?.status === 'DEACTIVATED';
    if (!isDeactivated) return null;

    const deadline = row.purgeDeadline || (row.deactivatedAt ? new Date(row.deactivatedAt).getTime() + 30 * 24 * 60 * 60 * 1000 : null);
    let daysLeft = 30;
    if (deadline) {
      const diffMs = deadline - Date.now();
      daysLeft = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    }

    return (
      <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
        <span>Purge in {daysLeft} days</span>
      </div>
    );
  };

  // Toggle Activate / Deactivate (30 Days Deadline)
  const handleToggleStatus = async (row, type) => {
    const targetKey = row.id || row.userId;
    setTogglingStatusId(targetKey);

    const currentStatus = row.status || row.user?.status || 'ACTIVE';
    const newStatus = currentStatus === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
    const roleMap = {
      clinics: 'RECEPTIONIST',
      doctors: 'DOCTOR',
      pharmacies: 'PHARMACY',
      riders: 'RIDER',
      receptionists: 'RECEPTIONIST',
      users: 'PATIENT',
    };
    const roleName = roleMap[type] || 'PATIENT';
    const targetUserId = row.userId || row.user?.id || row.id;

    // Instant Optimistic UI Update (0ms)
    const updateList = (list) =>
      list.map((item) => {
        if (item.id === row.id || (row.userId && item.userId === row.userId)) {
          return {
            ...item,
            status: newStatus,
            purgeDeadline: newStatus === 'DEACTIVATED' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null,
            deactivatedAt: newStatus === 'DEACTIVATED' ? new Date().toISOString() : null,
            user: item.user ? { ...item.user, status: newStatus } : item.user,
          };
        }
        return item;
      });

    if (type === 'clinics') setClinics(updateList);
    else if (type === 'doctors') setDoctors(updateList);
    else if (type === 'pharmacies') setPharmacies(updateList);
    else if (type === 'riders') setRiders(updateList);
    else if (type === 'receptionists') setReceptionists(updateList);
    else if (type === 'users') setUsers(updateList);

    try {
      await adminApi.setStatus(targetUserId, roleName, newStatus, row);
      addToast(
        newStatus === 'DEACTIVATED'
          ? `${row.fullName || row.name || 'Account'} deactivated. 30-day deadline scheduled before permanent purge.`
          : `${row.fullName || row.name || 'Account'} activated and login restored!`,
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Failed to update account status.', 'error');
    } finally {
      setTogglingStatusId(null);
    }
  };

  // Toggle Featured on Home Page
  const handleToggleFeatured = async (row, type) => {
    const newFeatured = !row.isFeatured;
    const settingKey = type === 'doctors' ? 'featured_doctors' : 'featured_clinics';

    try {
      if (type === 'doctors') {
        await adminApi.updateDoctor(row.id, { ...row, isFeatured: newFeatured });
      } else {
        await adminApi.updateClinic(row.id, { ...row, isFeatured: newFeatured });
      }

      // Sync platform setting key
      const currentSettings = await adminApi.getSettings();
      const existingList = currentSettings.find?.((s) => s.key === settingKey)?.value || [];
      let updatedList = Array.isArray(existingList) ? [...existingList] : [];
      if (newFeatured) {
        if (!updatedList.includes(row.id)) updatedList.push(row.id);
      } else {
        updatedList = updatedList.filter((id) => id !== row.id);
      }
      await adminApi.setSetting(settingKey, updatedList);

      // Save locally for instant live reflection on homepage
      localStorage.setItem(`oshud_${settingKey}`, JSON.stringify(updatedList));

      addToast(
        newFeatured
          ? `⭐ ${row.fullName || row.name} is now FEATURED on the Home Page!`
          : `${row.fullName || row.name} removed from featured section.`,
        'success'
      );
      await loadData();
    } catch (err) {
      addToast('Failed to update featured status', 'error');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (row, type) => {
    setItemToEdit({ ...row, entityType: type });
    setEditFormData({
      id: row.id,
      userId: row.userId || row.user?.id || row.id,
      fullName: row.fullName || row.name || row.user?.fullName || '',
      name: row.name || row.fullName || '',
      email: row.email || row.user?.email || '',
      phone: row.phone || row.user?.phone || '',
      imageUrl: row.imageUrl || row.user?.imageUrl || '',
      address: row.line1 || row.address || '',
      city: row.city || 'Kolkata',
      state: row.state || 'West Bengal',
      pincode: row.pincode || '700064',
      // Doctor
      specialization: row.specializations?.[0]?.specialization?.name || row.specialization || 'General Physician',
      qualifications: row.qualifications || 'MBBS',
      registrationNumber: row.registrationNumber || '',
      experienceYears: String(row.experienceYears || '5'),
      consultationFee: String(((row.consultationFeePaise || 50000) / 100).toFixed(0)),
      startTime: row.startTime || (row.shift ? row.shift.split('–')[0]?.trim().split('-')[0]?.trim() : '10:00 AM') || '10:00 AM',
      endTime: row.endTime || (row.shift ? (row.shift.split('–')[1] || row.shift.split('-')[1])?.trim() : '01:00 PM') || '01:00 PM',
      // Clinic
      chamberCount: row.settings?.chamberCount || row.chamberCount || '6 Chambers',
      // Pharmacy
      licenseNumber: row.licenseNumber || '',
      // Rider
      vehicleType: row.vehicleType || 'Motorcycle',
      vehicleNumber: row.vehicleNumber || '',
      licenseNo: row.licenseNumber || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Entity
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!itemToEdit) return;
    setIsSubmitting(true);

    try {
      const type = itemToEdit.entityType;
      const targetId = itemToEdit.id;

      if (type === 'doctors') {
        await adminApi.updateDoctor(targetId, {
          fullName: editFormData.fullName,
          email: editFormData.email,
          phone: editFormData.phone.replace(/[^0-9]/g, ''),
          imageUrl: editFormData.imageUrl,
          specialization: editFormData.specialization,
          qualifications: editFormData.qualifications,
          registrationNumber: editFormData.registrationNumber,
          experienceYears: Number(editFormData.experienceYears) || 0,
          consultationFeePaise: (Number(editFormData.consultationFee) || 500) * 100,
          startTime: editFormData.startTime || '10:00 AM',
          endTime: editFormData.endTime || '01:00 PM',
          shift: `${editFormData.startTime || '10:00 AM'} – ${editFormData.endTime || '01:00 PM'}`,
        });
        addToast(`Doctor ${editFormData.fullName} details updated successfully!`, 'success');
      } else if (type === 'pharmacies') {
        await adminApi.updatePharmacy(targetId, {
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone.replace(/[^0-9]/g, ''),
          imageUrl: editFormData.imageUrl,
          licenseNumber: editFormData.licenseNumber,
          line1: editFormData.address,
          city: editFormData.city,
          state: editFormData.state,
          pincode: editFormData.pincode,
        });
        addToast(`Pharmacy "${editFormData.name}" updated successfully!`, 'success');
      } else if (type === 'clinics') {
        await adminApi.updateClinic(targetId, {
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone.replace(/[^0-9]/g, ''),
          imageUrl: editFormData.imageUrl,
          chamberCount: editFormData.chamberCount,
          line1: editFormData.address,
          city: editFormData.city,
          state: editFormData.state,
          pincode: editFormData.pincode,
        });
        addToast(`Clinic "${editFormData.name}" updated successfully!`, 'success');
      } else if (type === 'riders') {
        await adminApi.updateRider(targetId, {
          fullName: editFormData.fullName,
          email: editFormData.email,
          phone: editFormData.phone.replace(/[^0-9]/g, ''),
          imageUrl: editFormData.imageUrl,
          vehicleType: editFormData.vehicleType,
          vehicleNumber: editFormData.vehicleNumber,
          licenseNumber: editFormData.licenseNo,
          city: editFormData.city,
        });
        addToast(`Rider ${editFormData.fullName} profile updated!`, 'success');
      } else if (type === 'receptionists') {
        await adminApi.updateUser(targetId, {
          fullName: editFormData.fullName,
          email: editFormData.email,
          phone: editFormData.phone.replace(/[^0-9]/g, ''),
          imageUrl: editFormData.imageUrl,
        });
        addToast(`Receptionist ${editFormData.fullName} profile updated!`, 'success');
      } else if (type === 'users') {
        await adminApi.updateUser(targetId, {
          fullName: editFormData.fullName,
          email: editFormData.email,
          phone: editFormData.phone.replace(/[^0-9]/g, ''),
          imageUrl: editFormData.imageUrl,
        });
        addToast(`Patient ${editFormData.fullName} profile updated!`, 'success');
      }

      setIsEditModalOpen(false);
      setItemToEdit(null);
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to update details.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
          imageUrl: formData.imageUrl,
          registrationNumber: formData.registrationNumber,
          qualifications: formData.qualifications,
          experienceYears: Number(formData.experienceYears) || 0,
          specialization: formData.specialization,
          consultationFeePaise: (Number(formData.consultationFee) || 500) * 100,
          startTime: formData.startTime || '10:00 AM',
          endTime: formData.endTime || '01:00 PM',
          shift: `${formData.startTime || '10:00 AM'} – ${formData.endTime || '01:00 PM'}`,
        };
        const created = await adminApi.createDoctor(payload);
        setDoctors((prev) => [created, ...prev]);
        addToast(`Doctor ${created.fullName} registered with photo! Profile active.`, 'success');
      } else if (activeTab === 'pharmacies') {
        const payload = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone.replace(/[^0-9]/g, ''),
          password: formData.password,
          imageUrl: formData.imageUrl,
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
          imageUrl: formData.imageUrl,
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
          imageUrl: formData.imageUrl,
          vehicleType: formData.vehicleType,
          vehicleNumber: formData.vehicleNumber,
          licenseNumber: formData.licenseNo,
          city: formData.city,
        };
        const created = await adminApi.createRider(payload);
        setRiders((prev) => [created, ...prev]);
        addToast(`Rider ${created.user?.fullName || payload.fullName} registered! Login profile active.`, 'success');
      } else if (activeTab === 'receptionists') {
        const payload = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone.replace(/[^0-9]/g, ''),
          password: formData.password,
          clinicId: formData.clinicId || clinics[0]?.id,
          clinicName: clinics.find((c) => c.id === formData.clinicId)?.name || 'Central Front Desk',
        };
        const created = await adminApi.createReceptionist(payload);
        setReceptionists((prev) => [created, ...prev]);
        addToast(`Receptionist ${created.fullName || payload.fullName} registered! Login profile active.`, 'success');
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
        imageUrl: '',
        registrationNumber: '',
        qualifications: '',
        experienceYears: '5',
        specialization: 'General Physician',
        consultationFee: '500',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        clinicName: '',
        ownerName: '',
        licenseNumber: '',
        managerName: '',
        chamberCount: '6 Chambers',
        vehicleType: 'Motorcycle',
        vehicleNumber: '',
        licenseNo: '',
      });
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to create profile. Please check the entered data.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Assign Doctor to Clinic
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignData.clinicId || !assignData.doctorId) {
      addToast('Please select both a Clinic and a Doctor.', 'error');
      return;
    }
    setIsSubmitting(true);

    try {
      const selectedClinic = clinics.find((c) => c.id === assignData.clinicId);
      const selectedDoc = doctors.find((d) => d.id === assignData.doctorId);

      await adminApi.assignDoctorToClinic({
        clinicId: assignData.clinicId,
        doctorId: assignData.doctorId,
        consultationFeePaise: (Number(assignData.consultationFee) || 500) * 100,
        chamberNo: assignData.chamberNo,
        availableDays: assignData.availableDays,
        timeSlot: assignData.timeSlot,
        maxPatients: Number(assignData.maxPatients) || 25,
      });

      addToast(
        `Doctor ${selectedDoc?.fullName || 'Doctor'} assigned to ${selectedClinic?.name || 'Clinic'} (${assignData.chamberNo})!`,
        'success'
      );
      setIsAssignModalOpen(false);
      await loadData();
    } catch (err) {
      addToast(err.message || 'Failed to assign doctor.', 'error');
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
      } else if (type === 'receptionists') {
        await adminApi.deleteReceptionist(id, targetUserId);
        setReceptionists((prev) =>
          prev.filter((r) => r.id !== id && r.userId !== targetUserId && r.id !== targetUserId)
        );
        addToast('Receptionist removed and login access deactivated.', 'success');
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
      header: 'Clinic & Photo',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-forest-50 border border-brandBorder-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-5 h-5 text-forest-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-xs text-forest-900">{row.name}</p>
              {row.isPrimary && (
                <span className="text-[9px] font-bold bg-forest-800 text-white px-1.5 py-0.5 rounded">
                  Primary Hub
                </span>
              )}
            </div>
            <p className="text-[11px] text-brandText-secondary">{row.line1 || row.address}, {row.city}</p>
            <span className="inline-block mt-0.5 text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded">
              {row.settings?.chamberCount || row.chamberCount || '6 Chambers'}
            </span>
          </div>
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
      header: 'Featured on Home',
      key: 'featured',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleFeatured(row, 'clinics')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
            row.isFeatured
              ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
              : 'bg-surface-warm text-brandText-muted hover:bg-forest-50 hover:text-forest-700 border border-brandBorder-subtle'
          }`}
          title="Toggle visibility on patient home page"
        >
          <Sparkles className={`w-3.5 h-3.5 ${row.isFeatured ? 'text-amber-600 fill-amber-500' : ''}`} />
          <span>{row.isFeatured ? 'Featured' : 'Standard'}</span>
        </button>
      ),
    },
    {
      header: 'Status & Deadline',
      key: 'status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status || 'ACTIVE'} />
          {getDeadlineBadge(row)}
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'action',
      align: 'right',
      render: (row) => {
        const isDeactivated = row.status === 'DEACTIVATED';
        const isToggling = togglingStatusId === (row.id || row.userId);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Activate / Deactivate (30d) */}
            <button
              type="button"
              disabled={isToggling}
              onClick={() => handleToggleStatus(row, 'clinics')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isToggling ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isDeactivated
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
              title={isDeactivated ? 'Activate Clinic' : 'Deactivate with 30-day purge deadline'}
            >
              {isToggling && <RefreshCw className="w-3 h-3 animate-spin text-current" />}
              <span>{isToggling ? 'Updating…' : isDeactivated ? 'Activate' : 'Deactivate (30d)'}</span>
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => handleOpenEdit(row, 'clinics')}
              className="p-1.5 text-forest-700 hover:text-forest-900 hover:bg-forest-50 rounded-lg transition-colors"
              title="Edit Clinic Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete */}
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
          </div>
        );
      },
    },
  ];

  const doctorColumns = [
    {
      header: 'Doctor & Photo',
      key: 'fullName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-forest-50 border border-brandBorder-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt={row.fullName} className="w-full h-full object-cover" />
            ) : (
              <Stethoscope className="w-5 h-5 text-forest-700" />
            )}
          </div>
          <div>
            <p className="font-bold text-xs text-forest-900">{row.fullName}</p>
            <p className="text-[11px] text-forest-700 font-medium">
              {row.specializations?.[0]?.specialization?.name || row.specialization || 'General Physician'}
            </p>
            <p className="text-[10px] text-brandText-muted">
              {row.qualifications || 'MBBS'} &bull; Reg: {row.registrationNumber || 'Verified'}
            </p>
          </div>
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
      header: 'Shift Timing',
      key: 'shift',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-forest-800">
            {row.shift || (row.startTime && row.endTime ? `${row.startTime} – ${row.endTime}` : '10:00 AM – 01:00 PM')}
          </span>
          <p className="text-[10px] text-brandText-muted">Daily Consultation</p>
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
      header: 'Featured on Home',
      key: 'featured',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleToggleFeatured(row, 'doctors')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
            row.isFeatured
              ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
              : 'bg-surface-warm text-brandText-muted hover:bg-forest-50 hover:text-forest-700 border border-brandBorder-subtle'
          }`}
          title="Toggle visibility in Featured Doctors on home page"
        >
          <Sparkles className={`w-3.5 h-3.5 ${row.isFeatured ? 'text-amber-600 fill-amber-500' : ''}`} />
          <span>{row.isFeatured ? 'Featured' : 'Standard'}</span>
        </button>
      ),
    },
    {
      header: 'Status & Deadline',
      key: 'status',
      render: (row) => (
        <div>
          <StatusBadge status={row.user?.status || row.status || 'ACTIVE'} />
          {getDeadlineBadge(row)}
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'action',
      align: 'right',
      render: (row) => {
        const isDeactivated = (row.user?.status || row.status) === 'DEACTIVATED';
        const isToggling = togglingStatusId === (row.id || row.userId);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Activate / Deactivate (30d) */}
            <button
              type="button"
              disabled={isToggling}
              onClick={() => handleToggleStatus(row, 'doctors')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isToggling ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isDeactivated
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
              title={isDeactivated ? 'Activate Doctor' : 'Deactivate with 30-day purge deadline'}
            >
              {isToggling && <RefreshCw className="w-3 h-3 animate-spin text-current" />}
              <span>{isToggling ? 'Updating…' : isDeactivated ? 'Activate' : 'Deactivate (30d)'}</span>
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => handleOpenEdit(row, 'doctors')}
              className="p-1.5 text-forest-700 hover:text-forest-900 hover:bg-forest-50 rounded-lg transition-colors"
              title="Edit Doctor Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete */}
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
          </div>
        );
      },
    },
  ];

  const pharmacyColumns = [
    {
      header: 'Pharmacy & Photo',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-forest-50 border border-brandBorder-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-5 h-5 text-forest-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-xs text-forest-900">{row.name}</p>
              {row.isPrimary && (
                <span className="text-[9px] font-bold bg-forest-800 text-white px-1.5 py-0.5 rounded">
                  Primary Hub
                </span>
              )}
            </div>
            <p className="text-[11px] text-brandText-muted">License: {row.licenseNumber || 'Verified'}</p>
            <p className="text-[10px] text-brandText-secondary">{row.line1}, {row.city}</p>
          </div>
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
      header: 'Status & Deadline',
      key: 'status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status || 'ACTIVE'} />
          {getDeadlineBadge(row)}
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'action',
      align: 'right',
      render: (row) => {
        const isDeactivated = row.status === 'DEACTIVATED';
        const isToggling = togglingStatusId === (row.id || row.userId);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Activate / Deactivate (30d) */}
            <button
              type="button"
              disabled={isToggling}
              onClick={() => handleToggleStatus(row, 'pharmacies')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isToggling ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isDeactivated
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
              title={isDeactivated ? 'Activate Pharmacy' : 'Deactivate with 30-day purge deadline'}
            >
              {isToggling && <RefreshCw className="w-3 h-3 animate-spin text-current" />}
              <span>{isToggling ? 'Updating…' : isDeactivated ? 'Activate' : 'Deactivate (30d)'}</span>
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => handleOpenEdit(row, 'pharmacies')}
              className="p-1.5 text-forest-700 hover:text-forest-900 hover:bg-forest-50 rounded-lg transition-colors"
              title="Edit Pharmacy Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete */}
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
          </div>
        );
      },
    },
  ];

  const riderColumns = [
    {
      header: 'Rider & Photo',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-forest-50 border border-brandBorder-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt={row.fullName} className="w-full h-full object-cover" />
            ) : (
              <Bike className="w-5 h-5 text-forest-700" />
            )}
          </div>
          <div>
            <p className="font-bold text-xs text-forest-900">{row.user?.fullName || row.fullName || 'Rider'}</p>
            <p className="text-[11px] text-forest-700 font-medium">
              {row.vehicleType || 'Motorcycle'} &bull; {row.vehicleNumber || 'Reg Pending'}
            </p>
            <p className="text-[10px] text-brandText-muted">DL: {row.licenseNumber || 'Verified'}</p>
          </div>
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
      header: 'Status & Deadline',
      key: 'status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status || 'AVAILABLE'} />
          {getDeadlineBadge(row)}
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'action',
      align: 'right',
      render: (row) => {
        const isDeactivated = row.status === 'DEACTIVATED';
        const isToggling = togglingStatusId === (row.id || row.userId);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Activate / Deactivate (30d) */}
            <button
              type="button"
              disabled={isToggling}
              onClick={() => handleToggleStatus(row, 'riders')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isToggling ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isDeactivated
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
              title={isDeactivated ? 'Activate Rider' : 'Deactivate with 30-day purge deadline'}
            >
              {isToggling && <RefreshCw className="w-3 h-3 animate-spin text-current" />}
              <span>{isToggling ? 'Updating…' : isDeactivated ? 'Activate' : 'Deactivate (30d)'}</span>
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => handleOpenEdit(row, 'riders')}
              className="p-1.5 text-forest-700 hover:text-forest-900 hover:bg-forest-50 rounded-lg transition-colors"
              title="Edit Rider Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete */}
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
          </div>
        );
      },
    },
  ];

  const userColumns = [
    {
      header: 'Patient & Photo',
      key: 'fullName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-forest-50 border border-brandBorder-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt={row.fullName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-forest-700" />
            )}
          </div>
          <div>
            <p className="font-bold text-xs text-forest-900">{row.fullName || 'Patient'}</p>
            <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded uppercase">
              PATIENT
            </span>
          </div>
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
      header: 'Account Status & Deadline',
      key: 'status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status || 'ACTIVE'} />
          {getDeadlineBadge(row)}
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'action',
      align: 'right',
      render: (row) => {
        const isDeactivated = row.status === 'DEACTIVATED';
        const isToggling = togglingStatusId === (row.id || row.userId);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Activate / Deactivate (30d) */}
            <button
              type="button"
              disabled={isToggling}
              onClick={() => handleToggleStatus(row, 'users')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isToggling ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isDeactivated
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
              title={isDeactivated ? 'Activate Patient' : 'Deactivate with 30-day purge deadline'}
            >
              {isToggling && <RefreshCw className="w-3 h-3 animate-spin text-current" />}
              <span>{isToggling ? 'Updating…' : isDeactivated ? 'Activate' : 'Deactivate (30d)'}</span>
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => handleOpenEdit(row, 'users')}
              className="p-1.5 text-forest-700 hover:text-forest-900 hover:bg-forest-50 rounded-lg transition-colors"
              title="Edit Patient Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() =>
                setItemToDelete({
                  id: row.id,
                  userId: row.id,
                  name: row.fullName || row.phone,
                  type: 'users',
                })
              }
              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Patient Profile"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const receptionistColumns = [
    {
      header: 'Receptionist & Photo',
      key: 'fullName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-forest-50 border border-brandBorder-subtle overflow-hidden flex-shrink-0 flex items-center justify-center">
            {row.imageUrl || row.user?.imageUrl ? (
              <img src={row.imageUrl || row.user?.imageUrl} alt={row.fullName} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-5 h-5 text-forest-700" />
            )}
          </div>
          <div>
            <p className="font-bold text-xs text-forest-900">{row.fullName || row.user?.fullName || 'Receptionist'}</p>
            <span className="inline-block mt-0.5 text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.5 rounded">
              {row.clinicName || 'Reception Desk'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Center',
      key: 'clinicName',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-brandText-main">{row.clinicName || 'Central Front Desk'}</p>
          <p className="text-[11px] text-brandText-secondary">Front Desk & Consultations</p>
        </div>
      ),
    },
    {
      header: 'Contact Info',
      key: 'contact',
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-brandText-main">{row.email || row.user?.email || 'No email'}</p>
          <p className="text-[11px] text-brandText-secondary font-mono">{row.phone || row.user?.phone}</p>
        </div>
      ),
    },
    {
      header: 'Status & Deadline',
      key: 'status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status || 'ACTIVE'} />
          {getDeadlineBadge(row)}
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'action',
      align: 'right',
      render: (row) => {
        const isDeactivated = row.status === 'DEACTIVATED';
        const isToggling = togglingStatusId === (row.id || row.userId);
        return (
          <div className="flex items-center justify-end gap-1.5">
            {/* Activate / Deactivate (30d) */}
            <button
              type="button"
              disabled={isToggling}
              onClick={() => handleToggleStatus(row, 'receptionists')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                isToggling ? 'opacity-60 cursor-not-allowed' : ''
              } ${
                isDeactivated
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
              title={isDeactivated ? 'Activate Receptionist' : 'Deactivate with 30-day purge deadline'}
            >
              {isToggling && <RefreshCw className="w-3 h-3 animate-spin text-current" />}
              <span>{isToggling ? 'Updating…' : isDeactivated ? 'Activate' : 'Deactivate (30d)'}</span>
            </button>

            {/* Edit */}
            <button
              type="button"
              onClick={() => handleOpenEdit(row, 'receptionists')}
              className="p-1.5 text-forest-700 hover:text-forest-900 hover:bg-forest-50 rounded-lg transition-colors"
              title="Edit Receptionist Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() =>
                setItemToDelete({
                  id: row.id,
                  userId: row.userId || row.user?.id || row.id,
                  name: row.fullName || 'Receptionist',
                  type: 'receptionists',
                })
              }
              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
              title="Remove Receptionist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Staff Management
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Manage authenticated profiles, image avatars, 30-day deactivation deadlines, clinic assignments & featured displays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            isLoading={isSyncing}
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
              Add {activeTab === 'clinics' ? 'Clinic' : activeTab === 'doctors' ? 'Doctor' : activeTab === 'pharmacies' ? 'Pharmacy' : activeTab === 'receptionists' ? 'Receptionist' : 'Rider'}
            </Button>
          )}
        </div>
      </div>

      {/* 6 Dedicated Management Tabs */}
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
          <span>Clinics ({isLoading ? '...' : clinics.length})</span>
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
          <span>Doctors ({isLoading ? '...' : doctors.length})</span>
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
          <span>Pharmacies ({isLoading ? '...' : pharmacies.length})</span>
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
          <span>Riders ({isLoading ? '...' : riders.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('receptionists')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'receptionists'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Receptionists ({isLoading ? '...' : receptionists.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Patients ({isLoading ? '...' : users.length})</span>
        </button>
      </div>

      {/* Main Data Tables with Dedicated Skeleton Loaders per Section */}
      {activeTab === 'clinics' && (
        <DataTable
          columns={clinicColumns}
          data={clinics}
          searchKey="name"
          searchPlaceholder="Search clinic by name or city..."
          isLoading={isLoading}
        />
      )}

      {activeTab === 'doctors' && (
        <DataTable
          columns={doctorColumns}
          data={doctors}
          searchKey="fullName"
          searchPlaceholder="Search doctor by name, qualification or specialization..."
          isLoading={isLoading}
        />
      )}

      {activeTab === 'pharmacies' && (
        <DataTable
          columns={pharmacyColumns}
          data={pharmacies}
          searchKey="name"
          searchPlaceholder="Search pharmacy store by name or license..."
          isLoading={isLoading}
        />
      )}

      {activeTab === 'riders' && (
        <DataTable
          columns={riderColumns}
          data={riders}
          searchKey="fullName"
          searchPlaceholder="Search rider by name, phone or vehicle..."
          isLoading={isLoading}
        />
      )}

      {activeTab === 'receptionists' && (
        <DataTable
          columns={receptionistColumns}
          data={receptionists}
          searchKey="fullName"
          searchPlaceholder="Search receptionist by name, phone or clinic..."
          isLoading={isLoading}
        />
      )}

      {activeTab === 'users' && (
        <DataTable
          columns={userColumns}
          data={users}
          searchKey="fullName"
          searchPlaceholder="Search registered patient by name or phone..."
          isLoading={isLoading}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD NEW ENTITY WITH IMAGE OPTION (Requirement 5)        */}
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
                    ) : activeTab === 'receptionists' ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <Bike className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-extrabold text-forest-800">
                      Add New {activeTab === 'clinics' ? 'Clinic & Receptionist' : activeTab === 'doctors' ? 'Doctor Profile' : activeTab === 'pharmacies' ? 'Pharmacy & Pharmacist' : activeTab === 'receptionists' ? 'Front Desk Receptionist' : 'Delivery Rider'}
                    </h2>
                    <p className="text-xs text-brandText-secondary">
                      Create verified entity profile with photo and dedicated login credentials.
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
                {/* Drag and Drop Image Upload */}
                <ImageDropzone
                  value={formData.imageUrl}
                  onChange={(img) => setFormData((prev) => ({ ...prev, imageUrl: img }))}
                  label={
                    activeTab === 'clinics'
                      ? 'Clinic / Facility Photo'
                      : activeTab === 'doctors'
                      ? 'Doctor Profile Photo'
                      : activeTab === 'pharmacies'
                      ? 'Pharmacy Store Front / Logo'
                      : activeTab === 'receptionists'
                      ? 'Receptionist Profile Photo'
                      : 'Rider Profile Photo'
                  }
                  description="Drag & drop profile photo here or click to browse. Shown on search and booking."
                  aspectRatio="square"
                />

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
                      placeholder={activeTab === 'doctors' ? 'e.g. Dr. Debabrata Mukherjee' : activeTab === 'receptionists' ? 'e.g. Priya Sharma' : 'e.g. Rahul Das'}
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
                          <option value="Neurologist">Neurologist</option>
                          <option value="Psychiatrist">Psychiatrist</option>
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
                          Consultation Fee (₹) *
                        </label>
                        <input
                          type="number"
                          name="consultationFee"
                          value={formData.consultationFee}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          Shift Start Time *
                        </label>
                        <select
                          name="startTime"
                          value={formData.startTime || '10:00 AM'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        >
                          {STANDARD_TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          Shift End Time *
                        </label>
                        <select
                          name="endTime"
                          value={formData.endTime || '01:00 PM'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        >
                          {STANDARD_TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
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

                {activeTab === 'receptionists' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">
                        Assign to Registered Clinic / Center *
                      </label>
                      <select
                        name="clinicId"
                        value={formData.clinicId}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-semibold"
                      >
                        <option value="">Select Clinic Center</option>
                        {clinics.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.city || 'Kolkata'})
                          </option>
                        ))}
                      </select>
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
                    Save & Create Profile
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT ENTITY DETAILS (Requirement 6)                     */}
      {/* ============================================================== */}
      {isEditModalOpen && itemToEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
            <div className="w-full max-w-xl bg-surface-pure rounded-3xl p-6 sm:p-7 shadow-floating border border-brandBorder-subtle text-left relative overflow-hidden animate-scale-up my-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-brandBorder-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-extrabold text-forest-800">
                      Edit {itemToEdit.fullName || itemToEdit.name || 'Profile'}
                    </h2>
                    <p className="text-xs text-brandText-secondary">
                      Update contact, images, credentials, and parameters.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-brandText-secondary hover:text-forest-700 hover:bg-forest-50 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                {/* Drag and Drop Image Upload */}
                <ImageDropzone
                  value={editFormData.imageUrl || ''}
                  onChange={(img) => setEditFormData((prev) => ({ ...prev, imageUrl: img }))}
                  label={
                    itemToEdit?.entityType === 'clinics'
                      ? 'Clinic / Facility Photo'
                      : itemToEdit?.entityType === 'doctors'
                      ? 'Doctor Profile Photo'
                      : itemToEdit?.entityType === 'pharmacies'
                      ? 'Pharmacy Store Front / Logo'
                      : 'Rider Profile Photo'
                  }
                  description="Drag & drop new photo or click to browse from device."
                  aspectRatio="square"
                />

                {/* Common fields: Name, Email, Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      {itemToEdit.entityType === 'clinics' ? 'Clinic Name' : itemToEdit.entityType === 'pharmacies' ? 'Store Name' : 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      name={itemToEdit.entityType === 'clinics' || itemToEdit.entityType === 'pharmacies' ? 'name' : 'fullName'}
                      value={itemToEdit.entityType === 'clinics' || itemToEdit.entityType === 'pharmacies' ? editFormData.name : editFormData.fullName}
                      onChange={handleEditInputChange}
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brandText-main mb-1">
                      Login Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={editFormData.email || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brandText-main mb-1">
                    Contact Phone Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={editFormData.phone || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-mono"
                  />
                </div>

                {/* Entity Specific Edit Fields */}
                {itemToEdit.entityType === 'doctors' && (
                  <div className="space-y-3 pt-2 border-t border-brandBorder-subtle">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">Specialization</label>
                        <select
                          name="specialization"
                          value={editFormData.specialization || 'General Physician'}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        >
                          <option value="General Physician">General Physician</option>
                          <option value="Cardiologist">Cardiologist</option>
                          <option value="Pediatrician">Pediatrician</option>
                          <option value="Dermatologist">Dermatologist</option>
                          <option value="Orthopedic">Orthopedic</option>
                          <option value="Gynecologist">Gynecologist</option>
                          <option value="ENT Specialist">ENT Specialist</option>
                          <option value="Neurologist">Neurologist</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">Qualifications</label>
                        <input
                          type="text"
                          name="qualifications"
                          value={editFormData.qualifications || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">Reg Number</label>
                        <input
                          type="text"
                          name="registrationNumber"
                          value={editFormData.registrationNumber || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">Experience (Yrs)</label>
                        <input
                          type="number"
                          name="experienceYears"
                          value={editFormData.experienceYears || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">Consultation Fee (₹)</label>
                        <input
                          type="number"
                          name="consultationFee"
                          value={editFormData.consultationFee || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          Shift Start Time
                        </label>
                        <select
                          name="startTime"
                          value={editFormData.startTime || '10:00 AM'}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        >
                          {STANDARD_TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          Shift End Time
                        </label>
                        <select
                          name="endTime"
                          value={editFormData.endTime || '01:00 PM'}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
                        >
                          {STANDARD_TIME_SLOTS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {(itemToEdit.entityType === 'clinics' || itemToEdit.entityType === 'pharmacies') && (
                  <div className="space-y-3 pt-2 border-t border-brandBorder-subtle">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Address Line</label>
                      <input
                        type="text"
                        name="address"
                        value={editFormData.address || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={editFormData.city || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">Pincode</label>
                        <input
                          type="text"
                          name="pincode"
                          value={editFormData.pincode || ''}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-brandText-main mb-1">
                          {itemToEdit.entityType === 'clinics' ? 'Chambers' : 'Drug License No.'}
                        </label>
                        <input
                          type="text"
                          name={itemToEdit.entityType === 'clinics' ? 'chamberCount' : 'licenseNumber'}
                          value={itemToEdit.entityType === 'clinics' ? editFormData.chamberCount : editFormData.licenseNumber}
                          onChange={handleEditInputChange}
                          className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {itemToEdit.entityType === 'riders' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-brandBorder-subtle">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Vehicle Type</label>
                      <select
                        name="vehicleType"
                        value={editFormData.vehicleType || 'Motorcycle'}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      >
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Scooter">Scooter</option>
                        <option value="EV Bike">EV Bike</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Vehicle Number</label>
                      <input
                        type="text"
                        name="vehicleNumber"
                        value={editFormData.vehicleNumber || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">City Zone</label>
                      <input
                        type="text"
                        name="city"
                        value={editFormData.city || ''}
                        onChange={handleEditInputChange}
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
                    onClick={() => setIsEditModalOpen(false)}
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
                    Save Changes
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
                    This will permanently revoke their access and deactivate the associated workspace credentials.
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