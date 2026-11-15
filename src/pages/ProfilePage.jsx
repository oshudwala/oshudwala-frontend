import React, { useState } from 'react';
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
  Edit,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Eye,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
  const [name, setName] = useState(user?.name || 'Ayon Paul');
  const [email, setEmail] = useState(user?.email || 'ayon@oshudwala.com');
  const [phone, setPhone] = useState(user?.phone || '+880 1712-345678');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '+880 1799-887766');

  // Saved Addresses state
  const [addresses, setAddresses] = useState([
    {
      id: 'addr-1',
      tag: 'Home',
      recipient: 'Ayon Paul',
      phone: '+880 1712-345678',
      address: 'House 24, Road 7, Dhanmondi, Dhaka-1205'
    },
    {
      id: 'addr-2',
      tag: 'Office',
      recipient: 'Ayon Paul',
      phone: '+880 1712-345678',
      address: 'Level 5, Concord Tower, Banani C/A, Dhaka-1213'
    }
  ]);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newTag, setNewTag] = useState('Home');
  const [newRecipient, setNewRecipient] = useState(user?.name || '');
  const [newAddressText, setNewAddressText] = useState('');
  const [newPhone, setNewPhone] = useState(user?.phone || '');

  // Prescriptions
  const prescriptions = prescriptionService.getUserPrescriptions();
  const [previewPrescription, setPreviewPrescription] = useState(null);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUserProfile({
      name,
      email,
      phone,
      bloodGroup,
      emergencyContact
    });
    setIsEditing(false);
    addToast('Profile updated successfully!', 'success');
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddressText.trim()) return;

    const newAddr = {
      id: 'addr-' + Date.now(),
      tag: newTag,
      recipient: newRecipient || user?.name || 'Patient',
      phone: newPhone || user?.phone || '',
      address: newAddressText
    };

    setAddresses((prev) => [...prev, newAddr]);
    setIsAddressModalOpen(false);
    setNewAddressText('');
    addToast('Address added successfully!', 'success');
  };

  const handleDeleteAddress = (id) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    addToast('Address removed.', 'info');
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
                {user?.name || 'Ayon Paul'}
              </h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Verified Patient
              </span>
            </div>
            <p className="text-xs text-brandText-secondary mt-0.5">{user?.email}</p>
            <p className="text-xs text-forest-600 font-semibold mt-0.5">
              Blood Group: <span className="font-bold text-forest-800">{user?.bloodGroup || 'O+'}</span> • {user?.phone}
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

      {/* Main Grid: Tabs on Left, Content on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle shadow-subtle space-y-1">
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
                className={`w-full px-4 py-3 rounded-2xl text-left text-xs sm:text-sm font-bold flex items-center gap-3 transition-all ${
                  isCurrent
                    ? 'bg-forest-600 text-white shadow-sm'
                    : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-forest-600'}`} />
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
                  <p className="text-xs text-brandText-secondary">Manage your patient contact & medical profile</p>
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
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
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
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-brandText-main mb-1">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                    <p className="text-brandText-secondary">Full Name</p>
                    <p className="font-bold text-forest-800 text-sm mt-0.5">{user?.name || 'Ayon Paul'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                    <p className="text-brandText-secondary">Email Address</p>
                    <p className="font-bold text-forest-800 text-sm mt-0.5">{user?.email || 'ayon@oshudwala.com'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                    <p className="text-brandText-secondary">Phone Number</p>
                    <p className="font-bold text-forest-800 text-sm mt-0.5">{user?.phone || '+880 1712-345678'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                    <p className="text-brandText-secondary">Blood Group</p>
                    <p className="font-bold text-forest-800 text-sm mt-0.5">{user?.bloodGroup || 'O+'}</p>
                  </div>
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                    <p className="text-brandText-secondary">Emergency Contact</p>
                    <p className="font-bold text-forest-800 text-sm mt-0.5">{user?.emergencyContact || '+880 1799-887766'}</p>
                  </div>
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
                  <p className="text-xs text-brandText-secondary">Manage addresses for fast checkout</p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  Add Address
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="p-5 rounded-2xl border border-brandBorder-subtle bg-surface-warm space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800">
                        {addr.tag}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-forest-800">{addr.recipient}</p>
                    <p className="text-xs text-brandText-secondary leading-relaxed">{addr.address}</p>
                    <p className="text-[11px] text-brandText-muted">{addr.phone}</p>
                  </div>
                ))}
              </div>
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
                        <p className="text-[11px] text-brandText-muted mt-0.5">
                          {rx.pharmacistReview}
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
                  <span className="text-4xl font-extrabold">{user?.walletBalance || 250}</span>
                  <span className="text-sm font-bold text-emerald-300">Oshud Coins (৳{user?.walletBalance || 250}.00)</span>
                </div>
                <p className="text-xs text-forest-200 pt-1">
                  Applicable instantly at checkout. Earn 50 Coins for every friend you refer.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="border-b border-brandBorder-subtle pb-4">
                <h3 className="font-heading font-bold text-lg text-forest-800">Account Settings</h3>
                <p className="text-xs text-brandText-secondary">Security preferences and notification alerts</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                  <div>
                    <p className="font-bold text-forest-800">SMS Queue Token Alerts</p>
                    <p className="text-brandText-secondary mt-0.5">Receive text message reminders when your doctor's queue moves</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-forest-600 rounded" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                  <div>
                    <p className="font-bold text-forest-800">Medicine Dispatch Notifications</p>
                    <p className="text-brandText-secondary mt-0.5">Real-time status updates when rider departs pharmacy</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-forest-600 rounded" />
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
        subtitle="Save home, office, or parents address for faster checkout"
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
              className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Full Street Address</label>
            <textarea
              required
              rows={2}
              placeholder="House, Road, Area, Dhaka postal code..."
              value={newAddressText}
              onChange={(e) => setNewAddressText(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-brandText-main mb-1">Contact Phone</label>
            <input
              type="tel"
              required
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
            />
          </div>

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
