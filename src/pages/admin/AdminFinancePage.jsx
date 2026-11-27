import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Bike,
  Calendar,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  Building2,
  Search,
  Filter,
  Package,
  Receipt,
  ArrowRight,
  Plus,
  Coins,
  ShieldCheck,
  MapPin,
  Phone,
  Layers,
  Sparkles,
  KeyRound,
  Lock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import MetricCard from '../../components/workspace/MetricCard';
import DataTable from '../../components/workspace/DataTable';
import StatusBadge from '../../components/workspace/StatusBadge';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useWorkspaceStore } from '../../services/workspace/useWorkspaceStore';
import { riderApi } from '../../services/api/rider.api';
import adminApi from '../../services/api/admin.api';
import accountRegistry from '../../services/api/accountRegistry';
import { calculateOrderBill } from '../../services/pricingRules';

export const AdminFinancePage = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Main Tab: 'settlements' | 'cash-workflow'
  const initialMainTab = searchParams.get('tab') === 'cash-workflow' ? 'cash-workflow' : 'settlements';
  const [mainTab, setMainTab] = useState(initialMainTab);

  // Sync mainTab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'cash-workflow') {
      setMainTab('cash-workflow');
    } else {
      setMainTab('settlements');
    }
  }, [searchParams]);

  const handleMainTabChange = (tab) => {
    setMainTab(tab);
    setSearchParams(tab === 'cash-workflow' ? { tab: 'cash-workflow' } : {});
  };

  // Sub-tab inside Cash Workflow: 'riders' | 'pharmacies'
  const [cashWorkflowSubTab, setCashWorkflowSubTab] = useState('riders');

  // Real-time workspace orders & rider data
  const { orders: workspaceOrders } = useWorkspaceStore();

  // Network entities (Riders & Pharmacies)
  const [pharmacies, setPharmacies] = useState(() => accountRegistry.getEntities().pharmacies || []);
  const [platformRiders, setPlatformRiders] = useState(() => accountRegistry.getEntities().riders || []);
  const [isLoadingEntities, setIsLoadingEntities] = useState(true);

  // Backend Cash Collections, Hub Deposits & Real Database Orders Data
  const [adminDeposits, setAdminDeposits] = useState([]);
  const [adminCashRiders, setAdminCashRiders] = useState([]);
  const [adminDbOrders, setAdminDbOrders] = useState([]);
  const [isLoadingCashData, setIsLoadingCashData] = useState(false);

  // Fetch all entities from backend and account registry
  useEffect(() => {
    let isMounted = true;
    const loadEntities = async () => {
      try {
        const [res, dbPharms] = await Promise.all([
          adminApi.fetchAllEntities().catch(() => ({ pharmacies: [], riders: [] })),
          adminApi.fetchPharmacies().catch(() => []),
        ]);
        if (!isMounted) return;

        // Pharmacies merging
        const combinedPharms = [...(res.pharmacies || [])];
        const seenPharmIds = new Set(combinedPharms.map((p) => p.id));
        const seenPharmNames = new Set(combinedPharms.map((p) => p.name?.toLowerCase()).filter(Boolean));

        (dbPharms || []).forEach((bp) => {
          const cleanName = bp.name?.toLowerCase();
          if (!seenPharmIds.has(bp.id) && (!cleanName || !seenPharmNames.has(cleanName))) {
            seenPharmIds.add(bp.id);
            if (cleanName) seenPharmNames.add(cleanName);
            combinedPharms.push({
              id: bp.id,
              name: bp.name,
              email: bp.email || '',
              phone: bp.phone || '',
              line1: bp.line1 || 'Sector V',
              city: bp.city || 'Kolkata',
              licenseNumber: bp.licenseNumber || 'WB-DL-REG',
              status: bp.status || 'ACTIVE',
              imageUrl: bp.logoUrl || bp.imageUrl || '',
            });
          }
        });

        if (combinedPharms.length) setPharmacies(combinedPharms);
        if (res.riders?.length) setPlatformRiders(res.riders);
      } catch (err) {
        console.warn('Failed to load network entities for finance:', err);
      } finally {
        if (isMounted) {
          setIsLoadingEntities(false);
        }
      }
    };
    loadEntities();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch real cash collections, hub remittances & orders from backend
  const loadCashWorkflowData = async () => {
    setIsLoadingCashData(true);
    try {
      const [ridersRes, depositsRes, ordersRes] = await Promise.all([
        adminApi.fetchAdminCashRiders().catch((err) => {
          console.warn('Backend fetchAdminCashRiders note:', err.message);
          return [];
        }),
        adminApi.fetchAdminDeposits().catch((err) => {
          console.warn('Backend fetchAdminDeposits note:', err.message);
          return [];
        }),
        adminApi.fetchAdminOrders().catch((err) => {
          console.warn('Backend fetchAdminOrders note:', err.message);
          return [];
        }),
      ]);
      if (Array.isArray(ridersRes)) setAdminCashRiders(ridersRes);
      if (Array.isArray(depositsRes)) setAdminDeposits(depositsRes);
      if (Array.isArray(ordersRes)) setAdminDbOrders(ordersRes);
    } catch (err) {
      console.warn('Error loading cash workflow data:', err);
    } finally {
      setIsLoadingCashData(false);
    }
  };

  // Combine workspace orders + real backend database orders into single source of truth
  const allOrders = useMemo(() => {
    const map = new Map();
    (workspaceOrders || []).forEach((o) => {
      if (o?.id) map.set(o.id, o);
    });
    (adminDbOrders || []).forEach((o) => {
      if (o?.id) map.set(o.id, { ...(map.get(o.id) || {}), ...o });
    });
    return Array.from(map.values());
  }, [workspaceOrders, adminDbOrders]);

  // Combined Riders: platform riders + live cash riders from backend
  const combinedRiders = useMemo(() => {
    const list = [...platformRiders];
    const seenIds = new Set(list.map((r) => r.id || r.userId));
    const seenPhones = new Set(list.map((r) => (r.phone ? String(r.phone).replace(/[^0-9]/g, '') : '')).filter(Boolean));

    (adminCashRiders || []).forEach((acr) => {
      const cleanP = acr.phone ? String(acr.phone).replace(/[^0-9]/g, '') : '';
      if (!seenIds.has(acr.riderId) && (!cleanP || !seenPhones.has(cleanP))) {
        seenIds.add(acr.riderId);
        if (cleanP) seenPhones.add(cleanP);
        list.push({
          id: acr.riderId,
          userId: acr.riderId,
          fullName: acr.name || 'Rider',
          name: acr.name || 'Rider',
          phone: acr.phone,
          email: acr.email,
          vehicleType: acr.vehicle || 'Motorcycle',
          status: 'AVAILABLE',
          cashInHand: acr.cashInHand,
        });
      }
    });
    return list;
  }, [platformRiders, adminCashRiders]);

  // ==============================================================
  // CASH WORKFLOW STATE (Rider & Pharmacy Selection)
  // ==============================================================
  const [activeRiderId, setActiveRiderId] = useState(null);
  const [riderSearchQuery, setRiderSearchQuery] = useState('');

  // Admin Password Verification Modal for Hub Deposit Remittance
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [targetDepositForVerify, setTargetDepositForVerify] = useState(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const [activePharmacyId, setActivePharmacyId] = useState(null);
  const [pharmacySearchQuery, setPharmacySearchQuery] = useState('');

  // Default selection to first available item
  useEffect(() => {
    if (!activeRiderId && combinedRiders.length > 0) {
      setActiveRiderId(combinedRiders[0].id || combinedRiders[0].userId);
    }
  }, [combinedRiders, activeRiderId]);

  useEffect(() => {
    if (!activePharmacyId && pharmacies.length > 0) {
      setActivePharmacyId(pharmacies[0].id);
    }
  }, [pharmacies, activePharmacyId]);

  // Selected Rider in Cash Workflow
  const selectedRiderObj =
    combinedRiders.find((r) => r.id === activeRiderId || r.userId === activeRiderId) ||
    combinedRiders[0];

  // Live backend overview for selected rider
  const backendRiderSummary = adminCashRiders.find(
    (r) =>
      r.riderId === selectedRiderObj?.id ||
      r.riderId === selectedRiderObj?.userId ||
      (selectedRiderObj?.phone && r.phone?.replace(/[^0-9]/g, '') === selectedRiderObj.phone.replace(/[^0-9]/g, ''))
  );

  // Rider Orders
  const riderOrders = selectedRiderObj
    ? allOrders.filter(
        (o) =>
          o.assignedRider?.id === selectedRiderObj.id ||
          o.assignedRider?.userId === selectedRiderObj.userId ||
          (selectedRiderObj.phone && o.assignedRider?.phone === selectedRiderObj.phone) ||
          (selectedRiderObj.fullName && o.assignedRider?.name === selectedRiderObj.fullName)
      )
    : [];

  const completedRiderOrders = riderOrders.filter((o) => o.status === 'DELIVERED');
  const todayDateStr = new Date().toDateString();

  // Per day COD cash collected today
  const todayCodOrders = completedRiderOrders.filter(
    (o) =>
      o.paymentMethod === 'COD' &&
      new Date(o.createdAt || Date.now()).toDateString() === todayDateStr
  );
  const todayCodCollected = todayCodOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // All-time COD cash collected by rider
  const totalCodCollected = completedRiderOrders
    .filter((o) => o.paymentMethod === 'COD')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Cash received / deposited from rider
  const riderFinance = selectedRiderObj
    ? riderApi.getFinanceOverview(selectedRiderObj.id || selectedRiderObj.userId)
    : { cashDeposited: 0, cashInHand: 0 };
  const cashReceivedFromRider = backendRiderSummary
    ? (backendRiderSummary.totalDepositedPaise / 100)
    : (riderFinance.cashDeposited || selectedRiderObj?.cashRemittedToday || 0);
  const pendingCashInHand = backendRiderSummary
    ? backendRiderSummary.cashInHand
    : Math.max(0, totalCodCollected - cashReceivedFromRider);

  // Pending deposits for this rider or all riders
  const pendingDeposits = adminDeposits.filter(
    (d) => d.status === 'SUBMITTED' || d.status === 'WAITING_VERIFICATION' || d.rawStatus === 'SUBMITTED'
  );

  const pendingRiderDeposits = pendingDeposits.filter((d) => {
    const dRiderId = d.riderId || d.rider?.id;
    return (
      dRiderId === selectedRiderObj?.id ||
      dRiderId === selectedRiderObj?.userId ||
      (selectedRiderObj?.phone && d.rider?.phone?.replace(/[^0-9]/g, '') === selectedRiderObj.phone.replace(/[^0-9]/g, ''))
    );
  });

  // Handle Opening Verification Modal for Admin Password Check (Hub Deposit)
  const handleOpenVerifyModal = (deposit) => {
    setTargetDepositForVerify(deposit);
    setAdminPasswordInput('');
    setIsVerifyModalOpen(true);
  };

  // Handle Authorizing HUB Cash Deposit with Super Admin Password
  const handleConfirmVerifyDeposit = async (e) => {
    e.preventDefault();
    if (!targetDepositForVerify) return;
    if (!adminPasswordInput || !adminPasswordInput.trim()) {
      addToast('Please enter your Super Admin password to verify this deposit.', 'error');
      return;
    }

    setIsVerifyingPassword(true);
    try {
      await adminApi.verifyCashDeposit(
        targetDepositForVerify.id,
        'VERIFIED',
        adminPasswordInput.trim()
      );
      addToast(
        `Verified HUB deposit of ₹${Number(targetDepositForVerify.amount || (targetDepositForVerify.amountPaise ? targetDepositForVerify.amountPaise / 100 : 0)).toFixed(2)}! Physical cash in hand deducted.`,
        'success'
      );
      setIsVerifyModalOpen(false);
      setTargetDepositForVerify(null);
      setAdminPasswordInput('');

      // Refresh backend state
      await Promise.all([
        loadCashWorkflowData(),
        loadSettlementsData(selectedMonth),
      ]);
      window.dispatchEvent(new CustomEvent('oshud_rider_finance_updated'));
    } catch (err) {
      addToast(err?.message || 'Verification failed. Please check your password.', 'error');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  // Handle Rejecting Deposit Slip
  const handleRejectDeposit = async (deposit) => {
    const reason = window.prompt('Please enter a rejection reason for this remittance slip:', 'Cash discrepancy at hub');
    if (reason === null) return;

    try {
      await adminApi.verifyCashDeposit(
        deposit.id,
        'REJECTED',
        null,
        reason || 'Rejected by Super Admin'
      );
      addToast(`Deposit slip rejected.`, 'info');
      await loadCashWorkflowData();
      window.dispatchEvent(new CustomEvent('oshud_rider_finance_updated'));
    } catch (err) {
      addToast(err?.message || 'Error rejecting deposit.', 'error');
    }
  };

  // Selected Pharmacy in Cash Workflow
  const selectedPharmacyObj =
    pharmacies.find((p) => p.id === activePharmacyId) || pharmacies[0];

  // Pharmacy Orders
  const pharmacyOrders = selectedPharmacyObj
    ? allOrders.filter(
        (o) =>
          o.pharmacyId === selectedPharmacyObj.id ||
          (selectedPharmacyObj.name && o.pharmacyName?.toLowerCase() === selectedPharmacyObj.name?.toLowerCase()) ||
          (selectedPharmacyObj.email && o.pharmacyEmail?.toLowerCase() === selectedPharmacyObj.email?.toLowerCase())
      )
    : [];

  // Per day sales (Today's GMV)
  const todayPharmacyOrders = pharmacyOrders.filter(
    (o) =>
      o.status !== 'CANCELLED' &&
      new Date(o.createdAt || Date.now()).toDateString() === todayDateStr
  );
  const perDaySales = todayPharmacyOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Total amount of sales (All-time GMV)
  const totalSalesAmount = pharmacyOrders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Extra charges calculation
  let totalDeliveryCharges = 0;
  let totalPackagingCharges = 0;
  let totalPlatformCharges = 0;

  pharmacyOrders.forEach((o) => {
    const bill = calculateOrderBill({
      items: o.items || [],
      customSubtotal: o.subtotal || o.total,
      deliveryFee: o.deliveryFee,
    });
    totalPackagingCharges += o.packagingFee !== undefined ? o.packagingFee : bill.packagingFee;
    totalPlatformCharges += o.platformFee !== undefined ? o.platformFee : bill.platformFee;
    totalDeliveryCharges += o.deliveryFee !== undefined ? o.deliveryFee : bill.deliveryFee;
  });

  const totalExtraCharges = totalDeliveryCharges + totalPackagingCharges + totalPlatformCharges;

  // ==============================================================
  // SETTLEMENTS & WALLET TAB STATE (REAL BACKEND INTEGRATION)
  // ==============================================================
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedRider, setSelectedRider] = useState(null);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseNote, setDisburseNote] = useState('');
  const [financeOverview, setFinanceOverview] = useState(null);
  const [ridersPayments, setRidersPayments] = useState([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState([]);
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(false);

  // Super Admin Password Verification Modal for Rider Withdrawals
  const [isVerifyWithdrawalModalOpen, setIsVerifyWithdrawalModalOpen] = useState(false);
  const [targetWithdrawalForVerify, setTargetWithdrawalForVerify] = useState(null);
  const [withdrawalAdminPassword, setWithdrawalAdminPassword] = useState('');
  const [withdrawalRefNo, setWithdrawalRefNo] = useState('');
  const [isVerifyingWithdrawal, setIsVerifyingWithdrawal] = useState(false);

  // Fallback generator to guarantee rider payment rows are always visible
  const generateFallbackRidersPayments = (monthStr) => {
    return combinedRiders.map((r) => {
      const rId = r.id || r.userId;
      const rOrders = allOrders.filter(
        (o) =>
          (o.assignedRider?.id === rId || o.assignedRider?.userId === rId || (r.phone && o.assignedRider?.phone === r.phone)) &&
          o.status === 'DELIVERED'
      );
      const monthDeliveries = rOrders.length;
      const totalEarning = monthDeliveries * 30;
      const rCash = adminCashRiders.find((c) => c.riderId === rId || (r.phone && c.phone === r.phone));
      const givenAmount = rCash?.totalDepositedPaise ? rCash.totalDepositedPaise / 100 : 0;
      const dueAmount = Math.max(0, totalEarning - givenAmount);
      return {
        id: rId,
        name: r.fullName || r.name || 'Rider',
        phone: r.phone || '9830000000',
        vehicle: r.vehicleType || 'Motorcycle',
        upiId: `${r.phone ? r.phone.replace(/[^0-9]/g, '') : '9830000000'}@upi`,
        area: 'Salt Lake & New Town',
        monthDeliveries,
        totalEarning,
        givenAmount,
        dueAmount,
        status: dueAmount > 0 ? 'DUE' : 'SETTLED',
        dailyBreakdown: rOrders.map((o) => ({
          date: new Date(o.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          deliveries: 1,
          codCollected: o.paymentMethod === 'COD' ? (o.total || 0) : 0,
          dailyEarning: 30,
          status: 'PAID',
          ref: o.orderNumber || o.id,
        })),
      };
    });
  };

  // Fetch real financial figures, rider breakdown & withdrawal requests
  const loadSettlementsData = async (month) => {
    setIsLoadingSettlements(true);
    try {
      const [data, withdrawals] = await Promise.all([
        adminApi.fetchAdminFinanceOverview(month).catch((err) => {
          console.warn('Backend fetchAdminFinanceOverview note:', err.message);
          return null;
        }),
        adminApi.fetchAdminWithdrawals().catch((err) => {
          console.warn('Backend fetchAdminWithdrawals note:', err.message);
          return [];
        }),
      ]);

      if (data) {
        setFinanceOverview(data);
        const list = data.ridersPayments || data.riders || [];
        if (list.length > 0) {
          setRidersPayments(list);
        } else {
          setRidersPayments(generateFallbackRidersPayments(month));
        }
      } else {
        setRidersPayments(generateFallbackRidersPayments(month));
      }

      if (Array.isArray(withdrawals)) {
        setAdminWithdrawals(withdrawals);
      }
    } catch (err) {
      console.warn('Error fetching settlements data:', err);
      setRidersPayments(generateFallbackRidersPayments(month));
    } finally {
      setIsLoadingSettlements(false);
    }
  };

  useEffect(() => {
    loadCashWorkflowData();
    loadSettlementsData(selectedMonth);

    const handleFinanceSync = () => {
      loadCashWorkflowData();
      loadSettlementsData(selectedMonth);
    };

    window.addEventListener('oshud_rider_finance_updated', handleFinanceSync);
    window.addEventListener('oshud_order_status_updated', handleFinanceSync);

    return () => {
      window.removeEventListener('oshud_rider_finance_updated', handleFinanceSync);
      window.removeEventListener('oshud_order_status_updated', handleFinanceSync);
    };
  }, [selectedMonth]);

  // Derived current metrics from real backend database
  const currentMetrics = financeOverview || {
    monthLabel: selectedMonth === '2026-11' ? 'November 2026' : selectedMonth,
    totalOrders: allOrders.filter((o) => o.status === 'DELIVERED').length,
    lastMonthOrders: 0,
    orderGrowth: 0,
    totalAmountReceived: allOrders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (o.total || 0), 0),
    lastMonthAmountReceived: 0,
    revenueGrowth: 0,
    riderTotal: allOrders.filter((o) => o.status === 'DELIVERED').length * 30,
    riderGiven: 0,
    riderDue: allOrders.filter((o) => o.status === 'DELIVERED').length * 30,
  };

  // Pending Rider Withdrawals (Waiting for Admin Password Verification)
  const pendingWithdrawals = adminWithdrawals.filter(
    (w) => w.status === 'REQUESTED' || w.status === 'WAITING_VERIFICATION' || w.rawStatus === 'REQUESTED'
  );

  // Handle Opening Password Verification Modal for Rider Withdrawal
  const handleOpenVerifyWithdrawal = (withdrawal) => {
    setTargetWithdrawalForVerify(withdrawal);
    setWithdrawalAdminPassword('');
    setWithdrawalRefNo(
      withdrawal.rawMethod === 'UPI' || withdrawal.method === 'UPI'
        ? `UPI/REF-${Math.floor(100000 + Math.random() * 900000)}`
        : `CASH-DISB-${Math.floor(100000 + Math.random() * 900000)}`
    );
    setIsVerifyWithdrawalModalOpen(true);
  };

  // Handle Authorizing Rider Withdrawal with Super Admin Password
  const handleConfirmVerifyWithdrawal = async (e) => {
    e.preventDefault();
    if (!targetWithdrawalForVerify) return;
    if (!withdrawalAdminPassword || !withdrawalAdminPassword.trim()) {
      addToast('Please enter your Super Admin password to verify and disburse this withdrawal.', 'error');
      return;
    }

    setIsVerifyingWithdrawal(true);
    try {
      const amt = Number(targetWithdrawalForVerify.amount || 0);
      await adminApi.reviewRiderWithdrawal(
        targetWithdrawalForVerify.id,
        'PAID',
        withdrawalAdminPassword.trim(),
        targetWithdrawalForVerify.method || targetWithdrawalForVerify.rawMethod || 'UPI',
        withdrawalRefNo.trim() || undefined
      );

      addToast(
        `Authorized and disbursed ₹${amt.toFixed(2)} to ${targetWithdrawalForVerify.riderName || 'Rider'}! (Ref: ${withdrawalRefNo || 'Verified'})`,
        'success'
      );
      setIsVerifyWithdrawalModalOpen(false);
      setTargetWithdrawalForVerify(null);
      setWithdrawalAdminPassword('');

      // Refresh backend state
      await Promise.all([
        loadSettlementsData(selectedMonth),
        loadCashWorkflowData(),
      ]);
      window.dispatchEvent(new CustomEvent('oshud_rider_finance_updated'));
    } catch (err) {
      addToast(err?.message || 'Verification failed. Please check your password.', 'error');
    } finally {
      setIsVerifyingWithdrawal(false);
    }
  };

  // Handle Rejecting Rider Withdrawal
  const handleRejectWithdrawal = async (withdrawal) => {
    const reason = window.prompt(
      'Please enter a rejection reason for this rider withdrawal request:',
      'Insufficient balance / Verification check'
    );
    if (reason === null) return;

    try {
      await adminApi.reviewRiderWithdrawal(
        withdrawal.id,
        'REJECTED',
        null,
        null,
        null,
        reason || 'Rejected by Super Admin'
      );
      addToast(`Rider withdrawal request rejected.`, 'info');
      await loadSettlementsData(selectedMonth);
      window.dispatchEvent(new CustomEvent('oshud_rider_finance_updated'));
    } catch (err) {
      addToast(err?.message || 'Error rejecting withdrawal.', 'error');
    }
  };

  // Handle Real Super Admin Disbursal to Rider
  const handleDisbursePayment = async (e) => {
    e.preventDefault();
    if (!selectedRider) return;

    const amount = Number(disburseAmount) || selectedRider.dueAmount;
    if (amount <= 0 || amount > selectedRider.dueAmount) {
      addToast('Please enter an amount between ₹1 and current due balance.', 'error');
      return;
    }

    const refNo = disburseNote.trim() || `NEFT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await adminApi.disburseToRider(selectedRider.id, amount, refNo);
      addToast(
        `Disbursed ₹${amount.toLocaleString('en-IN')} to ${selectedRider.name} successfully! (Ref: ${refNo})`,
        'success'
      );
      setIsDisbursing(false);
      setDisburseAmount('');
      setDisburseNote('');
      setSelectedRider(null);
      await loadSettlementsData(selectedMonth);
      window.dispatchEvent(new CustomEvent('oshud_rider_finance_updated'));
    } catch (err) {
      addToast(err?.message || 'Error recording rider payout.', 'error');
    }
  };

  const riderColumns = [
    {
      header: 'Rider Profile',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-xs text-forest-900">{row.name}</p>
          <p className="text-[11px] text-brandText-secondary font-mono">{row.phone}</p>
          <p className="text-[10px] text-brandText-muted">{row.vehicle}</p>
        </div>
      ),
    },
    {
      header: 'Operating Zone',
      key: 'area',
      render: (row) => <span className="text-xs text-forest-800 font-medium">{row.area || 'Salt Lake & New Town'}</span>,
    },
    {
      header: 'Month Deliveries',
      key: 'monthDeliveries',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-xs text-forest-900 font-mono">
          {row.monthDeliveries} orders
        </span>
      ),
    },
    {
      header: 'Total Earnings',
      key: 'totalEarning',
      align: 'right',
      render: (row) => (
        <span className="font-extrabold text-xs text-forest-900 font-mono">
          ₹{Number(row.totalEarning || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Paid (Given)',
      key: 'givenAmount',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-xs text-emerald-700 font-mono">
          ₹{Number(row.givenAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Due Balance',
      key: 'dueAmount',
      align: 'right',
      render: (row) => (
        <span
          className={`font-extrabold text-xs font-mono ${
            Number(row.dueAmount || 0) > 0 ? 'text-amber-700' : 'text-brandText-muted'
          }`}
        >
          ₹{Number(row.dueAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status || 'AVAILABLE'} />,
    },
    {
      header: 'Daily Details',
      key: 'action',
      align: 'right',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedRider(row);
            setDisburseAmount(row.dueAmount.toString());
          }}
          rightIcon={ChevronRight}
          className="text-xs py-1 px-3 shadow-xs font-semibold"
        >
          View Daily
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title & Main Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900 tracking-tight">
            Finance & Cash Operations
          </h1>
          <p className="text-xs sm:text-sm text-brandText-secondary mt-1">
            Reconcile live COD cash collections, pharmacy store sales, extra charges, and rider disbursement ledgers.
          </p>
        </div>

        {/* Top-Level Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-pure rounded-2xl border border-brandBorder-subtle shadow-xs">
          <button
            type="button"
            onClick={() => handleMainTabChange('settlements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mainTab === 'settlements'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Settlements & Wallet</span>
            {pendingWithdrawals.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleMainTabChange('cash-workflow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              mainTab === 'cash-workflow'
                ? 'bg-forest-800 text-white shadow-sm'
                : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Cash Workflow</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* VIEW A: CASH WORKFLOW (PHARMACY & RIDER SUB-TABS)             */}
      {/* ============================================================== */}
      {mainTab === 'cash-workflow' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub-tab Switcher: Rider vs Pharmacy */}
          <div className="flex items-center gap-2 border-b border-brandBorder-subtle pb-3">
            <button
              type="button"
              onClick={() => setCashWorkflowSubTab('riders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                cashWorkflowSubTab === 'riders'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Rider Cash Workflow {isLoadingEntities || isLoadingCashData ? '(...)' : `(${combinedRiders.length})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setCashWorkflowSubTab('pharmacies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                cashWorkflowSubTab === 'pharmacies'
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'bg-surface-pure border border-brandBorder-subtle text-brandText-secondary hover:bg-forest-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Pharmacy Cash Workflow {isLoadingEntities ? '(...)' : `(${pharmacies.length})`}</span>
            </button>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* 1. RIDER CASH WORKFLOW                                       */}
          {/* ------------------------------------------------------------ */}
          {cashWorkflowSubTab === 'riders' && (
            (isLoadingEntities || isLoadingCashData) ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-28 bg-forest-100 rounded-md" />
                      <div className="h-3 w-16 bg-forest-50 rounded" />
                    </div>
                    <div className="h-8 bg-surface-warm rounded-xl border border-brandBorder-subtle" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-3 rounded-2xl border border-brandBorder-subtle space-y-2 bg-surface-pure">
                          <div className="flex items-center justify-between">
                            <div className="h-3.5 w-24 bg-forest-100 rounded" />
                            <div className="h-4 w-14 bg-forest-100/70 rounded-full" />
                          </div>
                          <div className="h-2.5 w-20 bg-forest-50 rounded" />
                          <div className="pt-2 border-t border-brandBorder-light flex items-center justify-between">
                            <div className="h-2.5 w-12 bg-forest-50 rounded" />
                            <div className="h-3 w-16 bg-forest-100 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="bg-surface-pure p-5 rounded-3xl border border-brandBorder-subtle shadow-card flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-forest-100/80 flex-shrink-0" />
                      <div className="space-y-2">
                        <div className="h-4 w-36 bg-forest-100 rounded" />
                        <div className="h-3 w-48 bg-forest-50 rounded" />
                      </div>
                    </div>
                    <div className="h-8 w-32 bg-forest-100 rounded-xl" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs space-y-2">
                        <div className="h-2.5 w-20 bg-forest-50 rounded" />
                        <div className="h-5 w-24 bg-forest-100 rounded" />
                        <div className="h-2 w-16 bg-forest-50 rounded" />
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                    <div className="h-4 w-52 bg-amber-100 rounded" />
                    <div className="h-5 w-20 bg-amber-200/80 rounded" />
                  </div>

                  <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-40 bg-forest-100 rounded" />
                      <div className="h-3 w-28 bg-forest-50 rounded" />
                    </div>
                    <div className="space-y-2 pt-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-surface-warm/70 rounded-xl flex items-center justify-between px-3">
                          <div className="h-3 w-16 bg-forest-100 rounded" />
                          <div className="h-3 w-24 bg-forest-100 rounded" />
                          <div className="h-3 w-12 bg-forest-50 rounded" />
                          <div className="h-3 w-16 bg-forest-100 rounded" />
                          <div className="h-3 w-14 bg-forest-100/70 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-6">
              {/* Global Pending Hub Deposit Verifications */}
              {pendingDeposits.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-300 rounded-3xl p-5 shadow-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shadow-xs">
                        <Clock className="w-4 h-4 text-amber-800 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-heading font-extrabold text-sm text-amber-950 flex items-center gap-2">
                          <span>Pending HUB Remittance Verifications</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                            {pendingDeposits.length} Action Required
                          </span>
                        </h3>
                        <p className="text-[11px] text-amber-800">
                          Riders submitted cash deposits from their HUB depot. Super Admin password verification is required to authorize each deposit and deduct it from physical cash.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {pendingDeposits.map((dep) => (
                      <div
                        key={dep.id}
                        className="p-3.5 bg-surface-pure rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-forest-900">
                              {dep.rider?.fullName || dep.riderName || 'Rider'}
                            </span>
                            <span className="font-mono text-[10px] text-brandText-muted">
                              {dep.rider?.phone || ''}
                            </span>
                          </div>
                          <p className="font-mono text-emerald-800 font-extrabold text-sm mt-0.5">
                            ₹{Number(dep.amount || (dep.amountPaise ? dep.amountPaise / 100 : 0)).toFixed(2)}
                          </p>
                          <span className="text-[10px] text-brandText-secondary block">
                            Ref: {dep.referenceNo || dep.depositId || dep.id} &bull; {new Date(dep.submittedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenVerifyModal(dep)}
                            leftIcon={ShieldCheck}
                            className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5"
                          >
                            Verify with Password
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleRejectDeposit(dep)}
                            className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column (4 cols): Rider Selector List */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-forest-900 flex items-center gap-1.5">
                        <Bike className="w-4 h-4 text-forest-700" />
                        <span>Riders Fleet ({combinedRiders.length})</span>
                      </h3>
                      <span className="text-[10px] text-brandText-muted">Select rider</span>
                    </div>

                    {/* Rider Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-muted" />
                      <input
                        type="text"
                        value={riderSearchQuery}
                        onChange={(e) => setRiderSearchQuery(e.target.value)}
                        placeholder="Search rider by name, phone..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    {/* Riders List */}
                    <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                      {combinedRiders
                        .filter((r) => {
                          const q = riderSearchQuery.toLowerCase();
                          return (
                            (r.fullName || r.name || '').toLowerCase().includes(q) ||
                            (r.phone || '').includes(q) ||
                            (r.vehicleType || '').toLowerCase().includes(q)
                          );
                        })
                        .map((r) => {
                          const rId = r.id || r.userId;
                          const isSelected = activeRiderId === rId;
                          const rOrders = allOrders.filter(
                            (o) =>
                              o.assignedRider?.id === r.id ||
                              o.assignedRider?.userId === r.userId ||
                              (r.phone && o.assignedRider?.phone === r.phone)
                          );
                          const rCodOrders = rOrders.filter((o) => o.paymentMethod === 'COD' && o.status === 'DELIVERED');
                          const rCod = rCodOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                          return (
                            <div
                              key={rId}
                              onClick={() => setActiveRiderId(rId)}
                              className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                                isSelected
                                  ? 'bg-forest-50/90 border-forest-400 shadow-sm'
                                  : 'bg-surface-pure hover:bg-forest-50/40 border-brandBorder-subtle'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-xs text-forest-900">{r.fullName || r.name || 'Rider'}</p>
                                <StatusBadge status={r.status || 'AVAILABLE'} />
                              </div>
                              <p className="text-[11px] text-brandText-secondary font-mono mt-0.5">{r.phone || 'No phone'}</p>
                              <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-brandBorder-light">
                                <span className="text-brandText-muted">{rOrders.length} orders</span>
                                <span className="font-mono font-bold text-forest-800">COD: ₹{rCod.toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })}
                      {combinedRiders.length === 0 && (
                        <p className="text-xs text-brandText-muted text-center py-6">No riders registered in network.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column (8 cols): Rider Detail Cash Dashboard & Orders List */}
                <div className="lg:col-span-8 space-y-5">
                  {selectedRiderObj ? (
                    <>
                      {/* Rider Banner Header */}
                      <div className="bg-surface-pure p-5 rounded-3xl border border-brandBorder-subtle shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 flex-shrink-0">
                            {selectedRiderObj.imageUrl ? (
                              <img
                                src={selectedRiderObj.imageUrl}
                                alt="Rider"
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            ) : (
                              <Bike className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h2 className="text-base sm:text-lg font-heading font-extrabold text-forest-900">
                                {selectedRiderObj.fullName || selectedRiderObj.name}
                              </h2>
                              <StatusBadge status={selectedRiderObj.status || 'AVAILABLE'} />
                            </div>
                            <p className="text-xs text-brandText-secondary mt-0.5">
                              {selectedRiderObj.phone} &bull; {selectedRiderObj.vehicleNumber || 'WB-01-Verified'} &bull;{' '}
                              {selectedRiderObj.vehicleType || 'Motorcycle'}
                            </p>
                          </div>
                        </div>

                        {/* Hub Remittance Verification Status */}
                        {pendingRiderDeposits.length > 0 ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenVerifyModal(pendingRiderDeposits[0])}
                            leftIcon={ShieldCheck}
                            className="text-xs font-bold shadow-card px-4 bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                          >
                            Verify HUB Deposit (₹{Number(pendingRiderDeposits[0].amount || (pendingRiderDeposits[0].amountPaise ? pendingRiderDeposits[0].amountPaise / 100 : 0)).toFixed(2)})
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Hub Deposits Verified</span>
                          </div>
                        )}
                      </div>

                      {/* Dashboard Metrics (Requirement: COD collect per day, total number of orders, orders completed, cash received) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Metric 1: Today's COD Cash */}
                        <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                          <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                            Today's COD Cash
                          </span>
                          <p className="text-lg font-heading font-extrabold text-forest-900 mt-1 font-mono">
                            ₹{todayCodCollected.toFixed(2)}
                          </p>
                          <span className="text-[10px] text-brandText-muted">Collected per day</span>
                        </div>

                        {/* Metric 2: Total Orders */}
                        <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                          <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                            Total Orders
                          </span>
                          <p className="text-lg font-heading font-extrabold text-forest-900 mt-1 font-mono">
                            {riderOrders.length}
                          </p>
                          <span className="text-[10px] text-brandText-muted">Assigned to rider</span>
                        </div>

                        {/* Metric 3: Orders Completed */}
                        <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                            Orders Completed
                          </span>
                          <p className="text-lg font-heading font-extrabold text-emerald-700 mt-1 font-mono">
                            {completedRiderOrders.length}
                          </p>
                          <span className="text-[10px] text-emerald-600 font-semibold">Delivered successfully</span>
                        </div>

                        {/* Metric 4: Cash Received from Rider */}
                        <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                          <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                            Cash Received
                          </span>
                          <p className="text-lg font-heading font-extrabold text-forest-900 mt-1 font-mono">
                            ₹{cashReceivedFromRider.toFixed(2)}
                          </p>
                          <span className="text-[10px] text-brandText-muted">Deposited / Remitted</span>
                        </div>
                      </div>

                      {/* Pending Cash In Hand Alert Banner */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-amber-900">
                              Current Pending Cash in Hand: ₹{pendingCashInHand.toFixed(2)}
                            </span>
                            <p className="text-[11px] text-amber-800">
                              Total COD Collected (₹{totalCodCollected.toFixed(2)}) minus Cash Received (₹{cashReceivedFromRider.toFixed(2)}).
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-extrabold text-sm text-amber-900">
                          ₹{pendingCashInHand.toFixed(2)}
                        </span>
                      </div>

                      {/* Orders List Below for this Rider (Requirement: list below of all the orders of them) */}
                      <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-card space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-heading font-bold text-sm text-forest-900">
                            Assigned Orders Ledger ({riderOrders.length})
                          </h3>
                          <span className="text-xs text-brandText-muted">Live dispatch synchronization</span>
                        </div>

                        <div className="border border-brandBorder-subtle rounded-2xl overflow-hidden overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-surface-warm text-brandText-secondary font-semibold border-b border-brandBorder-subtle">
                              <tr>
                                <th className="py-2.5 px-3">Order ID</th>
                                <th className="py-2.5 px-3">Customer & Area</th>
                                <th className="py-2.5 px-3">Payment</th>
                                <th className="py-2.5 px-3 text-right">COD Collected</th>
                                <th className="py-2.5 px-3 text-right">Order Amount</th>
                                <th className="py-2.5 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brandBorder-light bg-surface-pure">
                              {riderOrders.map((ord) => (
                                <tr key={ord.id} className="hover:bg-forest-50/40 transition-colors">
                                  <td className="py-2.5 px-3 font-mono font-bold text-forest-800">{ord.id}</td>
                                  <td className="py-2.5 px-3">
                                    <p className="font-bold text-forest-900">{ord.customerName}</p>
                                    <p className="text-[10px] text-brandText-muted">{ord.area || ord.address || 'Kolkata'}</p>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        ord.paymentMethod === 'COD'
                                          ? 'bg-amber-100 text-amber-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {ord.paymentMethod || 'COD'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-forest-900">
                                    {ord.paymentMethod === 'COD' && ord.status === 'DELIVERED'
                                      ? `₹${(ord.total || 0).toFixed(2)}`
                                      : '₹0.00'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-forest-900">
                                    ₹{(ord.total || 0).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <StatusBadge status={ord.status} />
                                  </td>
                                </tr>
                              ))}
                              {riderOrders.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="py-8 text-center text-xs text-brandText-muted">
                                    No orders assigned to this rider yet. Live dispatches will appear here.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-surface-pure rounded-3xl p-12 text-center border border-brandBorder-subtle">
                      <Bike className="w-10 h-10 text-brandText-muted mx-auto mb-2" />
                      <p className="text-xs text-brandText-secondary font-semibold">Select a rider to view their cash dashboard</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )
          )}

          {/* ------------------------------------------------------------ */}
          {/* 2. PHARMACY CASH WORKFLOW                                    */}
          {/* ------------------------------------------------------------ */}
          {cashWorkflowSubTab === 'pharmacies' && (
            (isLoadingEntities || isLoadingCashData) ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
                {/* Left Column Skeleton */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-28 bg-forest-100 rounded-md" />
                      <div className="h-3 w-16 bg-forest-50 rounded" />
                    </div>
                    <div className="h-8 bg-surface-warm rounded-xl border border-brandBorder-subtle" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-3 rounded-2xl border border-brandBorder-subtle space-y-2 bg-surface-pure">
                          <div className="flex items-center justify-between">
                            <div className="h-3.5 w-28 bg-forest-100 rounded" />
                            <div className="h-4 w-14 bg-forest-100/70 rounded-full" />
                          </div>
                          <div className="h-2.5 w-24 bg-forest-50 rounded" />
                          <div className="pt-2 border-t border-brandBorder-light flex items-center justify-between">
                            <div className="h-2.5 w-12 bg-forest-50 rounded" />
                            <div className="h-3 w-20 bg-forest-100 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column Skeleton */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="bg-surface-pure p-5 rounded-3xl border border-brandBorder-subtle shadow-card flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-forest-100/80 flex-shrink-0" />
                      <div className="space-y-2">
                        <div className="h-4 w-40 bg-forest-100 rounded" />
                        <div className="h-3 w-52 bg-forest-50 rounded" />
                      </div>
                    </div>
                    <div className="h-7 w-28 bg-forest-100 rounded-xl" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs space-y-2">
                        <div className="h-2.5 w-24 bg-forest-50 rounded" />
                        <div className="h-6 w-28 bg-forest-100 rounded" />
                        <div className="h-2 w-20 bg-forest-50 rounded" />
                      </div>
                    ))}
                  </div>

                  <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs space-y-3">
                    <div className="h-3 w-36 bg-forest-100 rounded" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 bg-surface-warm rounded-xl space-y-1.5">
                          <div className="h-2.5 w-16 bg-forest-50 rounded" />
                          <div className="h-4 w-20 bg-forest-100 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-40 bg-forest-100 rounded" />
                      <div className="h-3 w-28 bg-forest-50 rounded" />
                    </div>
                    <div className="space-y-2 pt-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 bg-surface-warm/70 rounded-xl flex items-center justify-between px-3">
                          <div className="h-3 w-16 bg-forest-100 rounded" />
                          <div className="h-3 w-20 bg-forest-100 rounded" />
                          <div className="h-3 w-12 bg-forest-50 rounded" />
                          <div className="h-3 w-16 bg-forest-100 rounded" />
                          <div className="h-3 w-14 bg-forest-100/70 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (4 cols): Pharmacy Selector List */}
              <div className="lg:col-span-4 space-y-3">
                <div className="bg-surface-pure rounded-3xl p-4 border border-brandBorder-subtle shadow-card space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-forest-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-forest-700" />
                      <span>Pharmacies ({pharmacies.length})</span>
                    </h3>
                    <span className="text-[10px] text-brandText-muted">Select store</span>
                  </div>

                  {/* Pharmacy Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brandText-muted" />
                    <input
                      type="text"
                      value={pharmacySearchQuery}
                      onChange={(e) => setPharmacySearchQuery(e.target.value)}
                      placeholder="Search pharmacy by name, city..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                    />
                  </div>

                  {/* Pharmacy List */}
                  <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
                    {pharmacies
                      .filter((p) => {
                        const q = pharmacySearchQuery.toLowerCase();
                        return (
                          (p.name || '').toLowerCase().includes(q) ||
                          (p.city || '').toLowerCase().includes(q) ||
                          (p.licenseNumber || '').toLowerCase().includes(q)
                        );
                      })
                      .map((p) => {
                        const isSelected = activePharmacyId === p.id;
                        const pOrders = allOrders.filter(
                          (o) =>
                            o.pharmacyId === p.id ||
                            (p.name && o.pharmacyName?.toLowerCase() === p.name?.toLowerCase())
                        );
                        const pGmv = pOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                        return (
                          <div
                            key={p.id}
                            onClick={() => setActivePharmacyId(p.id)}
                            className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                              isSelected
                                ? 'bg-forest-50/90 border-forest-400 shadow-sm'
                                : 'bg-surface-pure hover:bg-forest-50/40 border-brandBorder-subtle'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-xs text-forest-900">{p.name}</p>
                              <StatusBadge status={p.status || 'ACTIVE'} />
                            </div>
                            <p className="text-[11px] text-brandText-secondary mt-0.5">{p.city || 'Kolkata'} &bull; {p.phone || 'Store'}</p>
                            <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-brandBorder-light">
                              <span className="text-brandText-muted">{pOrders.length} orders</span>
                              <span className="font-mono font-bold text-forest-800">Sales: ₹{pGmv.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    {pharmacies.length === 0 && (
                      <p className="text-xs text-brandText-muted text-center py-6">No pharmacies registered in network.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (8 cols): Pharmacy Sales & Extra Charges Dashboard */}
              <div className="lg:col-span-8 space-y-5">
                {selectedPharmacyObj ? (
                  <>
                    {/* Pharmacy Header Banner */}
                    <div className="bg-surface-pure p-5 rounded-3xl border border-brandBorder-subtle shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700 flex-shrink-0">
                          {selectedPharmacyObj.imageUrl ? (
                            <img
                              src={selectedPharmacyObj.imageUrl}
                              alt="Store"
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            <Building2 className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-heading font-extrabold text-forest-900">
                              {selectedPharmacyObj.name}
                            </h2>
                            <StatusBadge status={selectedPharmacyObj.status || 'ACTIVE'} />
                          </div>
                          <p className="text-xs text-brandText-secondary mt-0.5">
                            {selectedPharmacyObj.line1 || 'Main Street'}, {selectedPharmacyObj.city || 'Kolkata'} &bull; Lic: {selectedPharmacyObj.licenseNumber || 'WB-DL-Reg'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-forest-50 text-forest-800 font-bold text-xs border border-forest-100">
                          {pharmacyOrders.length} Orders Fulfilled
                        </span>
                      </div>
                    </div>

                    {/* KPI Dashboard (Requirement: per day sales, total amount of sales, extra charges like delivery, packaging, platform fee) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Metric 1: Per Day Sales */}
                      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                        <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                          Per Day Sales (Today)
                        </span>
                        <p className="text-xl font-heading font-extrabold text-forest-900 mt-1 font-mono">
                          ₹{perDaySales.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-brandText-muted">
                          {todayPharmacyOrders.length} orders billed today
                        </span>
                      </div>

                      {/* Metric 2: Total Amount of Sales */}
                      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                        <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                          Total Amount of Sales
                        </span>
                        <p className="text-xl font-heading font-extrabold text-forest-900 mt-1 font-mono">
                          ₹{totalSalesAmount.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          All-time fulfilled GMV
                        </span>
                      </div>

                      {/* Metric 3: Total Extra Charges */}
                      <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs">
                        <span className="text-[10px] font-bold text-brandText-secondary uppercase tracking-wider block">
                          Total Extra Charges
                        </span>
                        <p className="text-xl font-heading font-extrabold text-forest-900 mt-1 font-mono">
                          ₹{totalExtraCharges.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-brandText-muted">
                          Platform, packing & delivery
                        </span>
                      </div>
                    </div>

                    {/* Extra Charges Breakdown Detail Card */}
                    <div className="bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-xs space-y-2">
                      <h4 className="text-xs font-bold text-forest-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-forest-700" />
                        <span>Extra Charges Breakdown Summary</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                        <div className="p-2.5 rounded-xl bg-forest-50/60 border border-forest-100">
                          <span className="text-[10px] text-brandText-secondary block">Delivery Charges</span>
                          <p className="font-mono font-bold text-sm text-forest-900">₹{totalDeliveryCharges.toFixed(2)}</p>
                          <span className="text-[9px] text-brandText-muted">&lt; ₹499: ₹30 | &gt; ₹499: Free</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-forest-50/60 border border-forest-100">
                          <span className="text-[10px] text-brandText-secondary block">Packaging Fees</span>
                          <p className="font-mono font-bold text-sm text-forest-900">₹{totalPackagingCharges.toFixed(2)}</p>
                          <span className="text-[9px] text-brandText-muted">Fixed ₹6 per order</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-forest-50/60 border border-forest-100">
                          <span className="text-[10px] text-brandText-secondary block">Platform Fees</span>
                          <p className="font-mono font-bold text-sm text-forest-900">₹{totalPlatformCharges.toFixed(2)}</p>
                          <span className="text-[9px] text-brandText-muted">Tiered ₹9 - ₹30 per order</span>
                        </div>
                      </div>
                    </div>

                    {/* Orders List for this Pharmacy (Requirement: show the list of orders from that pharmacy) */}
                    <div className="bg-surface-pure rounded-3xl p-5 border border-brandBorder-subtle shadow-card space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-heading font-bold text-sm text-forest-900">
                          Pharmacy Orders Ledger ({pharmacyOrders.length})
                        </h3>
                        <span className="text-xs text-brandText-muted">Detailed billing & extra fees</span>
                      </div>

                      <div className="border border-brandBorder-subtle rounded-2xl overflow-hidden overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-surface-warm text-brandText-secondary font-semibold border-b border-brandBorder-subtle">
                            <tr>
                              <th className="py-2.5 px-3">Order ID</th>
                              <th className="py-2.5 px-3">Customer</th>
                              <th className="py-2.5 px-3 text-right">Subtotal</th>
                              <th className="py-2.5 px-3 text-right">Extra Charges</th>
                              <th className="py-2.5 px-3 text-right">Total Bill</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brandBorder-light bg-surface-pure">
                            {pharmacyOrders.map((ord) => {
                              const bill = calculateOrderBill({
                                items: ord.items || [],
                                customSubtotal: ord.subtotal || ord.total,
                                deliveryFee: ord.deliveryFee,
                              });
                              const pkg = ord.packagingFee !== undefined ? ord.packagingFee : bill.packagingFee;
                              const plt = ord.platformFee !== undefined ? ord.platformFee : bill.platformFee;
                              const del = ord.deliveryFee !== undefined ? ord.deliveryFee : bill.deliveryFee;

                              return (
                                <tr key={ord.id} className="hover:bg-forest-50/40 transition-colors">
                                  <td className="py-2.5 px-3 font-mono font-bold text-forest-800">{ord.id}</td>
                                  <td className="py-2.5 px-3">
                                    <p className="font-bold text-forest-900">{ord.customerName}</p>
                                    <p className="text-[10px] text-brandText-muted">
                                      {ord.items?.length || 1} items &bull; {ord.paymentMethod || 'COD'}
                                    </p>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-brandText-secondary">
                                    ₹{(ord.subtotal || bill.subtotal).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono">
                                    <div className="text-[10px] text-brandText-muted">
                                      Pkg: ₹{pkg} | Plt: ₹{plt} | Del: {del > 0 ? `₹${del}` : 'FREE'}
                                    </div>
                                    <span className="font-bold text-forest-800">
                                      +₹{(pkg + plt + del).toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-extrabold text-forest-900">
                                    ₹{(ord.total || bill.finalTotal).toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <StatusBadge status={ord.status} />
                                  </td>
                                </tr>
                              );
                            })}
                            {pharmacyOrders.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-xs text-brandText-muted">
                                  No orders dispatched to this pharmacy yet. Dispatched orders will appear here automatically.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-surface-pure rounded-3xl p-12 text-center border border-brandBorder-subtle">
                    <Building2 className="w-10 h-10 text-brandText-muted mx-auto mb-2" />
                    <p className="text-xs text-brandText-secondary font-semibold">Select a pharmacy to view its sales & extra charges</p>
                  </div>
                )}
              </div>
            </div>
            )
          )}

          {/* Admin Password Verification Modal for HUB Deposit */}
          {isVerifyModalOpen && targetDepositForVerify && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm"
                onClick={() => {
                  if (!isVerifyingPassword) {
                    setIsVerifyModalOpen(false);
                    setTargetDepositForVerify(null);
                  }
                }}
              />
              <div className="min-h-full flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-surface-pure rounded-3xl p-6 shadow-floating border border-brandBorder-subtle text-left relative animate-scale-up space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-heading font-extrabold text-base text-forest-900">
                          Verify Rider HUB Deposit
                        </h3>
                        <p className="text-[11px] text-brandText-secondary">
                          Super Admin authorization & password verification
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!isVerifyingPassword) {
                          setIsVerifyModalOpen(false);
                          setTargetDepositForVerify(null);
                        }
                      }}
                      className="p-1.5 text-brandText-muted hover:text-forest-700 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary of Deposit */}
                  <div className="p-3.5 bg-surface-warm rounded-2xl border border-brandBorder-subtle space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-brandText-secondary">Rider:</span>
                      <strong className="text-forest-900">
                        {targetDepositForVerify.rider?.fullName || targetDepositForVerify.riderName || 'Rider'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brandText-secondary">Deposit Slip Ref:</span>
                      <span className="font-mono font-bold text-forest-800">
                        {targetDepositForVerify.referenceNo || targetDepositForVerify.depositId || targetDepositForVerify.id}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-brandBorder-light">
                      <span className="font-bold text-forest-900">Amount to Deduct:</span>
                      <span className="font-mono font-extrabold text-base text-emerald-700">
                        ₹{Number(targetDepositForVerify.amount || (targetDepositForVerify.amountPaise ? targetDepositForVerify.amountPaise / 100 : 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleConfirmVerifyDeposit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-forest-900 mb-1.5">
                        Enter Super Admin Password *
                      </label>
                      <input
                        type="password"
                        required
                        autoFocus
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        placeholder="Enter your Admin password"
                        className="w-full px-3.5 py-2.5 text-sm bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-mono"
                      />
                      <p className="text-[11px] text-brandText-muted mt-1">
                        Once verified with your password, this deposit changes to <strong>Verified</strong> and is permanently deducted from the rider's physical cash in hand.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isVerifyingPassword}
                        onClick={() => {
                          setIsVerifyModalOpen(false);
                          setTargetDepositForVerify(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isVerifyingPassword || !adminPasswordInput.trim()}
                        className="font-bold shadow-card px-5 bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        {isVerifyingPassword ? 'Verifying...' : 'Authorize & Deduct Cash'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW B: SETTLEMENTS & WALLET (MONTHLY PLATFORM LEDGERS)        */}
      {/* ============================================================== */}
      {mainTab === 'settlements' && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Required: Pending Rider Withdrawal Verifications Section */}
          {pendingWithdrawals.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-emerald-50/90 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-card space-y-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shadow-xs flex-shrink-0">
                    <KeyRound className="w-5 h-5 text-amber-900 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base text-forest-950 flex items-center gap-2">
                      <span>Pending Rider Withdrawal Verifications</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold border border-amber-300">
                        {pendingWithdrawals.length} Action Required
                      </span>
                    </h3>
                    <p className="text-xs text-brandText-secondary mt-0.5">
                      Riders submitted payout requests from their earnings. Super Admin password verification is required to authorize each disbursal.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {pendingWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 bg-surface-pure rounded-2xl border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-forest-900">
                          {w.rider?.fullName || w.riderName || 'Rider'}
                        </span>
                        <span className="font-mono text-[11px] text-brandText-secondary">
                          {w.rider?.phone || w.riderPhone || ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-800 font-extrabold text-base">
                          ₹{Number(w.amount || 0).toFixed(2)}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-warm border border-brandBorder-subtle text-forest-800">
                          {w.paymentMethod}
                        </span>
                      </div>
                      <span className="text-[10px] text-brandText-secondary block font-mono">
                        ID: {w.id} &bull; {w.requestedAt ? new Date(w.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : w.time}
                        {w.upiId && ` &bull; UPI: ${w.upiId}`}
                      </span>
                      {w.note && (
                        <p className="text-[10px] text-brandText-muted italic">{w.note}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleOpenVerifyWithdrawal(w)}
                        leftIcon={ShieldCheck}
                        className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 shadow-xs"
                      >
                        Verify Payout
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleRejectWithdrawal(w)}
                        className="px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month Selector Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-pure p-4 rounded-2xl border border-brandBorder-subtle shadow-card">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest-700" />
              <span className="text-xs font-bold text-forest-800">Monthly Billing Cycle:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-bold text-forest-900 bg-surface-warm px-3 py-1.5 rounded-xl border border-brandBorder-subtle focus:outline-none focus:border-forest-500"
              >
                <option value="2026-11">November 2026 (Current Cycle)</option>
                <option value="2026-10">October 2026</option>
                <option value="2026-09">September 2026</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
                Platform Gross Reconciliation
              </span>
              <button
                type="button"
                onClick={() => loadSettlementsData(selectedMonth)}
                title="Refresh settlements"
                className="p-1.5 rounded-xl border border-brandBorder-subtle text-brandText-secondary hover:text-forest-800 hover:bg-forest-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSettlements ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Smooth Transition Loader Skeleton for Settlements & Wallet */}
          {isLoadingSettlements ? (
            <div className="space-y-6 animate-pulse">
              {/* 3 Metric Cards Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 w-32 bg-forest-100 rounded" />
                      <div className="w-9 h-9 rounded-2xl bg-forest-100/70" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 w-28 bg-forest-100 rounded-md" />
                      <div className="h-3 w-48 bg-forest-50 rounded" />
                    </div>
                    <div className="pt-3 border-t border-brandBorder-subtle flex items-center justify-between">
                      <div className="h-4 w-16 bg-forest-100/60 rounded-full" />
                      <div className="h-3 w-28 bg-forest-50 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Skeleton */}
              <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="h-5 w-56 bg-forest-100 rounded" />
                    <div className="h-3 w-72 bg-forest-50 rounded" />
                  </div>
                  <div className="h-6 w-28 bg-forest-100/70 rounded-full" />
                </div>
                <div className="h-10 bg-surface-warm rounded-xl border border-brandBorder-subtle" />
                <div className="space-y-2 pt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-surface-warm/60 rounded-xl flex items-center justify-between px-4">
                      <div className="space-y-1">
                        <div className="h-3.5 w-28 bg-forest-100 rounded" />
                        <div className="h-2.5 w-20 bg-forest-50 rounded" />
                      </div>
                      <div className="h-3 w-20 bg-forest-50 rounded" />
                      <div className="h-3.5 w-16 bg-forest-100 rounded" />
                      <div className="h-3.5 w-20 bg-forest-100 rounded" />
                      <div className="h-3.5 w-16 bg-emerald-100 rounded" />
                      <div className="h-3.5 w-16 bg-amber-100 rounded" />
                      <div className="h-6 w-20 bg-forest-100/80 rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* KPI Cards: Orders per month & Amounts received with last month relation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card 1: Total Orders per Month */}
                <div className="bg-surface-pure rounded-3xl p-5 sm:p-6 border border-brandBorder-subtle shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brandText-secondary uppercase tracking-wider">
                      Total Orders Per Month
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900">
                      {currentMetrics.totalOrders.toLocaleString('en-IN')}
                    </h2>
                    <p className="text-xs text-brandText-muted mt-0.5">
                      Across Kolkata, Durgapur & Hooghly corridors
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-brandBorder-subtle flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{currentMetrics.orderGrowth}%</span>
                    </span>
                    <span className="text-brandText-secondary text-[11px]">
                      vs {currentMetrics.lastMonthOrders.toLocaleString('en-IN')} last month
                    </span>
                  </div>
                </div>

                {/* Card 2: Total Amount Received in Month */}
                <div className="bg-surface-pure rounded-3xl p-5 sm:p-6 border border-brandBorder-subtle shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brandText-secondary uppercase tracking-wider">
                      Total Amounts Received
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900">
                      ₹{currentMetrics.totalAmountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-brandText-muted mt-0.5">
                      Net collected order GMV for {currentMetrics.monthLabel}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-brandBorder-subtle flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>+{currentMetrics.revenueGrowth}%</span>
                    </span>
                    <span className="text-brandText-secondary text-[11px]">
                      vs ₹{currentMetrics.lastMonthAmountReceived.toLocaleString('en-IN')} last month
                    </span>
                  </div>
                </div>

                {/* Card 3: Monthly Riders Settlements (Total, Given, Due) */}
                <div className="bg-surface-pure rounded-3xl p-5 sm:p-6 border border-brandBorder-subtle shadow-card flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brandText-secondary uppercase tracking-wider">
                      Riders Monthly Settlements
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                      <Bike className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-forest-900">
                      ₹{currentMetrics.riderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-brandText-muted mt-0.5">
                      Total monthly rider delivery disbursement (₹30/order)
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-brandBorder-subtle grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-brandText-secondary uppercase block">Given (Paid)</span>
                      <p className="font-bold text-emerald-700">
                        ₹{currentMetrics.riderGiven.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-brandText-secondary uppercase block">Due Balance</span>
                      <p className="font-extrabold text-amber-700">
                        ₹{currentMetrics.riderDue.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Riders Payment Details Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-heading font-bold text-forest-900">
                      Rider Fleet Monthly Earnings & Payment Status
                    </h3>
                    <p className="text-xs text-brandText-secondary">
                      Monthly breakdown of rider delivery incentives (₹30/order), disbursed amounts, and outstanding dues.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-forest-700 bg-forest-50 px-3 py-1 rounded-full border border-forest-100">
                    {ridersPayments.length} Active Riders
                  </span>
                </div>

                <DataTable
                  columns={riderColumns}
                  data={ridersPayments}
                  searchKey="name"
                  searchPlaceholder="Search rider by name, phone, or vehicle number..."
                />
              </div>
            </>
          )}

          {/* SUPER ADMIN PASSWORD VERIFICATION MODAL FOR RIDER WITHDRAWALS */}
          {isVerifyWithdrawalModalOpen && targetWithdrawalForVerify && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity"
                onClick={() => {
                  if (!isVerifyingWithdrawal) {
                    setIsVerifyWithdrawalModalOpen(false);
                    setTargetWithdrawalForVerify(null);
                  }
                }}
              />
              <div className="min-h-full flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-surface-pure rounded-3xl p-6 shadow-floating border border-brandBorder-subtle text-left relative animate-scale-up space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brandBorder-subtle">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800">
                        <KeyRound className="w-5 h-5 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="font-heading font-extrabold text-base text-forest-900">
                          Verify Rider Withdrawal Payout
                        </h3>
                        <p className="text-[11px] text-brandText-secondary">
                          Super Admin password authorization required
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!isVerifyingWithdrawal) {
                          setIsVerifyWithdrawalModalOpen(false);
                          setTargetWithdrawalForVerify(null);
                        }
                      }}
                      className="p-1.5 text-brandText-muted hover:text-forest-700 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary of Withdrawal */}
                  <div className="p-3.5 bg-surface-warm rounded-2xl border border-brandBorder-subtle space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-brandText-secondary">Rider:</span>
                      <strong className="text-forest-900">
                        {targetWithdrawalForVerify.rider?.fullName || targetWithdrawalForVerify.riderName || 'Rider'}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-brandText-secondary">Payout Channel:</span>
                      <span className="font-bold text-forest-900">
                        {targetWithdrawalForVerify.paymentMethod}
                      </span>
                    </div>
                    {targetWithdrawalForVerify.upiId && (
                      <div className="flex justify-between">
                        <span className="text-brandText-secondary">Target UPI:</span>
                        <span className="font-mono text-forest-800 font-bold">
                          {targetWithdrawalForVerify.upiId}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-brandBorder-light">
                      <span className="font-bold text-forest-900">Amount to Disburse:</span>
                      <span className="font-mono font-extrabold text-base text-emerald-700">
                        ₹{Number(targetWithdrawalForVerify.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleConfirmVerifyWithdrawal} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-forest-900 mb-1.5">
                        Disbursal Reference No. (Optional)
                      </label>
                      <input
                        type="text"
                        value={withdrawalRefNo}
                        onChange={(e) => setWithdrawalRefNo(e.target.value)}
                        placeholder="e.g. UPI/REF-123456 or CASH-VOUCHER"
                        className="w-full px-3.5 py-2 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl font-mono focus:outline-none focus:border-forest-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-forest-900 mb-1.5 flex items-center justify-between">
                        <span>Enter Super Admin Password *</span>
                        <span className="text-[10px] text-brandText-muted font-normal">Security check</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-brandText-muted" />
                        <input
                          type="password"
                          required
                          autoFocus
                          value={withdrawalAdminPassword}
                          onChange={(e) => setWithdrawalAdminPassword(e.target.value)}
                          placeholder="Enter your Super Admin password"
                          className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-brandText-muted mt-1">
                        Verifying with your password completes the disbursal, releases the held funds, and marks this withdrawal as <strong>Verified & Disbursed</strong>.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isVerifyingWithdrawal}
                        onClick={() => {
                          setIsVerifyWithdrawalModalOpen(false);
                          setTargetWithdrawalForVerify(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isVerifyingWithdrawal || !withdrawalAdminPassword.trim()}
                        className="font-bold shadow-card px-5 bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        {isVerifyingWithdrawal ? 'Verifying...' : 'Authorize & Disburse'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: DAILY PAYMENT DETAILS FOR CLICKED RIDER */}
          {selectedRider && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div
                className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm transition-opacity"
                onClick={() => {
                  setSelectedRider(null);
                  setIsDisbursing(false);
                }}
              />
              <div className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center">
                <div className="w-full max-w-3xl bg-surface-pure rounded-3xl p-5 sm:p-7 shadow-floating border border-brandBorder-subtle text-left relative overflow-hidden animate-scale-up my-6 space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-brandBorder-subtle">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-center text-forest-700">
                        <Bike className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-heading font-extrabold text-forest-900">
                            {selectedRider.name}
                          </h2>
                          <StatusBadge status={selectedRider.status} />
                        </div>
                        <p className="text-xs text-brandText-secondary">
                          {selectedRider.phone} &bull; {selectedRider.vehicle} &bull; UPI: {selectedRider.upiId}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRider(null);
                        setIsDisbursing(false);
                      }}
                      className="p-1.5 text-brandText-secondary hover:text-forest-700 hover:bg-forest-50 rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Rider Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
                      <span className="text-[11px] font-semibold text-brandText-secondary block">
                        Total Monthly Earning
                      </span>
                      <p className="text-lg font-heading font-extrabold text-forest-900 mt-0.5">
                        ₹{Number(selectedRider.totalEarning || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-brandText-muted">
                        {selectedRider.monthDeliveries} deliveries
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                      <span className="text-[11px] font-semibold text-emerald-800 block">
                        Given (Disbursed)
                      </span>
                      <p className="text-lg font-heading font-extrabold text-emerald-700 mt-0.5">
                        ₹{Number(selectedRider.givenAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-emerald-600">Settled to bank/UPI</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
                      <span className="text-[11px] font-semibold text-amber-800 block">
                        Outstanding Due
                      </span>
                      <p className="text-lg font-heading font-extrabold text-amber-700 mt-0.5">
                        ₹{Number(selectedRider.dueAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <span className="text-[10px] text-amber-600">Awaiting disbursement</span>
                    </div>
                  </div>

                  {/* Disburse Action Trigger */}
                  {selectedRider.dueAmount > 0 && !isDisbursing && (
                    <div className="p-3.5 rounded-2xl bg-forest-50 border border-forest-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-forest-900">
                          Pending payout of ₹{Number(selectedRider.dueAmount).toLocaleString('en-IN')} available
                        </p>
                        <p className="text-[11px] text-brandText-secondary">
                          Transfer funds to registered UPI ID ({selectedRider.upiId})
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsDisbursing(true)}
                        className="text-xs font-bold shadow-card px-4"
                      >
                        Disburse Due Balance
                      </Button>
                    </div>
                  )}

                  {/* Inline Disburse Form */}
                  {isDisbursing && (
                    <form
                      onSubmit={handleDisbursePayment}
                      className="p-4 bg-forest-50/90 border border-forest-200 rounded-2xl space-y-3 animate-fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-forest-900 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-forest-700" />
                          <span>Execute Rider Disbursal</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsDisbursing(false)}
                          className="text-xs text-brandText-secondary hover:underline"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-brandText-main mb-1">
                            Disbursement Amount (₹) *
                          </label>
                          <input
                            type="number"
                            required
                            max={selectedRider.dueAmount}
                            min={1}
                            value={disburseAmount}
                            onChange={(e) => setDisburseAmount(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-bold text-forest-900 bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-brandText-main mb-1">
                            Bank / UPI Reference No.
                          </label>
                          <input
                            type="text"
                            value={disburseNote}
                            onChange={(e) => setDisburseNote(e.target.value)}
                            placeholder="e.g. UPI/6391104820"
                            className="w-full px-3 py-2 text-xs font-mono bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          className="text-xs font-bold shadow-card px-5"
                        >
                          Confirm Payout of ₹{Number(disburseAmount || selectedRider.dueAmount).toLocaleString('en-IN')}
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Daily Payment Breakdown Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-forest-900 uppercase tracking-wider">
                        Daily Payment & Delivery Breakdown ({selectedRider.dailyBreakdown?.length || 0} days recorded)
                      </h4>
                      <span className="text-[11px] text-brandText-secondary">
                        Rate: ₹30 per successful delivery
                      </span>
                    </div>

                    <div className="border border-brandBorder-subtle rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-surface-warm/80 text-brandText-secondary font-semibold border-b border-brandBorder-subtle sticky top-0 bg-surface-warm">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3 text-right">Deliveries Done</th>
                            <th className="py-2.5 px-3 text-right">COD Collected</th>
                            <th className="py-2.5 px-3 text-right">Daily Payout</th>
                            <th className="py-2.5 px-3">Payment Status</th>
                            <th className="py-2.5 px-3 text-right">Reference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brandBorder-light bg-surface-pure">
                          {(selectedRider.dailyBreakdown || []).map((day, idx) => (
                            <tr key={idx} className="hover:bg-forest-50/40 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-forest-900">{day.date}</td>
                              <td className="py-2.5 px-3 text-right font-medium">{day.deliveries} orders</td>
                              <td className="py-2.5 px-3 text-right font-mono text-brandText-secondary">
                                ₹{Number(day.codCollected || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-forest-900">
                                ₹{Number(day.dailyEarning || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    day.status === 'PAID'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {day.status === 'PAID' ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-amber-600" />
                                  )}
                                  <span>{day.status}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[11px] text-brandText-muted">
                                {day.ref}
                              </td>
                            </tr>
                          ))}
                          {(!selectedRider.dailyBreakdown || selectedRider.dailyBreakdown.length === 0) && (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-xs text-brandText-muted">
                                No daily breakdown records found for this rider in {currentMetrics.monthLabel}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRider(null);
                        setIsDisbursing(false);
                      }}
                      className="text-xs"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFinancePage;
