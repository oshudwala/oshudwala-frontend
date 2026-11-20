import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  FileText,
  Wallet,
  Settings,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  Star,
  RefreshCw,
  Bell,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../services/api/user.api';
import { notificationApi } from '../services/api/notification.api';
import { prescriptionService } from '../services/prescriptionService';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export const ProfilePage = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const navigate = useNavigate();
  const { user, updateUserProfile, logout } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile Form State
  const [name, setName] = useState(user?.fullName || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [medicalNotes, setMedicalNotes] = useState(user?.medicalNotes || '');

  // Saved Addresses State
  const [addresses, setAddresses] = useState([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newTag, setNewTag] = useState('Home');
  const [newRecipient, setNewRecipient] = useState(user?.fullName || user?.name || '');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [newLine1, setNewLine1] = useState('');
  const [newCity, setNewCity] = useState('Durgapur');
  const [newState, setNewState] = useState('West Bengal');
  const [newPincode, setNewPincode] = useState('713216');
  const [newIsDefault, setNewIsDefault] = useState(false);

  // Notification Preferences State
  const [notifPreferences, setNotifPreferences] = useState(null);
  const [isNotifLoading, setIsNotifLoading] = useState(false);

  // Prescriptions State
  const prescriptions = prescriptionService.getUserPrescriptions();
  const [previewPrescription, setPreviewPrescription] = useState(null);

  // Sync profile values when auth user changes
  useEffect(() => {
    if (user) {
      setName(user.fullName || user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBloodGroup(user.bloodGroup || 'O+');
      setAllergies(user.allergies || '');
      setMedicalNotes(user.medicalNotes || '');
    }
  }, [user]);

  // Load Addresses from Backend
  const loadAddresses = async () => {
    setIsAddressesLoading(true);
    try {
      const data = await userApi.getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || 'Failed to load saved addresses', 'error');
    } finally {
      setIsAddressesLoading(false);
    }
  };

  // Load Notification Preferences
  const loadNotificationPreferences = async () => {
    setIsNotifLoading(true);
    try {
      const data = await notificationApi.getPreferences();
      setNotifPreferences(data);
    } catch {
      // Graceful fallback if no preferences set yet
    } finally {
      setIsNotifLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'addresses') {
      loadAddresses();
    } else if (activeTab === 'settings') {
      loadNotificationPreferences();
    }
  }, [activeTab]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        name,
        fullName: name,
        email,
        bloodGroup,
        allergies,
        medicalNotes,
      });
      setIsEditing(false);
      addToast('Profile updated and persisted to backend successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    const contactPhone = (newPhone || user?.phone || '').trim().replace(/[^0-9]/g, '');
    if (!newLine1.trim() || !newCity.trim() || !newPincode.trim() || contactPhone.length !== 10) {
      addToast('Please complete street address, city, pincode, and a 10-digit phone number.', 'warning');
      return;
    }

    try {
      await userApi.addAddress({
        label: newTag,
        fullName: newRecipient || user?.fullName || 'Patient',
        phone: contactPhone,
        line1: newLine1.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        pincode: newPincode.trim(),
        isDefault: newIsDefault,
      });

      setIsAddressModalOpen(false);
      setNewLine1('');
      addToast('Address added to your account!', 'success');
      loadAddresses();
    } catch (err) {
      addToast(err.message || 'Failed to add address', 'error');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await userApi.updateAddress(id, { isDefault: true });
      addToast('Default delivery address updated!', 'success');
      loadAddresses();
    } catch (err) {
      addToast(err.message || 'Failed to set default address', 'error');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await userApi.deleteAddress(id);
      addToast('Address removed.', 'info');
      loadAddresses();
    } catch (err) {
      addToast(err.message || 'Failed to remove address', 'error');
    }
  };

  const handleTogglePushNotifications = async (enabled) => {
    try {
      const updated = await notificationApi.updatePreferences({
        globalSettings: {
          pushEnabled: enabled,
        },
      });
      setNotifPreferences(updated);
      addToast(enabled ? 'Push notifications enabled.' : 'Push notifications silenced.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update notification preferences', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'profile', label: 'Personal Info', icon: User },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'prescriptions', label: 'My Prescriptions', icon: FileText },
    { id: 'wallet', label: 'Wallet & Coins', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Profile Header Card */}
      <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <img
            src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
            alt={user?.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-forest-600 shadow-card"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800">
                {user?.fullName || user?.name || 'Patient'}
              </h1>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {user?.role || 'PATIENT'}
              </span>
            </div>
            <p className="text-xs text-brandText-secondary mt-0.5">{user?.email || 'No email registered'}</p>
            <p className="text-xs text-forest-600 font-semibold mt-0.5 font-mono">
              Phone: {user?.phone} • Blood Group: <span className="font-bold text-forest-800">{user?.bloodGroup || 'O+'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveTab('profile');
              setIsEditing(true);
            }}
          >
            Edit Profile
          </Button>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2.5 rounded-full text-rose-600 hover:bg-rose-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Super Admin Workspace Quick Action Banner */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-forest-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card border border-forest-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-heading">
                Super Admin Operations Console
              </h2>
              <p className="text-xs text-forest-200">
                You have platform super admin privileges. Access live order dispatch, entity management, inventory, and finance.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin')}
            className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-forest-950 py-2.5 px-4 shadow-sm whitespace-nowrap"
          >
            Go to Admin Dashboard &rarr;
          </Button>
        </div>
      )}

      {/* Main Grid: Tabs on Left, Content on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Navigation Sidebar: Horizontal swipeable tabs on mobile, vertical sidebar on desktop */}
        <div className="lg:col-span-4 bg-surface-pure rounded-3xl p-2 sm:p-4 border border-brandBorder-subtle shadow-subtle flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsEditing(false);
                }}
                className={`px-4 py-2.5 sm:py-3 rounded-2xl text-left text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all whitespace-nowrap flex-shrink-0 lg:flex-shrink lg:w-full ${
                  isCurrent
                    ? 'bg-forest-600 text-white shadow-sm'
                    : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-700 bg-surface-warm lg:bg-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-white' : 'text-forest-600'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="lg:col-span-8 bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-subtle min-h-[400px]">
          {/* TAB 1: Personal Info */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-4">
                <div>
                  <h3 className="font-heading font-bold text-lg text-forest-800">Personal Information</h3>
                  <p className="text-xs text-brandText-secondary">
                    Profile synchronized with backend `/api/v1/users/profile`
                  </p>
                </div>
                {!isEditing && (
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                    Edit Details
                  </Button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Phone Number (Login identifier)</label>
                      <input
                        type="tel"
                        disabled
                        value={phone}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-brandBorder-subtle rounded-xl font-mono text-slate-600 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Allergies (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Penicillin, Sulfa"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Medical Notes (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Diabetic, Hypertension"
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                    <p className="text-brandText-secondary">Full Name</p>
                    <p className="font-bold text-forest-800 text-sm mt-0.5">{user?.fullName || user?.name || 'Patient'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                    <p className="text-brandText-secondary">Email Address</p>
                    <p className="font-bold text-forest-800 text-sm mt-0.5">{user?.email || 'None'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                    <p className="text-brandText-secondary">Phone Number</p>
                    <p className="font-bold text-forest-800 text-sm mt-0.5 font-mono">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                    <p className="text-brandText-secondary">Blood Group</p>
                    <p className="font-bold text-forest-800 text-sm mt-0.5">{user?.bloodGroup || 'O+'}</p>
                  </div>
                  {user?.allergies && (
                    <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                      <p className="text-brandText-secondary">Allergies</p>
                      <p className="font-bold text-forest-800 text-sm mt-0.5">{user.allergies}</p>
                    </div>
                  )}
                  {user?.medicalNotes && (
                    <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                      <p className="text-brandText-secondary">Medical Notes</p>
                      <p className="font-bold text-forest-800 text-sm mt-0.5">{user.medicalNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Saved Addresses */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-brandBorder-subtle pb-4">
                <div>
                  <h3 className="font-heading font-bold text-lg text-forest-800">Delivery Addresses</h3>
                  <p className="text-xs text-brandText-secondary">
                    Managed via backend `/api/v1/users/addresses`
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={loadAddresses} leftIcon={RefreshCw}>
                    Refresh
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={Plus}
                    onClick={() => setIsAddressModalOpen(true)}
                  >
                    Add Address
                  </Button>
                </div>
              </div>

              {isAddressesLoading ? (
                <div className="py-12 text-center text-xs text-brandText-secondary">Loading addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="py-12 text-center text-xs text-brandText-secondary">
                  No saved delivery addresses found. Click "Add Address" to add your home or office address.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border bg-surface-warm space-y-3 relative ${
                        addr.isDefault ? 'border-forest-600 ring-1 ring-forest-600/30' : 'border-brandBorder-subtle'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800">
                            {addr.label || 'Address'}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-600 text-white flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" />
                              Default
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-[11px] font-semibold text-forest-700 hover:underline px-2 py-0.5"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Delete address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-forest-800">{addr.fullName}</p>
                      <p className="text-xs text-brandText-secondary leading-relaxed">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-[11px] text-brandText-muted font-mono">{addr.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: My Prescriptions */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              <div className="border-b border-brandBorder-subtle pb-4">
                <h3 className="font-heading font-bold text-lg text-forest-800">Prescription Archive</h3>
                <p className="text-xs text-brandText-secondary">Uploaded prescriptions reviewed by licensed pharmacists</p>
              </div>

              <div className="space-y-4">
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-5 rounded-2xl border border-brandBorder-subtle bg-surface-warm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-forest-100 rounded-xl text-forest-700">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-sm text-forest-800">{rx.fileName}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rx.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rx.status}
                          </span>
                        </div>
                        <p className="text-xs text-brandText-secondary mt-0.5">
                          Ref: {rx.id} • Assigned: {rx.pharmacyName}
                        </p>
                      </div>
                    </div>

                    {rx.previewUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewPrescription(rx)}
                        className="py-1.5 px-3 rounded-xl bg-surface-pure hover:bg-forest-50 border border-brandBorder-subtle text-xs font-bold text-forest-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Wallet & Coins */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <div className="border-b border-brandBorder-subtle pb-4">
                <h3 className="font-heading font-bold text-lg text-forest-800">Oshud Coins & Wallet</h3>
                <p className="text-xs text-brandText-secondary">Spend your reward balance on medicine orders</p>
              </div>

              <div className="p-6 rounded-3xl bg-forest-800 text-white space-y-3">
                <p className="text-xs text-forest-200">Current Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold">250</span>
                  <span className="text-sm font-bold text-emerald-300">Oshud Coins (₹250.00)</span>
                </div>
                <p className="text-xs text-forest-200 pt-1">
                  Applicable instantly at checkout. Configured via Super Admin referral bonus.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="border-b border-brandBorder-subtle pb-4">
                <h3 className="font-heading font-bold text-lg text-forest-800">Notification Preferences</h3>
                <p className="text-xs text-brandText-secondary">
                  Synced directly with backend `/api/v1/notifications/preferences`
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                  <div>
                    <p className="font-bold text-forest-800">Push Notifications</p>
                    <p className="text-brandText-secondary mt-0.5">
                      Receive live updates on chamber tokens and delivery arrivals
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPreferences?.globalSettings?.pushEnabled ?? true}
                    onChange={(e) => handleTogglePushNotifications(e.target.checked)}
                    className="h-4 w-4 text-forest-600 rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add New Delivery Address"
        subtitle="Save home, office, or family address into backend profile"
      >
        <form onSubmit={handleAddAddress} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Address Label</label>
            <div className="grid grid-cols-3 gap-2">
              {['Home', 'Office', 'Parents'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewTag(t)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    newTag === t ? 'border-forest-600 bg-forest-100 text-forest-800' : 'border-brandBorder-subtle bg-surface-pure text-brandText-secondary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Recipient Name</label>
            <input
              type="text"
              required
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Contact Phone</label>
            <input
              type="tel"
              required
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Street Address Line 1</label>
            <textarea
              required
              rows={2}
              placeholder="Flat, Road, Area..."
              value={newLine1}
              onChange={(e) => setNewLine1(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">City</label>
              <input
                type="text"
                required
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">State</label>
              <input
                type="text"
                required
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brandText-main mb-1">Pincode</label>
              <input
                type="text"
                required
                value={newPincode}
                onChange={(e) => setNewPincode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={newIsDefault}
              onChange={(e) => setNewIsDefault(e.target.checked)}
              className="h-4 w-4 text-forest-600 rounded"
            />
            <span className="text-xs text-brandText-main font-medium">Set as default delivery address</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="md" onClick={() => setIsAddressModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" className="flex-1">
              Save Address
            </Button>
          </div>
        </form>
      </Modal>

      {/* Prescription Preview Modal */}
      {previewPrescription && (
        <Modal
          isOpen={Boolean(previewPrescription)}
          onClose={() => setPreviewPrescription(null)}
          title={previewPrescription.fileName}
          subtitle={`Reference: ${previewPrescription.id}`}
          maxWidth="max-w-2xl"
        >
          <div className="p-4 bg-slate-900/5 rounded-2xl flex items-center justify-center min-h-[300px]">
            <img
              src={previewPrescription.previewUrl}
              alt="Prescription document"
              className="max-h-[450px] object-contain rounded-xl"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;
