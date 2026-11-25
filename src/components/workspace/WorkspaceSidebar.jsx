import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  FileText,
  Bike,
  Coins,
  Users,
  Stethoscope,
  Building2,
  Package,
  Layers,
  Wallet,
  Settings,
  Clock,
  CalendarCheck,
  UserCheck,
  QrCode,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  History,
  UserPlus,
  Sliders,
  ShieldCheck,
  DollarSign,
  CalendarPlus,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';

export const WorkspaceSidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { orders, tokens, prescriptions, inventory } = useWorkspaceStore();

  const rawRole = typeof user?.role === 'object' ? (user?.role?.name || user?.role?.role) : user?.role;
  let userRole = String(rawRole || '').trim().toUpperCase();
  if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') userRole = 'SUPER_ADMIN';

  // Dynamic counts for notification badges
  const pendingOrdersCount = orders.filter((o) => ['PENDING', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)).length;
  const waitingTokensCount = tokens.filter((t) => ['WAITING', 'NEXT'].includes(t.status)).length;
  const pendingRxCount = prescriptions.filter((p) => p.status === 'PENDING_VERIFICATION').length;
  const expiringStockCount = inventory.filter((i) => i.status === 'EXPIRING_SOON' || i.status === 'LOW_STOCK').length;

  const getNavGroups = () => {
    switch (userRole) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return [
          {
            title: 'Overview',
            items: [
              { label: 'Dashboard', path: '/admin', icon: LayoutDashboard }
            ],
          },
          {
            title: 'Operations & Management',
            items: [
              { label: 'Orders', path: '/admin/orders', icon: ShoppingBag, badge: pendingOrdersCount },
              { label: 'Prescriptions', path: '/admin/prescriptions', icon: FileText, badge: pendingRxCount },
              { label: 'Appointments Tracker', path: '/admin/appointments', icon: CalendarCheck },
              { label: 'Staff Management', path: '/admin/staff', icon: Users },
              { label: 'Assign Doctors', path: '/admin/assign-doctors', icon: UserPlus },
            ],
          },
          {
            title: 'Platform Controls',
            items: [
              { label: 'Patient Home Controls', path: '/admin/homepage-controls', icon: Sliders },
              { label: 'Booking Rules', path: '/admin/booking-rules', icon: ShieldCheck },
            ],
          },
          {
            title: 'Commerce & Stock',
            items: [
              { label: 'Inventory', path: '/admin/inventory', icon: Layers, badge: expiringStockCount },
            ],
          },
          {
            title: 'Finance',
            items: [
              { label: 'Settlements & Wallet', path: '/admin/finance', icon: Wallet },
              { label: 'Cash Workflow', path: '/admin/finance?tab=cash-workflow', icon: DollarSign },
            ],
          },
        ];

      case 'DOCTOR':
        return [
          {
            title: 'Clinical Desk',
            items: [
              { label: 'Overview', path: '/doctor', icon: LayoutDashboard },
              { label: 'Live Token Queue', path: '/doctor/queue', icon: Clock, badge: waitingTokensCount, highlight: true },
              { label: 'Appointments', path: '/doctor/appointments', icon: CalendarCheck },
              { label: 'Patient Records', path: '/doctor/patients', icon: Users },
            ],
          },
          {
            title: 'Practice & Schedule',
            items: [
              { label: 'Associated Clinics', path: '/doctor/clinics', icon: Building2 },
            ],
          },
        ];

      case 'PHARMACY':
      case 'PHARMACIST':
        return [
          {
            title: 'Pharmacy Operations',
            items: [
              { label: 'Overview', path: '/pharmacy', icon: LayoutDashboard },
              { label: 'Prescription Review', path: '/pharmacy/prescriptions', icon: FileText, badge: pendingRxCount, highlight: true },
              { label: 'Orders Processing', path: '/pharmacy/orders', icon: ShoppingBag, badge: pendingOrdersCount },
              { label: 'QR Pickup Verification', path: '/pharmacy/pickup', icon: QrCode },
              { label: 'Wallet & Daily Bills', path: '/pharmacy/wallet', icon: Wallet },
            ],
          },
          {
            title: 'Inventory & Compliance',
            items: [
              { label: 'Stock & Expiry Alert', path: '/pharmacy/inventory', icon: Layers, badge: expiringStockCount },
            ],
          },
        ];

      case 'RIDER':
        return [
          {
            title: 'Fleet Operations',
            items: [
              { label: 'Rider Dashboard', path: '/rider', icon: LayoutDashboard },
              {
                label: 'Active Deliveries',
                path: '/rider/deliveries',
                icon: Bike,
                badge: orders.filter((o) => ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status)).length,
                highlight: true,
              },
              { label: 'Completed Deliveries', path: '/rider/history', icon: History },
            ],
          },
          {
            title: 'Finance & Profile',
            items: [
              { label: 'Cash in Hand (COD)', path: '/rider/cash', icon: Coins },
              { label: 'Earnings & Payouts', path: '/rider/earnings', icon: Wallet },
              { label: 'Rider Profile', path: '/rider/profile', icon: UserCheck },
            ],
          },
        ];

      case 'RECEPTIONIST':
        return [
          {
            title: 'Clinic Front Desk',
            items: [
              { label: 'Desk Overview', path: '/receptionist', icon: LayoutDashboard },
              { label: 'Live Token Queue', path: '/receptionist/queue', icon: Clock, badge: waitingTokensCount, highlight: true },
              { label: 'Walk-in Registration', path: '/receptionist/registration', icon: UserCheck, highlight: true },
              { label: 'Appointment Booking', path: '/receptionist/appointments', icon: CalendarCheck },
            ],
          },
          {
            title: 'Clinic Roster',
            items: [
              { label: 'Doctor Availability', path: '/receptionist/doctors', icon: Stethoscope },
              { label: 'Add / Remove Doctors', path: '/receptionist/manage-doctors', icon: UserPlus },
              { label: 'Assign Doctors', path: '/receptionist/assign-doctors', icon: CalendarPlus },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const navGroups = getNavGroups();

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-surface-pure border-r border-brandBorder-subtle z-40 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-brandBorder-subtle px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <img src="/logo-light.png" alt="Oshud Wala Logo" className="h-8 w-auto flex-shrink-0" />  
          </Link>
        </div>

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold text-forest-900/60 uppercase tracking-wider mb-1.5">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const currentFullPath = `${location.pathname}${location.search}`;
                const currentTab = new URLSearchParams(location.search).get('tab');

                let isActive = false;
                if (item.path.includes('?tab=')) {
                  const itemTab = new URLSearchParams(item.path.split('?')[1]).get('tab');
                  isActive = location.pathname === item.path.split('?')[0] && currentTab === itemTab;
                } else if (item.path === '/admin/finance') {
                  isActive = location.pathname === '/admin/finance' && (!currentTab || currentTab === 'settlements');
                } else if (item.path === '/admin/staff') {
                  const staffPaths = ['/admin/staff', '/admin/staff-management', '/admin/clinics', '/admin/doctors', '/admin/pharmacies', '/admin/riders', '/admin/users'];
                  isActive = staffPaths.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));
                } else if (item.path === '/admin/locations') {
                  isActive = location.pathname === '/admin/locations';
                } else {
                  isActive =
                    item.path === location.pathname ||
                    (item.path !== '/admin' &&
                      item.path !== '/doctor' &&
                      item.path !== '/pharmacy' &&
                      item.path !== '/rider' &&
                      item.path !== '/receptionist' &&
                      item.path !== '/receptionist/doctors' &&
                      item.path !== '/receptionist/manage-doctors' &&
                      item.path !== '/receptionist/assign-doctors' &&
                      location.pathname.startsWith(item.path));
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                      isActive
                        ? 'bg-forest-800 text-white shadow-sm'
                        : item.highlight
                        ? 'text-forest-900 hover:bg-forest-50 font-bold'
                        : 'text-brandText-secondary hover:text-forest-900 hover:bg-forest-50/70'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive
                          ? 'text-emerald-300'
                          : item.highlight
                          ? 'text-forest-600'
                          : 'text-brandText-muted'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}

                    {!isCollapsed && Boolean(item.badge) && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-emerald-400 text-forest-950'
                            : 'bg-forest-100 text-forest-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Small badge dot if collapsed */}
                    {isCollapsed && Boolean(item.badge) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer Collapse Toggle */}
        <div className="p-3 border-t border-brandBorder-subtle bg-surface-warm/40 hidden lg:flex items-center justify-between">
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl text-brandText-secondary hover:bg-forest-100 hover:text-forest-900 transition-colors ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default WorkspaceSidebar;
