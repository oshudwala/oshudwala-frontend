import React, { useState, useEffect } from 'react';
import {
  Users,
  Settings as SettingsIcon,
  MapPin,
  Building2,
  Stethoscope,
  Plus,
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  AlertCircle
} from 'lucide-react';
import { adminApi } from '../services/api/admin.api';
import { locationApi } from '../services/api/location.api';
import { pharmacyApi } from '../services/api/pharmacy.api';
import { doctorApi } from '../services/api/doctor.api';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export const AdminDashboardPage = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('users');

  // Users State
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Settings State
  const [settings, setSettings] = useState([]);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [newSettingKey, setNewSettingKey] = useState('');
  const [newSettingVal, setNewSettingVal] = useState('');

  // Locations State
  const [locations, setLocations] = useState([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newLocCity, setNewLocCity] = useState('Durgapur');
  const [newLocArea, setNewLocArea] = useState('');
  const [newLocState, setNewLocState] = useState('West Bengal');
  const [newLocPin, setNewLocPin] = useState('713216');

  // Pharmacies State
  const [pharmacies, setPharmacies] = useState([]);
  const [isPharmaciesLoading, setIsPharmaciesLoading] = useState(false);
  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);
  const [newPharmName, setNewPharmName] = useState('');
  const [newPharmPhone, setNewPharmPhone] = useState('');
  const [newPharmLine1, setNewPharmLine1] = useState('');
  const [newPharmCity, setNewPharmCity] = useState('Durgapur');
  const [newPharmState, setNewPharmState] = useState('West Bengal');
  const [newPharmPin, setNewPharmPin] = useState('713216');
  const [newPharmLocationId, setNewPharmLocationId] = useState('');

  // Doctors & Specializations State
  const [specializations, setSpecializations] = useState([]);
  const [isSpecializationsLoading, setIsSpecializationsLoading] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocPhone, setNewDocPhone] = useState('');
  const [newDocReg, setNewDocReg] = useState('');
  const [newDocPharmId, setNewDocPharmId] = useState('');
  const [newDocSpecId, setNewDocSpecId] = useState('');

  // 1. Fetch Users
  const loadUsers = async () => {
    setIsUsersLoading(true);
    try {
      const data = await adminApi.getUsers({ page: userPage, limit: 10 });
      setUsers(data?.users || data?.items || (Array.isArray(data) ? data : []));
      setUserTotal(data?.total || 0);
    } catch (err) {
      addToast(err.message || 'Failed to load users', 'error');
    } finally {
      setIsUsersLoading(false);
    }
  };

  // 2. Fetch Settings
  const loadSettings = async () => {
    setIsSettingsLoading(true);
    try {
      const data = await adminApi.getSettings();
      setSettings(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to load platform settings', 'error');
    } finally {
      setIsSettingsLoading(false);
    }
  };

  // 3. Fetch Locations
  const loadLocations = async () => {
    setIsLocationsLoading(true);
    try {
      const data = await locationApi.getAdminLocations({ page: 1, limit: 50 });
      setLocations(data?.items || (Array.isArray(data) ? data : []));
    } catch (err) {
      addToast(err.message || 'Failed to load locations', 'error');
    } finally {
      setIsLocationsLoading(false);
    }
  };

  // 4. Fetch Pharmacies
  const loadPharmacies = async () => {
    setIsPharmaciesLoading(true);
    try {
      const data = await pharmacyApi.getPharmacies();
      setPharmacies(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to load pharmacies', 'error');
    } finally {
      setIsPharmaciesLoading(false);
    }
  };

  // 5. Fetch Specializations
  const loadSpecializations = async () => {
    setIsSpecializationsLoading(true);
    try {
      const data = await doctorApi.getSpecializations();
      setSpecializations(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to load specializations', 'error');
    } finally {
      setIsSpecializationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'settings') loadSettings();
    else if (activeTab === 'locations') loadLocations();
    else if (activeTab === 'pharmacies') {
      loadPharmacies();
      loadLocations();
    } else if (activeTab === 'doctors') {
      loadSpecializations();
      loadPharmacies();
    }
  }, [activeTab, userPage]);

  // Handle User Role / Status Update
  const handleUpdateUserAccess = async (userId, roleName, status) => {
    try {
      await adminApi.updateUserAccess(userId, { roleName, status });
      addToast('User access updated successfully!', 'success');
      loadUsers();
    } catch (err) {
      addToast(err.message || 'Failed to update user access', 'error');
    }
  };

  // Handle Save Setting
  const handleSaveSetting = async (e) => {
    e.preventDefault();
    if (!newSettingKey.trim()) return;
    try {
      let parsedVal = newSettingVal;
      try {
        parsedVal = JSON.parse(newSettingVal);
      } catch {
        // treat as string
      }
      await adminApi.setSetting({ key: newSettingKey.trim(), value: parsedVal });
      addToast(`Setting ${newSettingKey} saved!`, 'success');
      setNewSettingKey('');
      setNewSettingVal('');
      loadSettings();
    } catch (err) {
      addToast(err.message || 'Failed to save setting', 'error');
    }
  };

  // Handle Create Location
  const handleCreateLocation = async (e) => {
    e.preventDefault();
    try {
      await locationApi.createLocation({
        city: newLocCity,
        area: newLocArea,
        state: newLocState,
        pincode: newLocPin,
      });
      addToast('Location created successfully!', 'success');
      setIsLocationModalOpen(false);
      setNewLocArea('');
      loadLocations();
    } catch (err) {
      addToast(err.message || 'Failed to create location', 'error');
    }
  };

  // Handle Toggle Location Status
  const handleToggleLocationStatus = async (locId, currentStatus) => {
    try {
      await locationApi.updateLocationStatus(locId, !currentStatus);
      addToast('Location status updated!', 'success');
      loadLocations();
    } catch (err) {
      addToast(err.message || 'Failed to update location status', 'error');
    }
  };

  // Handle Create Pharmacy
  const handleCreatePharmacy = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newPharmName,
        phone: newPharmPhone,
        line1: newPharmLine1,
      };
      if (newPharmLocationId) {
        payload.locationId = newPharmLocationId;
      } else {
        payload.city = newPharmCity;
        payload.state = newPharmState;
        payload.pincode = newPharmPin;
      }
      await pharmacyApi.adminCreatePharmacy(payload);
      addToast('Pharmacy created successfully!', 'success');
      setIsPharmacyModalOpen(false);
      setNewPharmName('');
      setNewPharmPhone('');
      setNewPharmLine1('');
      loadPharmacies();
    } catch (err) {
      addToast(err.message || 'Failed to create pharmacy', 'error');
    }
  };

  // Handle Set Primary Pharmacy
  const handleSetPrimary = async (pharmacyId) => {
    try {
      await pharmacyApi.adminSetPrimary(pharmacyId);
      addToast('Primary pharmacy updated!', 'success');
      loadPharmacies();
    } catch (err) {
      addToast(err.message || 'Failed to set primary pharmacy', 'error');
    }
  };

  // Handle Onboard Doctor
  const handleOnboardDoctor = async (e) => {
    e.preventDefault();
    if (!newDocPharmId || !newDocSpecId) {
      addToast('Please select a Pharmacy and Specialization', 'warning');
      return;
    }
    try {
      await doctorApi.onboardDoctor({
        pharmacyId: newDocPharmId,
        specializationId: newDocSpecId,
        fullName: newDocName,
        phone: newDocPhone,
        registrationNumber: newDocReg,
      });
      addToast('Doctor onboarded successfully!', 'success');
      setIsDoctorModalOpen(false);
      setNewDocName('');
      setNewDocPhone('');
      setNewDocReg('');
    } catch (err) {
      addToast(err.message || 'Failed to onboard doctor', 'error');
    }
  };

  const tabs = [
    { id: 'users', label: 'User Access & Roles', icon: Users },
    { id: 'settings', label: 'Platform Settings', icon: SettingsIcon },
    { id: 'locations', label: 'Locations Master', icon: MapPin },
    { id: 'pharmacies', label: 'Pharmacy Management', icon: Building2 },
    { id: 'doctors', label: 'Doctor Onboarding', icon: Stethoscope },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-forest-900 to-forest-800 rounded-3xl p-6 sm:p-8 text-white shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider">
              Control Panel
            </span>
            <span className="text-xs text-forest-200">Production Backend Verified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold mt-1">Super Admin Console</h1>
          <p className="text-xs sm:text-sm text-forest-200 mt-1 max-w-xl">
            Live management of user access, platform coin rules, operational locations, pharmacies, and doctors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeTab === 'users') loadUsers();
              if (activeTab === 'settings') loadSettings();
              if (activeTab === 'locations') loadLocations();
              if (activeTab === 'pharmacies') loadPharmacies();
              if (activeTab === 'doctors') loadSpecializations();
            }}
            leftIcon={RefreshCw}
            className="text-white border-white/30 hover:bg-white/10"
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brandBorder-subtle">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'bg-surface-pure text-brandText-secondary hover:bg-forest-50 hover:text-forest-700 border border-brandBorder-subtle'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-forest-800">User Access Control</h3>
              <p className="text-xs text-brandText-secondary">
                Assign roles (SUPER_ADMIN, PATIENT, DOCTOR, PHARMACY, RIDER, RECEPTIONIST) and status
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-brandText-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
                />
              </div>
            </div>
          </div>

          {isUsersLoading ? (
            <div className="py-12 text-center text-xs text-brandText-secondary">Loading users from backend...</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-xs text-brandText-secondary">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brandBorder-subtle text-brandText-secondary font-semibold">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brandBorder-subtle">
                  {users
                    .filter(
                      (u) =>
                        !userSearch ||
                        u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.phone?.includes(userSearch) ||
                        u.email?.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map((u) => {
                      const currentRole = u.role?.name || u.role || 'PATIENT';
                      const currentStatus = u.status || 'ACTIVE';
                      return (
                        <tr key={u.id} className="hover:bg-forest-50/40 transition-colors">
                          <td className="py-3 px-3 font-medium text-forest-800">
                            <div>{u.fullName || 'Unnamed'}</div>
                            <div className="text-[10px] text-brandText-muted">{u.email || u.id}</div>
                          </td>
                          <td className="py-3 px-3 text-brandText-main font-mono">{u.phone}</td>
                          <td className="py-3 px-3">
                            <select
                              value={currentRole}
                              onChange={(e) => handleUpdateUserAccess(u.id, e.target.value, currentStatus)}
                              className="text-xs py-1 px-2 rounded-lg bg-surface-warm border border-brandBorder-subtle font-semibold"
                            >
                              <option value="PATIENT">PATIENT</option>
                              <option value="RIDER">RIDER</option>
                              <option value="DOCTOR">DOCTOR</option>
                              <option value="PHARMACY">PHARMACY</option>
                              <option value="RECEPTIONIST">RECEPTIONIST</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </select>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                currentStatus === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : currentStatus === 'SUSPENDED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {currentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {currentStatus === 'ACTIVE' ? (
                              <button
                                onClick={() => handleUpdateUserAccess(u.id, currentRole, 'SUSPENDED')}
                                className="text-[11px] font-bold text-amber-600 hover:underline mr-2"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateUserAccess(u.id, currentRole, 'ACTIVE')}
                                className="text-[11px] font-bold text-emerald-600 hover:underline mr-2"
                              >
                                Activate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card space-y-6">
          <div>
            <h3 className="font-heading font-bold text-lg text-forest-800">Platform Settings & Constants</h3>
            <p className="text-xs text-brandText-secondary">
              Configure system parameters such as referral coin bonuses, delivery thresholds, and operational flags
            </p>
          </div>

          <form onSubmit={handleSaveSetting} className="p-4 rounded-2xl bg-forest-50/60 border border-forest-100 space-y-3">
            <h4 className="text-xs font-bold text-forest-800">Create / Update Setting</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-brandText-secondary mb-1">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REFERRAL_BONUS"
                  value={newSettingKey}
                  onChange={(e) => setNewSettingKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-brandText-secondary mb-1">Value (JSON or String)</label>
                <input
                  type="text"
                  required
                  placeholder='e.g. {"coins": 50}'
                  value={newSettingVal}
                  onChange={(e) => setNewSettingVal(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl font-mono"
                />
              </div>
            </div>
            <Button type="submit" variant="primary" size="sm">
              Save Setting
            </Button>
          </form>

          {isSettingsLoading ? (
            <div className="py-8 text-center text-xs text-brandText-secondary">Loading settings...</div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-forest-800">Active Settings ({settings.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {settings.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-1">
                    <p className="font-bold text-forest-800 font-mono text-xs">{s.key}</p>
                    <pre className="text-[11px] text-brandText-secondary font-mono bg-white p-2 rounded-lg border border-brandBorder-subtle overflow-x-auto">
                      {typeof s.value === 'object' ? JSON.stringify(s.value, null, 2) : String(s.value)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LOCATIONS MASTER */}
      {activeTab === 'locations' && (
        <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-forest-800">Operational Locations Master</h3>
              <p className="text-xs text-brandText-secondary">
                Control the city and area coverage for pharmacies, riders, and delivery discovery
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsLocationModalOpen(true)}
            >
              Add Location
            </Button>
          </div>

          {isLocationsLoading ? (
            <div className="py-8 text-center text-xs text-brandText-secondary">Loading locations...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-forest-800">{loc.city}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          loc.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {loc.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p className="text-xs text-brandText-main mt-0.5">{loc.area || 'Entire City'}</p>
                    <p className="text-[11px] text-brandText-secondary mt-0.5">
                      {loc.state} • PIN: {loc.pincode}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-brandBorder-subtle flex justify-end">
                    <button
                      onClick={() => handleToggleLocationStatus(loc.id, loc.isActive)}
                      className={`text-xs font-bold hover:underline ${loc.isActive ? 'text-rose-600' : 'text-emerald-600'}`}
                    >
                      {loc.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PHARMACIES */}
      {activeTab === 'pharmacies' && (
        <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-forest-800">Pharmacy Network</h3>
              <p className="text-xs text-brandText-secondary">
                Onboard licensed retail pharmacies, bind them to location master, and assign primary dispatch hub
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsPharmacyModalOpen(true)}
            >
              Onboard Pharmacy
            </Button>
          </div>

          {isPharmaciesLoading ? (
            <div className="py-8 text-center text-xs text-brandText-secondary">Loading pharmacies...</div>
          ) : pharmacies.length === 0 ? (
            <div className="py-8 text-center text-xs text-brandText-secondary">No registered pharmacies.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pharmacies.map((pharm) => (
                <div key={pharm.id} className="p-5 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-forest-800">{pharm.name}</h4>
                        {pharm.isPrimary && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-600 text-white">
                            Primary Hub
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brandText-secondary mt-0.5 font-mono">{pharm.phone}</p>
                    </div>
                  </div>

                  <p className="text-xs text-brandText-main">{pharm.line1}, {pharm.city}, {pharm.state} - {pharm.pincode}</p>

                  <div className="pt-2 border-t border-brandBorder-subtle flex items-center justify-between">
                    <span className="text-[11px] text-brandText-muted">ID: {pharm.id.substring(0, 8)}...</span>
                    {!pharm.isPrimary && (
                      <button
                        onClick={() => handleSetPrimary(pharm.id)}
                        className="text-xs font-bold text-forest-700 hover:underline"
                      >
                        Set as Primary Hub
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DOCTORS */}
      {activeTab === 'doctors' && (
        <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg text-forest-800">Doctor Network & Chambers</h3>
              <p className="text-xs text-brandText-secondary">
                Affiliate doctors with pharmacies and assign medical council registration numbers
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsDoctorModalOpen(true)}
            >
              Onboard Doctor
            </Button>
          </div>

          <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle space-y-3">
            <h4 className="text-xs font-bold text-forest-800">Doctor Specializations Available</h4>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <span key={spec.id} className="text-xs font-bold px-3 py-1 rounded-full bg-forest-100 text-forest-800">
                  {spec.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Location */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title="Add Operational Location"
        subtitle="Create a new location master entry"
      >
        <form onSubmit={handleCreateLocation} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">City</label>
            <input
              type="text"
              required
              value={newLocCity}
              onChange={(e) => setNewLocCity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Area / Neighborhood</label>
            <input
              type="text"
              required
              placeholder="e.g. City Centre or Bidhannagar"
              value={newLocArea}
              onChange={(e) => setNewLocArea(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">State</label>
              <input
                type="text"
                required
                value={newLocState}
                onChange={(e) => setNewLocState(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">Pincode</label>
              <input
                type="text"
                required
                value={newLocPin}
                onChange={(e) => setNewLocPin(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsLocationModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="flex-1">
              Save Location
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Onboard Pharmacy */}
      <Modal
        isOpen={isPharmacyModalOpen}
        onClose={() => setIsPharmacyModalOpen(false)}
        title="Onboard New Pharmacy"
        subtitle="Register pharmacy details into backend master"
      >
        <form onSubmit={handleCreatePharmacy} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Pharmacy Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Oshud Wala City Centre"
              value={newPharmName}
              onChange={(e) => setNewPharmName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Contact Phone</label>
            <input
              type="tel"
              required
              placeholder="9876543210"
              value={newPharmPhone}
              onChange={(e) => setNewPharmPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Link to Location Master (Recommended)</label>
            <select
              value={newPharmLocationId}
              onChange={(e) => setNewPharmLocationId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            >
              <option value="">-- Or enter city/state below --</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.city} - {l.area} ({l.pincode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Street Address Line 1</label>
            <input
              type="text"
              required
              placeholder="Shop 12, Main Road"
              value={newPharmLine1}
              onChange={(e) => setNewPharmLine1(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsPharmacyModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="flex-1">
              Create Pharmacy
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Onboard Doctor */}
      <Modal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        title="Onboard Doctor to Pharmacy"
        subtitle="Associate practicing doctor with a registered pharmacy chamber"
      >
        <form onSubmit={handleOnboardDoctor} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Doctor Full Name</label>
            <input
              type="text"
              required
              placeholder="Dr. Sourav Banerjee"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Doctor Phone</label>
            <input
              type="tel"
              required
              placeholder="9876543211"
              value={newDocPhone}
              onChange={(e) => setNewDocPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Registration Number (e.g. WBMC)</label>
            <input
              type="text"
              required
              placeholder="WBMC-74192"
              value={newDocReg}
              onChange={(e) => setNewDocReg(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Assign to Pharmacy</label>
            <select
              required
              value={newDocPharmId}
              onChange={(e) => setNewDocPharmId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            >
              <option value="">-- Select Pharmacy --</option>
              {pharmacies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Doctor Specialization</label>
            <select
              required
              value={newDocSpecId}
              onChange={(e) => setNewDocSpecId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            >
              <option value="">-- Select Specialization --</option>
              {specializations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsDoctorModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" className="flex-1">
              Onboard Doctor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;
