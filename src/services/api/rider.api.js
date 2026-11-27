/**
 * Oshud Wala — Rider Ecosystem API & Finance Synchronizer
 * Handles real rider profile management, dynamic COD collections,
 * per-day & monthly earnings metrics, camera QR verification, and SuperAdmin synced payouts.
 */

import apiClient, { tokenStorage } from './client';
import { accountRegistry } from './accountRegistry';
import workspaceStore from '../workspace/workspaceStore';

const RIDER_FINANCE_STORAGE_KEY = 'oshud_rider_finance_data_v1';
const RIDER_PROFILE_STORAGE_KEY_PREFIX = 'oshud_rider_profile_';

// Default Male / Female Courier Avatars based on gender (human illustration, not robots)
export const getRiderAvatar = (gender = 'male', customPic = null) => {
  if (customPic && customPic.trim()) return customPic.trim();
  const cleanGender = (gender || 'male').toLowerCase();
  if (cleanGender === 'female') {
    return '/avatars/female-rider.svg';
  }
  return '/avatars/male-rider.svg';
};

export const getRiderBotAvatar = getRiderAvatar;

// Helper to get finance data from persistent storage
const loadFinanceStore = () => {
  try {
    const raw = localStorage.getItem(RIDER_FINANCE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading rider finance storage:', e);
  }
  return {
    riders: {},
    withdrawals: [],
    codTransactions: [],
  };
};

const saveFinanceStore = (data) => {
  try {
    localStorage.setItem(RIDER_FINANCE_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('oshud_rider_finance_updated', { detail: data }));
  } catch (e) {
    console.warn('Error saving rider finance storage:', e);
  }
};

export const riderApi = {
  /**
   * Get rider profile combining backend user session, account registry and persistent local store
   */
  getRiderProfile(riderId, fallbackUser = null) {
    const targetId = riderId || fallbackUser?.id || 'usr-rider-01';
    let stored = null;
    try {
      const raw = localStorage.getItem(`${RIDER_PROFILE_STORAGE_KEY_PREFIX}${targetId}`);
      if (raw) stored = JSON.parse(raw);
    } catch {}

    // Check account registry
    const registryAccount = accountRegistry.findAccount(targetId) ||
      accountRegistry.getAccounts().find((a) => a.role === 'RIDER' && a.id === targetId);

    const baseName = stored?.name || stored?.fullName || registryAccount?.fullName || fallbackUser?.fullName || fallbackUser?.name || 'Rahul Das';
    const basePhone = stored?.phone || registryAccount?.phone || fallbackUser?.phone || '+91 98304 55667';
    const baseEmail = stored?.email || registryAccount?.email || fallbackUser?.email || 'rider@oshudwala.com';
    const gender = stored?.gender || registryAccount?.entityData?.gender || 'male';
    const customPic = stored?.avatar || registryAccount?.entityData?.avatar || null;

    return {
      id: targetId,
      name: baseName,
      fullName: baseName,
      phone: basePhone,
      email: baseEmail,
      gender,
      avatar: getRiderBotAvatar(gender, customPic),
      customPic: customPic || '',
      address: stored?.address || registryAccount?.entityData?.address || 'Salt Lake Sector V, Kolkata, WB - 700091',
      zone: stored?.zone || registryAccount?.entityData?.zone || 'Kolkata South & Salt Lake',
      vehicleType: stored?.vehicleType || registryAccount?.entityData?.vehicleType || 'Electric Two-Wheeler (Hero Optima)',
      vehicleNumber: stored?.vehicleNumber || registryAccount?.entityData?.vehicleNumber || 'WB-02-AZ-4921',
      licenseNumber: stored?.licenseNumber || registryAccount?.entityData?.licenseNumber || 'DL-WB-2022-998124',
      isOnline: stored?.isOnline ?? true,
      upiId: stored?.upiId || `${basePhone.replace(/[^0-9]/g, '').slice(-10)}@upi`,
      bankAccount: stored?.bankAccount || 'State Bank of India • A/C: 4892019948 • IFSC: SBIN0001234',
    };
  },

  /**
   * Update and persist rider profile details
   */
  async updateRiderProfile(riderId, profileData) {
    const targetId = riderId || profileData?.id || 'usr-rider-01';
    const existing = this.getRiderProfile(targetId);
    const updated = {
      ...existing,
      ...profileData,
      avatar: getRiderBotAvatar(profileData.gender || existing.gender, profileData.customPic || profileData.avatar),
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`${RIDER_PROFILE_STORAGE_KEY_PREFIX}${targetId}`, JSON.stringify(updated));

      // Sync account registry
      accountRegistry.registerAccount({
        id: targetId,
        fullName: updated.name,
        email: updated.email,
        phone: updated.phone,
        password: 'password123',
        role: 'RIDER',
        entityData: {
          gender: updated.gender,
          vehicleType: updated.vehicleType,
          vehicleNumber: updated.vehicleNumber,
          licenseNumber: updated.licenseNumber,
          address: updated.address,
          zone: updated.zone,
          avatar: updated.customPic,
        },
      });

      // Also try backend update
      await apiClient.put('/users/profile', {
        fullName: updated.name,
        email: updated.email,
      }).catch(() => {});

      window.dispatchEvent(new CustomEvent('oshud_rider_profile_updated', { detail: updated }));
    } catch (e) {
      console.warn('Error saving rider profile:', e);
    }

    return updated;
  },

  /**
   * Calculate live per-day and monthly metrics from original orders & completed deliveries
   */
  getRiderMetrics(riderId, fallbackUser = null) {
    const targetId = riderId || fallbackUser?.id || 'usr-rider-01';
    const wsState = workspaceStore.getState();
    const allOrders = wsState.orders || [];

    // All orders assigned to this rider or delivered
    const riderOrders = allOrders.filter(
      (o) =>
        o.assignedRider?.id === targetId ||
        (o.assignedRider?.name && fallbackUser?.name && o.assignedRider.name.toLowerCase().includes(fallbackUser.name.toLowerCase())) ||
        (o.assignedRider?.phone && fallbackUser?.phone && o.assignedRider.phone.replace(/[^0-9]/g, '') === fallbackUser.phone.replace(/[^0-9]/g, ''))
    );

    const completedOrders = riderOrders.filter((o) => o.status === 'DELIVERED');
    const activeOrders = riderOrders.filter((o) => ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(o.status));

    // Calculate Today's figures
    const todayDateStr = new Date().toDateString();
    const todayCompleted = completedOrders.filter((o) => {
      if (!o.createdAt) return true;
      return new Date(o.createdAt).toDateString() === todayDateStr;
    });

    const deliveriesToday = todayCompleted.length;
    const totalAmountDeliveredToday = todayCompleted.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    // Earning per delivery: Exactly ₹30 per delivered order
    const earningsToday = deliveriesToday * 30;

    // Monthly figures: adding everyday earnings (₹30 per delivered order)
    const monthCompleted = completedOrders;
    const totalDeliveriesMonth = monthCompleted.length;
    const monthlyTotalAmount = monthCompleted.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const monthlyTotalEarnings = totalDeliveriesMonth * 30;

    // Finance store for cash & withdrawals
    const financeStore = loadFinanceStore();
    const riderFinance = financeStore.riders[targetId] || {
      cashInHand: 0,
      cashDeposited: 0,
      withdrawableBalance: monthlyTotalEarnings,
      totalWithdrawn: 0,
    };

    // Calculate actual COD cash in hand from completed COD orders (strictly COD, never UPI or ONLINE)
    const completedCodOrders = completedOrders.filter((o) => {
      const pm = (o.paymentMethod || '').trim().toUpperCase();
      return pm === 'COD';
    });
    const totalCodCollected = completedCodOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    // Only verified cash deposits reduce Physical Cash in Hand
    const verifiedDepositedAmount = (riderFinance.verifiedCashDeposited !== undefined)
      ? Number(riderFinance.verifiedCashDeposited)
      : (Number(riderFinance.cashDeposited || 0));
    const actualCashInHand = Math.max(0, totalCodCollected - verifiedDepositedAmount);

    // Calculate actual withdrawable balance (total earnings minus all approved withdrawals/disbursements)
    const riderWithdrawals = financeStore.withdrawals.filter(
      (w) =>
        w.riderId === targetId ||
        (targetId === 'usr-rider-01' && w.riderId === 'rider-01') ||
        (targetId === 'rider-01' && w.riderId === 'usr-rider-01') ||
        (targetId === 'usr-rider-02' && w.riderId === 'rider-02') ||
        (targetId === 'rider-02' && w.riderId === 'usr-rider-02')
    );
    const totalWithdrawnAmount = riderWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
    const actualWithdrawable = Math.max(0, monthlyTotalEarnings - totalWithdrawnAmount);

    return {
      deliveriesToday,
      totalAmountDeliveredToday,
      earningsToday,
      totalDeliveriesMonth,
      monthlyTotalAmount,
      monthlyTotalEarnings,
      activeOrders,
      completedOrders,
      cashInHand: actualCashInHand,
      cashDeposited: riderFinance.cashDeposited || 0,
      withdrawableBalance: actualWithdrawable,
      totalWithdrawn: totalWithdrawnAmount,
      withdrawals: riderWithdrawals,
      codTransactions: completedCodOrders.map((o) => ({
        id: `COD-${o.id}`,
        orderId: o.orderNumber || o.id,
        customerName: o.customerName || 'Registered Patient',
        amount: Number(o.total || 0),
        time: o.timeline?.find((t) => t.status.toLowerCase().includes('delivered'))?.time || new Date(o.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(o.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: 'COLLECTED',
      })),
    };
  },

  /**
   * Fetch live cash-in-hand and COD collections summary from backend
   */
  async fetchCashSummary(riderId, fallbackUser = null) {
    try {
      const res = await apiClient.get('/cash/my');
      const data = res.data?.data || res.data;
      if (data && typeof data.cashInHand === 'number') {
        return {
          cashInHand: data.cashInHand,
          cashInHandPaise: data.cashInHandPaise,
          totalCollectedPaise: data.totalCollectedPaise,
          totalDepositedPaise: data.totalDepositedPaise,
          collections: (data.collections || []).map((c) => ({
            id: c.id,
            orderId: c.orderId,
            customerName: c.customerName,
            amount: c.amount,
            paymentMethod: c.paymentMethod || 'COD',
            time: new Date(c.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(c.collectedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            collectedAt: c.collectedAt,
            status: c.status,
          })),
          deposits: (data.deposits || []).map((d) => ({
            id: d.id,
            depositId: d.depositId,
            amount: d.amount,
            status: (d.status === 'SUBMITTED' || d.rawStatus === 'SUBMITTED' || d.status === 'WAITING_VERIFICATION')
              ? 'WAITING_VERIFICATION'
              : (d.status === 'VERIFIED' ? 'VERIFIED' : d.status),
            rawStatus: d.status,
            method: d.method,
            time: new Date(d.submittedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(d.submittedAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            submittedAt: d.submittedAt,
            verifiedAt: d.verifiedAt,
            rejectionReason: d.rejectionReason,
          })),
        };
      }
    } catch (err) {
      console.warn('Backend fetchCashSummary fallback note:', err.message);
    }

    // Client-side fallback matching local metrics
    const local = this.getRiderMetrics(riderId, fallbackUser);
    const finance = loadFinanceStore();
    return {
      cashInHand: local.cashInHand,
      cashInHandPaise: Math.round(local.cashInHand * 100),
      totalCollectedPaise: Math.round(local.cashInHand * 100),
      totalDepositedPaise: Math.round((local.cashDeposited || 0) * 100),
      collections: local.codTransactions,
      deposits: (finance.hubRemittances || finance.withdrawals || []).filter((w) => w.disbursedBy === 'HUB_REMITTANCE' || w.method === 'CASH_HANDOVER'),
    };
  },

  /**
   * Submit cash deposit at Central Hub Depot (remains in WAITING_VERIFICATION state until verified by Admin)
   */
  async submitCashDeposit(riderId, amount, method = 'CASH_HANDOVER', note = '') {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      throw new Error('Please enter a valid deposit amount greater than ₹0.');
    }

    let depositSlip = null;
    try {
      const res = await apiClient.post('/cash/deposits', {
        amount: numAmount,
        method: method || 'CASH_HANDOVER',
        referenceNo: `DEP-${Date.now().toString().slice(-6)}`,
      });
      const data = res.data?.data || res.data;
      if (data) {
        depositSlip = {
          id: data.id,
          depositId: data.referenceNo || `DEP-${data.id?.slice(0, 8)?.toUpperCase() || Date.now().toString().slice(-6)}`,
          amount: (data.amountPaise ? data.amountPaise / 100 : numAmount),
          status: 'WAITING_VERIFICATION',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: note || 'Sector V Hub Cash Counter Remittance',
        };
      }
    } catch (err) {
      console.warn('Backend submitCashDeposit fallback note:', err.message);
    }

    if (!depositSlip) {
      depositSlip = {
        id: `dep-${Date.now()}`,
        depositId: `DEP-${Date.now().toString().slice(-6)}`,
        amount: numAmount,
        status: 'WAITING_VERIFICATION',
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        note: note || 'Sector V Hub Cash Counter Remittance',
      };
    }

    // Save into pending hubRemittances in finance store (DO NOT deduct cashInHand until admin verifies!)
    const financeStore = loadFinanceStore();
    if (!financeStore.hubRemittances) financeStore.hubRemittances = [];
    financeStore.hubRemittances.unshift(depositSlip);
    saveFinanceStore(financeStore);

    window.dispatchEvent(new CustomEvent('oshud_rider_finance_updated'));
    return depositSlip;
  },

  /**
   * Fetch live earnings, wallet balance, and withdrawals history from backend
   */
  async fetchEarningsAndWallet(riderId, fallbackUser = null) {
    let walletBalance = null;
    let withdrawals = [];
    let completedDeliveries = [];

    try {
      const [walletRes, withdrawalsRes, deliveriesRes] = await Promise.all([
        apiClient.get('/wallet/my').catch(() => null),
        apiClient.get('/wallet/withdrawals').catch(() => null),
        apiClient.get('/deliveries/my').catch(() => null),
      ]);

      if (walletRes?.data?.data) {
        walletBalance = Number(walletRes.data.data.balancePaise || 0) / 100;
      }
      if (withdrawalsRes?.data?.data) {
        withdrawals = (withdrawalsRes.data.data || []).map((w) => ({
          id: w.id,
          amount: Number(w.amountPaise || 0) / 100,
          paymentMethod: w.payoutDetails?.method === 'OFFLINE_CASH' ? 'Offline Cash in Hand' : `UPI (${w.payoutDetails?.upiId || 'Direct'})`,
          rawMethod: w.payoutDetails?.method || 'UPI',
          upiId: w.payoutDetails?.upiId || '',
          note: w.payoutDetails?.note || '',
          date: new Date(w.requestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: new Date(w.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: (w.status === 'REQUESTED' || w.status === 'SUBMITTED' || w.status === 'WAITING_VERIFICATION')
            ? 'WAITING_VERIFICATION'
            : (w.status === 'PAID' ? 'PAID' : w.status),
          rawStatus: w.status,
          disbursedBy: w.reviewedById ? 'SUPER_ADMIN' : 'RIDER_PORTAL',
        }));
      }
      if (deliveriesRes?.data?.data) {
        completedDeliveries = (deliveriesRes.data.data || []).filter(
          (d) => d.status === 'DELIVERED' || d.order?.status === 'DELIVERED'
        );
      }
    } catch (err) {
      console.warn('Backend fetchEarningsAndWallet fallback note:', err.message);
    }

    // Local workspace orders fallback
    const local = this.getRiderMetrics(riderId, fallbackUser);

    // Merge backend deliveries count if available
    const todayDateStr = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const effectiveDeliveries = completedDeliveries.length > 0
      ? completedDeliveries
      : local.completedOrders;

    const todayOrders = effectiveDeliveries.filter((d) => {
      const dt = d.deliveredAt || d.createdAt || d.order?.placedAt;
      return dt && new Date(dt).toDateString() === todayDateStr;
    });

    const monthOrders = effectiveDeliveries.filter((d) => {
      const dt = d.deliveredAt || d.createdAt || d.order?.placedAt;
      return dt && new Date(dt).getMonth() === currentMonth && new Date(dt).getFullYear() === currentYear;
    });

    const deliveriesToday = todayOrders.length > 0 ? todayOrders.length : (effectiveDeliveries.length > 0 ? effectiveDeliveries.length : local.deliveriesToday);
    const totalDeliveriesMonth = monthOrders.length > 0 ? monthOrders.length : (effectiveDeliveries.length > 0 ? effectiveDeliveries.length : local.totalDeliveriesMonth);

    // Total delivered package gross amount today
    const totalAmountDeliveredToday = todayOrders.length > 0
      ? todayOrders.reduce((sum, d) => sum + (Number(d.order?.totalPaise || d.totalPaise || 0) / 100 || Number(d.total || 0)), 0)
      : (effectiveDeliveries.length > 0
          ? effectiveDeliveries.reduce((sum, d) => sum + (Number(d.order?.totalPaise || d.totalPaise || 0) / 100 || Number(d.total || 0)), 0)
          : (local.totalAmountDeliveredToday || 0));

    // ₹30 per order delivered
    const earningsToday = deliveriesToday * 30;
    const monthlyTotalEarnings = totalDeliveriesMonth * 30;

    const effectiveWithdrawals = withdrawals.length > 0 ? withdrawals : local.withdrawals;
    const totalWithdrawn = effectiveWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);

    const withdrawableBalance = walletBalance !== null
      ? walletBalance
      : Math.max(0, monthlyTotalEarnings - totalWithdrawn);

    return {
      deliveriesToday,
      totalAmountDeliveredToday,
      earningsToday,
      totalDeliveriesMonth,
      monthlyTotalEarnings,
      withdrawableBalance,
      totalWithdrawn,
      withdrawals: effectiveWithdrawals,
      completedDeliveries: effectiveDeliveries,
    };
  },

  /**
   * Request withdrawal through backend (supports OFFLINE_CASH and UPI)
   */
  async submitWithdrawal(riderId, amount, payoutMethod = 'UPI', note = '', upiId = '') {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      throw new Error('Please enter a valid withdrawal amount.');
    }

    const cleanMethod = payoutMethod === 'OFFLINE_CASH' ? 'OFFLINE_CASH' : 'UPI';
    let withdrawalRecord = null;

    try {
      const res = await apiClient.post('/wallet/withdrawals', {
        amount: numAmount,
        amountPaise: Math.round(numAmount * 100),
        payoutDetails: {
          method: cleanMethod,
          upiId: cleanMethod === 'UPI' ? upiId : undefined,
          note: note || (cleanMethod === 'OFFLINE_CASH' ? 'Hub Cash Counter Withdrawal' : 'Instant UPI Payout'),
        },
      });
      const data = res.data?.data || res.data;
      if (data) {
        withdrawalRecord = {
          id: data.id || `WTH-${Date.now().toString().slice(-6)}`,
          riderId,
          amount: numAmount,
          paymentMethod: cleanMethod === 'OFFLINE_CASH' ? 'Offline Cash in Hand' : `UPI (${upiId || 'Direct'})`,
          rawMethod: cleanMethod,
          upiId: cleanMethod === 'UPI' ? upiId : undefined,
          note: note || '',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'WAITING_VERIFICATION',
          rawStatus: 'REQUESTED',
          disbursedBy: 'PENDING_ADMIN_VERIFICATION',
        };
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      console.warn('Backend submitWithdrawal note:', msg);
      if (err?.response?.status === 400 && msg?.toLowerCase()?.includes('insufficient')) {
        throw new Error(msg || 'Insufficient wallet balance for withdrawal.');
      }
    }

    if (!withdrawalRecord) {
      withdrawalRecord = this.requestWithdrawal(
        riderId,
        numAmount,
        cleanMethod === 'OFFLINE_CASH' ? 'Offline Cash in Hand' : `UPI (${upiId || 'Direct'})`,
        note
      );
    } else {
      // Also sync local finance store
      const financeStore = loadFinanceStore();
      const targetId = riderId || 'usr-rider-01';
      financeStore.withdrawals.unshift(withdrawalRecord);
      if (!financeStore.riders[targetId]) {
        financeStore.riders[targetId] = { cashInHand: 0, cashDeposited: 0, withdrawableBalance: 0, totalWithdrawn: 0 };
      }
      financeStore.riders[targetId].withdrawableBalance = Math.max(0, (financeStore.riders[targetId].withdrawableBalance || 0) - numAmount);
      saveFinanceStore(financeStore);
    }

    window.dispatchEvent(new CustomEvent('oshud_rider_finance_updated'));
    return withdrawalRecord;
  },

  /**
   * Provide a cash-finance summary for admin and rider finance views.
   * Reuses getRiderMetrics so both views share the same COD calculations.
   */
  getFinanceOverview(riderId) {
    const targetId = riderId || 'usr-rider-01';
    const metrics = this.getRiderMetrics(targetId);
    const financeStore = loadFinanceStore();
    const aliasIds = [targetId];

    if (targetId === 'rider-01') aliasIds.push('usr-rider-01');
    if (targetId === 'usr-rider-01') aliasIds.push('rider-01');
    if (targetId === 'rider-02') aliasIds.push('usr-rider-02');
    if (targetId === 'usr-rider-02') aliasIds.push('rider-02');

    const matchingFinance = aliasIds
      .map((id) => financeStore.riders[id])
      .find((finance) => finance?.cashDeposited !== undefined);

    return {
      ...metrics,
      cashDeposited: matchingFinance?.cashDeposited ?? metrics.cashDeposited ?? 0,
      cashInHand: metrics.cashInHand ?? 0,
    };
  },

  /**
   * Record a rider cash remittance from the admin cash-workflow page.
   */
  recordCashDeposit(riderId, amount, refNo = '') {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      throw new Error('Please enter a valid cash deposit amount.');
    }

    const note = refNo
      ? `Admin cash remittance (Ref: ${refNo})`
      : 'Admin cash remittance';
    return this.depositCash(riderId, numAmount, note);
  },

  /**
   * Request a withdrawal (strictly within withdrawable balance)
   * Synced with SuperAdmin Settlement & Wallet
   */
  requestWithdrawal(riderId, amount, paymentMethod = 'UPI', note = '') {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      throw new Error('Please enter a valid withdrawal amount.');
    }

    const metrics = this.getRiderMetrics(riderId);
    if (numAmount > metrics.withdrawableBalance) {
      throw new Error(`Withdrawal amount (₹${numAmount.toFixed(2)}) exceeds available withdrawable balance (₹${metrics.withdrawableBalance.toFixed(2)}).`);
    }

    const financeStore = loadFinanceStore();
    const withdrawalRecord = {
      id: `WTH-${Date.now().toString().slice(-6)}`,
      riderId,
      amount: numAmount,
      paymentMethod,
      note: note || 'Rider self-service portal withdrawal',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'WAITING_VERIFICATION',
      rawStatus: 'REQUESTED',
      disbursedBy: 'PENDING_ADMIN_VERIFICATION',
    };

    financeStore.withdrawals.unshift(withdrawalRecord);

    if (!financeStore.riders[riderId]) {
      financeStore.riders[riderId] = { cashInHand: 0, cashDeposited: 0, withdrawableBalance: 0, totalWithdrawn: 0 };
    }
    financeStore.riders[riderId].totalWithdrawn = (financeStore.riders[riderId].totalWithdrawn || 0) + numAmount;
    financeStore.riders[riderId].withdrawableBalance = Math.max(0, (financeStore.riders[riderId].withdrawableBalance || metrics.withdrawableBalance) - numAmount);

    saveFinanceStore(financeStore);
    return withdrawalRecord;
  },

  /**
   * Record hub cash remittance (reducing COD cash in hand)
   */
  depositCash(riderId, amount, note = '') {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      throw new Error('Please enter a valid deposit amount.');
    }

    const financeStore = loadFinanceStore();
    if (!financeStore.riders[riderId]) {
      financeStore.riders[riderId] = { cashInHand: 0, cashDeposited: 0, withdrawableBalance: 0, totalWithdrawn: 0 };
    }

    financeStore.riders[riderId].cashDeposited = (financeStore.riders[riderId].cashDeposited || 0) + numAmount;
    saveFinanceStore(financeStore);

    // Also update workspaceStore
    workspaceStore.reconcileCash(riderId, numAmount);

    return {
      depositId: `DEP-${Date.now().toString().slice(-6)}`,
      amount: numAmount,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: note || 'Hub cash counter remittance',
    };
  },

  /**
   * Record SuperAdmin disbursement directly into rider's account
   */
  recordSuperAdminPayout(riderId, amount, refNo = '') {
    const numAmount = Number(amount);
    const financeStore = loadFinanceStore();
    const payoutRecord = {
      id: `DISB-${Date.now().toString().slice(-6)}`,
      riderId,
      amount: numAmount,
      paymentMethod: 'SUPER_ADMIN_PAYOUT',
      note: refNo ? `Disbursed by Super Admin (Ref: ${refNo})` : 'Super Admin Disbursal Payout',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'COMPLETED',
      disbursedBy: 'SUPER_ADMIN',
    };

    financeStore.withdrawals.unshift(payoutRecord);
    
    // Update both primary and aliased IDs in finance store
    const idsToUpdate = [riderId];
    if (riderId === 'rider-01') idsToUpdate.push('usr-rider-01');
    if (riderId === 'usr-rider-01') idsToUpdate.push('rider-01');
    if (riderId === 'rider-02') idsToUpdate.push('usr-rider-02');
    if (riderId === 'usr-rider-02') idsToUpdate.push('rider-02');

    idsToUpdate.forEach((id) => {
      if (!financeStore.riders[id]) {
        financeStore.riders[id] = { cashInHand: 0, cashDeposited: 0, withdrawableBalance: 0, totalWithdrawn: 0 };
      }
      financeStore.riders[id].totalWithdrawn = (financeStore.riders[id].totalWithdrawn || 0) + numAmount;
    });

    saveFinanceStore(financeStore);
    return payoutRecord;
  },
};

export default riderApi;
