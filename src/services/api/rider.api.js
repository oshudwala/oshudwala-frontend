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

    // Earning per delivery: ₹80 base + COD handling incentive
    const earningsToday = todayCompleted.reduce((sum, o) => {
      const baseFee = 80;
      const incentive = o.paymentMethod === 'COD' ? 20 : 10;
      return sum + baseFee + incentive;
    }, 0);

    // Monthly figures
    const monthCompleted = completedOrders;
    const totalDeliveriesMonth = monthCompleted.length;
    const monthlyTotalAmount = monthCompleted.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const monthlyTotalEarnings = monthCompleted.reduce((sum, o) => {
      const baseFee = 80;
      const incentive = o.paymentMethod === 'COD' ? 20 : 10;
      return sum + baseFee + incentive;
    }, 0);

    // Finance store for cash & withdrawals
    const financeStore = loadFinanceStore();
    const riderFinance = financeStore.riders[targetId] || {
      cashInHand: 0,
      cashDeposited: 0,
      withdrawableBalance: Math.max(0, monthlyTotalEarnings),
      totalWithdrawn: 0,
    };

    // Calculate actual COD cash in hand from completed COD orders not yet deposited
    const completedCodOrders = completedOrders.filter((o) => o.paymentMethod === 'COD');
    const totalCodCollected = completedCodOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const actualCashInHand = Math.max(0, totalCodCollected - (riderFinance.cashDeposited || 0));

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
        orderId: o.id,
        customerName: o.customerName,
        amount: o.total,
        time: o.timeline?.find((t) => t.status.toLowerCase().includes('delivered'))?.time || 'Today',
        status: 'COLLECTED',
      })),
    };
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
      status: 'COMPLETED',
      disbursedBy: 'RIDER_PORTAL',
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
