/**
 * Oshud Wala — Unified Workspace Ecosystem Store
 * Centralized, synchronized data engine linking Admin, Doctor, Pharmacist, Rider, and Receptionist.
 * Ensures strict data consistency: same Order ID, live Token Queue, Prescription, and Cash settlement.
 */

const STORAGE_KEY = 'oshud_workspace_state_v1';

// Initial Seed Data (No demo records - clean dynamic state)
const initialOrders = [];
const initialTokens = [];
const initialPrescriptions = [];

// Initial Pharmacy Inventory
const initialInventory = [
  {
    id: 'inv-01',
    name: 'Augmentin 625 Duo Tablet',
    generic: 'Amoxicillin + Clavulanic Acid (500mg + 125mg)',
    manufacturer: 'GSK Pharmaceuticals Ltd.',
    category: 'Antibiotics',
    batchNo: 'AG-24K09',
    expiryDate: '2027-04-30',
    daysToExpiry: 520,
    mrp: 223.5,
    sellingPrice: 201.5,
    stock: 142,
    reorderLevel: 25,
    status: 'IN_STOCK',
  },
  {
    id: 'inv-02',
    name: 'Pan 40 Tablet',
    generic: 'Pantoprazole 40mg',
    manufacturer: 'Alkem Laboratories',
    category: 'Gastroenterology',
    batchNo: 'PN-24G18',
    expiryDate: '2026-12-15',
    daysToExpiry: 26,
    mrp: 172.0,
    sellingPrice: 155.0,
    stock: 22,
    reorderLevel: 30,
    status: 'EXPIRING_SOON', // < 30 days
  },
  {
    id: 'inv-03',
    name: 'Dolo 650 Tablet',
    generic: 'Paracetamol 650mg',
    manufacturer: 'Micro Labs Ltd',
    category: 'Analgesics & Antipyretic',
    batchNo: 'DL-25A01',
    expiryDate: '2027-08-31',
    daysToExpiry: 650,
    mrp: 38.0,
    sellingPrice: 34.0,
    stock: 450,
    reorderLevel: 100,
    status: 'IN_STOCK',
  },
  {
    id: 'inv-04',
    name: 'Azithral 500 Tablet',
    generic: 'Azithromycin 500mg',
    manufacturer: 'Alembic Pharma',
    category: 'Antibiotics',
    batchNo: 'AZ-24F03',
    expiryDate: '2026-11-28',
    daysToExpiry: 9,
    mrp: 145.0,
    sellingPrice: 130.0,
    stock: 8,
    reorderLevel: 20,
    status: 'EXPIRING_SOON',
  },
  {
    id: 'inv-05',
    name: 'Shelcal 500 Tablet',
    generic: 'Calcium 500mg + Vitamin D3 250IU',
    manufacturer: 'Torrent Pharmaceuticals',
    category: 'Vitamins & Minerals',
    batchNo: 'SH-25D11',
    expiryDate: '2027-11-30',
    daysToExpiry: 740,
    mrp: 145.0,
    sellingPrice: 131.0,
    stock: 180,
    reorderLevel: 40,
    status: 'IN_STOCK',
  },
];

// Initial Riders Fleet (Zero demo values for cash and deliveries, accumulated dynamically)
const initialRiders = [
  {
    id: 'usr-rider-01',
    name: 'Rahul Das',
    phone: '+91 98304 55667',
    vehicle: 'Hero Electric (WB-02-AZ-4921)',
    zone: 'Kolkata South & Salt Lake',
    isOnline: true,
    activeOrderId: 'OW-89214',
    cashInHand: 0.0,
    cashRemittedToday: 0.0,
    rating: 4.9,
    deliveriesToday: 0,
  },
  {
    id: 'usr-rider-02',
    name: 'Sourav Mondal',
    phone: '+91 98308 11990',
    vehicle: 'Honda Activa (WB-04-EK-1120)',
    zone: 'Gariahat & Ballygunge',
    isOnline: true,
    activeOrderId: 'OW-89216',
    cashInHand: 0.0,
    cashRemittedToday: 0.0,
    rating: 4.8,
    deliveriesToday: 0,
  },
  {
    id: 'usr-rider-03',
    name: 'Biplab Halder',
    phone: '+91 98309 66778',
    vehicle: 'TVS Jupiter (WB-06-HG-7844)',
    zone: 'New Town & Rajarhat',
    isOnline: false,
    activeOrderId: null,
    cashInHand: 0.0,
    cashRemittedToday: 0.0,
    rating: 4.7,
    deliveriesToday: 0,
  },
];

// Initial Rider Handover Audit Log (Tracks which driver picks which order items)
const initialHandovers = [];

const DEMO_ORDER_PREFIX = 'OW-8921';
const DEMO_RX_IDS = new Set(['RX-9921', 'RX-9922']);
const DEMO_PATIENT_NAMES = new Set([
  'Subhasis Deb',
  'Debarati Ganguly',
  'Monojit Ghosh',
  'Priyanka Roy',
  'Alok Nath Mukherjee',
  'Amitava Sen',
  'Shreya Roy',
  'Tapas Paul',
  'Moumita Dutta',
  'Rajiv Bose',
]);
const DEMO_HANDOVER_IDS = new Set(['HND-89216', 'HND-89217']);

// Helper to load or initialize state
const loadInitialState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const orders = Array.isArray(parsed.orders)
        ? parsed.orders.filter((o) => !o.id || !o.id.startsWith(DEMO_ORDER_PREFIX))
        : [];
      const tokens = Array.isArray(parsed.tokens)
        ? parsed.tokens.filter((t) => !DEMO_PATIENT_NAMES.has(t.patientName))
        : [];
      const prescriptions = Array.isArray(parsed.prescriptions)
        ? parsed.prescriptions.filter((p) => !DEMO_RX_IDS.has(p.id))
        : [];
      const handovers = Array.isArray(parsed.handovers)
        ? parsed.handovers.filter((h) => !DEMO_HANDOVER_IDS.has(h.handoverId))
        : [];

      const cleanState = {
        orders,
        tokens,
        prescriptions,
        inventory: parsed.inventory || initialInventory,
        riders: parsed.riders || initialRiders,
        handovers,
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
      // Overwrite storage with purged clean state
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanState));
      } catch {}
      return cleanState;
    }
  } catch (err) {
    console.warn('Workspace store load fallback:', err);
  }
  return {
    orders: initialOrders,
    tokens: initialTokens,
    prescriptions: initialPrescriptions,
    inventory: initialInventory,
    riders: initialRiders,
    handovers: initialHandovers,
    lastUpdated: Date.now(),
  };
};

// Global Store State
let state = loadInitialState();
const listeners = new Set();

const persistAndNotify = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to persist workspace state:', err);
  }
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (e) {
      console.error('Store listener error:', e);
    }
  });
};

export const workspaceStore = {
  getState() {
    return state;
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  resetDefaults() {
    state = {
      orders: initialOrders,
      tokens: initialTokens,
      prescriptions: initialPrescriptions,
      inventory: initialInventory,
      riders: initialRiders,
      handovers: initialHandovers,
      lastUpdated: Date.now(),
    };
    persistAndNotify();
  },

  // === ORDERS ACTIONS ===
  updateOrderStatus(orderId, newStatus, extraData = {}) {
    const orderIndex = state.orders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) return null;

    const currentOrder = state.orders[orderIndex];
    const updatedOrder = {
      ...currentOrder,
      status: newStatus,
      ...extraData,
      timeline: [
        ...currentOrder.timeline,
        {
          status: newStatus.replace(/_/g, ' '),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true,
        },
      ],
    };

    const nextOrders = [...state.orders];
    nextOrders[orderIndex] = updatedOrder;
    state = { ...state, orders: nextOrders, lastUpdated: Date.now() };
    persistAndNotify();
    return updatedOrder;
  },

  assignRider(orderId, rider, qrToken = null) {
    const generatedToken =
      qrToken ||
      `QR-${String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expiresAt = Date.now() + 15 * 60 * 1000;
    return this.updateOrderStatus(orderId, 'READY_FOR_PICKUP', {
      assignedRider: {
        id: rider.id || rider.userId,
        name: rider.name || rider.fullName,
        phone: rider.phone,
        vehicle: rider.vehicle || 'Hero Electric (WB-02-AZ-4921)',
      },
      pickupQrCode: generatedToken,
      pickupQrExpiresAt: expiresAt,
    });
  },

  verifyPickup(orderId, qrInput, verifiedItems = null) {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return null;

    if (verifiedItems && Array.isArray(verifiedItems) && verifiedItems.length > 0) {
      order.items = verifiedItems;
    }

    return this.updateOrderStatus(orderId, 'OUT_FOR_DELIVERY');
  },

  completeDelivery(orderId, otpInput, codAmountCollected = 0) {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    if (!otpInput || order.deliveryOtp.trim() !== otpInput.trim()) {
      throw new Error('Invalid 4-digit Delivery OTP. Please verify the code with the customer.');
    }

    // If COD, mark payment as collected and add to rider's cashInHand
    const paymentStatus = order.paymentMethod === 'COD' ? 'COLLECTED' : order.paymentStatus;
    if (order.paymentMethod === 'COD' && order.assignedRider?.id) {
      const riderIdx = state.riders.findIndex((r) => r.id === order.assignedRider.id);
      if (riderIdx !== -1) {
        const currentRider = state.riders[riderIdx];
        const nextRiders = [...state.riders];
        nextRiders[riderIdx] = {
          ...currentRider,
          cashInHand: (currentRider.cashInHand || 0) + (codAmountCollected || order.total),
          deliveriesToday: (currentRider.deliveriesToday || 0) + 1,
        };
        state = { ...state, riders: nextRiders };
      }
    }

    return this.updateOrderStatus(orderId, 'DELIVERED', { paymentStatus });
  },

  createOrder(orderData) {
    const newOrderId = orderData.id || `OW-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder = {
      id: newOrderId,
      customerName: orderData.customerName || 'Walk-in Customer',
      customerPhone: orderData.customerPhone || '+91 98000 00000',
      address: orderData.address || 'In-Store Counter Dispensation',
      landmark: orderData.landmark || '',
      area: orderData.area || 'Counter / Express Pickup',
      city: orderData.city || 'Kolkata',
      pharmacyId: orderData.pharmacyId || 'pharma-01',
      pharmacyName: orderData.pharmacyName || 'Oshud Wala Partner Pharmacy',
      pharmacyAddress: orderData.pharmacyAddress || 'Sector V, Salt Lake, Kolkata',
      pharmacyPhone: orderData.pharmacyPhone || '+91 33 2357 8900',
      items: orderData.items || [],
      totalMrp: Number(orderData.totalMrp || orderData.subtotal) || 0,
      subtotal: Number(orderData.subtotal) || 0,
      packagingFee: Number(orderData.packagingFee) || (Number(orderData.subtotal) > 0 ? 6 : 0),
      platformFee: Number(orderData.platformFee) || (Number(orderData.subtotal) > 0 ? 9 : 0),
      deliveryFee: Number(orderData.deliveryFee) || 0,
      discount: Number(orderData.discount) || 0,
      cashback: Number(orderData.cashback) || 0,
      total: Number(orderData.total) || 0,
      status: orderData.status || 'READY_FOR_PICKUP',
      paymentMethod: orderData.paymentMethod || 'COD',
      paymentStatus: orderData.paymentStatus || (orderData.paymentMethod === 'COD' ? 'PENDING_COLLECTION' : 'PAID'),
      assignedRider: orderData.assignedRider || null,
      pickupQrCode: orderData.pickupQrCode || `PICKUP-${newOrderId.replace('OW-', '')}-SEC`,
      deliveryOtp: orderData.deliveryOtp || String(Math.floor(1000 + Math.random() * 9000)),
      isManualInStore: Boolean(orderData.isManualInStore),
      prescriptionId: orderData.prescriptionId || null,
      timeline: [
        { status: 'Order Created', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), completed: true },
        { status: (orderData.status || 'READY_FOR_PICKUP').replace(/_/g, ' '), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), completed: true },
      ],
      createdAt: new Date().toISOString(),
    };

    state = {
      ...state,
      orders: [newOrder, ...state.orders],
      lastUpdated: Date.now(),
    };
    persistAndNotify();
    return newOrder;
  },

  recordHandover(handoverData) {
    const newHandover = {
      handoverId: handoverData.handoverId || `HND-${Date.now().toString().slice(-5)}`,
      orderId: handoverData.orderId,
      customerName: handoverData.customerName || 'Customer',
      destination: handoverData.destination || 'Delivery Address',
      riderId: handoverData.riderId || 'usr-rider-unknown',
      riderName: handoverData.riderName || 'Assigned Rider',
      riderPhone: handoverData.riderPhone || '',
      riderVehicle: handoverData.riderVehicle || '',
      items: handoverData.items || [],
      qrToken: handoverData.qrToken || '',
      handoverTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      status: 'OUT_FOR_DELIVERY',
      timestamp: Date.now(),
    };

    const nextHandovers = [newHandover, ...(state.handovers || [])];

    // Also update order status to OUT_FOR_DELIVERY and set assignedRider
    let nextOrders = [...state.orders];
    const orderIndex = nextOrders.findIndex((o) => o.id === handoverData.orderId);
    if (orderIndex !== -1) {
      const currentOrder = nextOrders[orderIndex];
      nextOrders[orderIndex] = {
        ...currentOrder,
        status: 'OUT_FOR_DELIVERY',
        assignedRider: {
          id: handoverData.riderId,
          name: handoverData.riderName,
          phone: handoverData.riderPhone,
          vehicle: handoverData.riderVehicle,
        },
        timeline: [
          ...currentOrder.timeline,
          {
            status: 'Picked Up by Rider',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            completed: true,
          },
          {
            status: 'Out for Delivery',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            completed: true,
          },
        ],
      };
    }

    state = {
      ...state,
      handovers: nextHandovers,
      orders: nextOrders,
      lastUpdated: Date.now(),
    };
    persistAndNotify();
    return newHandover;
  },

  // === TOKEN QUEUE ACTIONS (Doctor & Receptionist Synchronized — Doctor-Wise Engine) ===
  generateToken({
    patientName,
    patientPhone,
    age,
    gender,
    symptoms,
    type = 'WALK_IN',
    doctorId = 'doc-01',
    doctorName = 'Dr. Priya Sharma',
    clinicName = 'Apollo Clinic, Salt Lake Kolkata',
    room = 'Room 204',
    slot = null,
  }) {
    const nextTokenNum = Math.max(...state.tokens.map((t) => t.tokenNumber), 10) + 1;
    const newToken = {
      tokenNumber: nextTokenNum,
      patientName,
      patientPhone,
      age: Number(age) || 30,
      gender: gender || 'Other',
      doctorId,
      doctorName,
      clinicName,
      room,
      type,
      slot: slot || (type === 'WALK_IN' ? 'Walk-in Queue' : 'Booked'),
      status: 'WAITING',
      vitals: { bp: '120/80', pulse: '75 bpm', temp: '98.4°F', weight: '65 kg' },
      symptoms: symptoms || 'General Checkup',
      arrivedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      prescription: null,
    };

    state = {
      ...state,
      tokens: [...state.tokens, newToken],
      lastUpdated: Date.now(),
    };
    persistAndNotify();
    return newToken;
  },

  callNextToken(doctorId = null) {
    // If doctorId is provided, filter queue specifically for that doctor
    // Otherwise determine target doctor from currently active or waiting tokens
    let targetDoctorId = doctorId;

    if (!targetDoctorId) {
      const activeToken = state.tokens.find((t) => ['SERVING', 'NEXT', 'WAITING'].includes(t.status));
      if (activeToken) {
        targetDoctorId = activeToken.doctorId || activeToken.doctorName;
      }
    }

    const nextTokens = state.tokens.map((t) => ({ ...t }));

    // Doctor-wise token list
    const doctorTokens = nextTokens.filter((t) => {
      if (!targetDoctorId) return true;
      return (
        t.doctorId === targetDoctorId ||
        (t.doctorName && String(targetDoctorId).toLowerCase().includes(String(t.doctorName).toLowerCase())) ||
        (t.doctorName && String(t.doctorName).toLowerCase().includes(String(targetDoctorId).toLowerCase()))
      );
    });

    const servingToken = doctorTokens.find((t) => t.status === 'SERVING');
    const nextToken = doctorTokens.find((t) => t.status === 'NEXT');
    const waitingTokens = doctorTokens.filter((t) => t.status === 'WAITING');

    // 1. Complete current serving token for this doctor
    if (servingToken) {
      const globalServingIdx = nextTokens.findIndex((t) => t.tokenNumber === servingToken.tokenNumber);
      if (globalServingIdx !== -1) {
        nextTokens[globalServingIdx].status = 'COMPLETED';
      }
    }

    // 2. Advance NEXT to SERVING, and promote first WAITING to NEXT
    if (nextToken) {
      const globalNextIdx = nextTokens.findIndex((t) => t.tokenNumber === nextToken.tokenNumber);
      if (globalNextIdx !== -1) {
        nextTokens[globalNextIdx].status = 'SERVING';
      }

      if (waitingTokens.length > 0) {
        const globalWaitIdx = nextTokens.findIndex((t) => t.tokenNumber === waitingTokens[0].tokenNumber);
        if (globalWaitIdx !== -1) {
          nextTokens[globalWaitIdx].status = 'NEXT';
        }
      }
    } else if (waitingTokens.length > 0) {
      // If no NEXT was staged, move first waiting directly to SERVING
      const globalWaitIdx = nextTokens.findIndex((t) => t.tokenNumber === waitingTokens[0].tokenNumber);
      if (globalWaitIdx !== -1) {
        nextTokens[globalWaitIdx].status = 'SERVING';
      }

      // Promote second waiting to NEXT
      if (waitingTokens.length > 1) {
        const globalNextIdx = nextTokens.findIndex((t) => t.tokenNumber === waitingTokens[1].tokenNumber);
        if (globalNextIdx !== -1) {
          nextTokens[globalNextIdx].status = 'NEXT';
        }
      }
    }

    state = { ...state, tokens: nextTokens, lastUpdated: Date.now() };
    persistAndNotify();
    return state.tokens;
  },

  skipToken(tokenNumber) {
    const tokenIdx = state.tokens.findIndex((t) => t.tokenNumber === tokenNumber);
    if (tokenIdx === -1) return;

    const nextTokens = [...state.tokens];
    nextTokens[tokenIdx] = { ...nextTokens[tokenIdx], status: 'SKIPPED' };

    state = { ...state, tokens: nextTokens, lastUpdated: Date.now() };
    persistAndNotify();
  },

  recallToken(tokenNumber) {
    const tokenIdx = state.tokens.findIndex((t) => t.tokenNumber === tokenNumber);
    if (tokenIdx === -1) return;

    const nextTokens = [...state.tokens];
    nextTokens[tokenIdx] = { ...nextTokens[tokenIdx], status: 'WAITING' };

    state = { ...state, tokens: nextTokens, lastUpdated: Date.now() };
    persistAndNotify();
  },

  completeConsultation(tokenNumber, prescriptionData) {
    const tokenIdx = state.tokens.findIndex((t) => t.tokenNumber === tokenNumber);
    if (tokenIdx === -1) return;

    const nextTokens = [...state.tokens];
    nextTokens[tokenIdx] = {
      ...nextTokens[tokenIdx],
      status: 'COMPLETED',
      prescription: prescriptionData,
    };

    state = { ...state, tokens: nextTokens, lastUpdated: Date.now() };
    persistAndNotify();
  },

  // === PRESCRIPTION ACTIONS ===
  addPrescription(rxData) {
    const newRx = {
      id: rxData.id || `RX-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: rxData.patientName || 'Patient',
      patientPhone: rxData.patientPhone || '+91 98000 00000',
      patientAge: Number(rxData.patientAge) || 35,
      patientGender: rxData.patientGender || 'Other',
      doctorName: rxData.doctorName || 'Attending Physician',
      clinicName: rxData.clinicName || 'In-Store Prescription Desk',
      rxDate: rxData.rxDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: rxData.status || 'PENDING_VERIFICATION',
      imageUrl: rxData.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
      extractedMedicines: rxData.extractedMedicines || [],
      notes: rxData.notes || 'Submitted for validation',
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
    };

    state = {
      ...state,
      prescriptions: [newRx, ...state.prescriptions],
      lastUpdated: Date.now(),
    };
    persistAndNotify();
    return newRx;
  },

  verifyPrescription(rxId, verifiedMedicines, notes) {
    const idx = state.prescriptions.findIndex((p) => p.id === rxId);
    if (idx === -1) return;

    const nextPrescriptions = [...state.prescriptions];
    nextPrescriptions[idx] = {
      ...nextPrescriptions[idx],
      status: 'VERIFIED',
      extractedMedicines: verifiedMedicines || nextPrescriptions[idx].extractedMedicines,
      notes: notes || 'Verified by pharmacist.',
    };

    state = { ...state, prescriptions: nextPrescriptions, lastUpdated: Date.now() };
    persistAndNotify();
  },

  rejectPrescription(rxId, reason) {
    const idx = state.prescriptions.findIndex((p) => p.id === rxId);
    if (idx === -1) return;

    const nextPrescriptions = [...state.prescriptions];
    nextPrescriptions[idx] = {
      ...nextPrescriptions[idx],
      status: 'REJECTED',
      notes: reason || 'Prescription rejected due to legibility or invalid doctor credentials.',
    };

    state = { ...state, prescriptions: nextPrescriptions, lastUpdated: Date.now() };
    persistAndNotify();
  },

  // === INVENTORY ACTIONS ===
  adjustStock(invId, deltaStock, reason) {
    const idx = state.inventory.findIndex((i) => i.id === invId);
    if (idx === -1) return;

    const currentItem = state.inventory[idx];
    const newStock = Math.max(0, currentItem.stock + Number(deltaStock));
    let status = 'IN_STOCK';
    if (newStock === 0) status = 'OUT_OF_STOCK';
    else if (newStock <= currentItem.reorderLevel) status = 'LOW_STOCK';
    else if (currentItem.daysToExpiry <= 30) status = 'EXPIRING_SOON';

    const nextInventory = [...state.inventory];
    nextInventory[idx] = { ...currentItem, stock: newStock, status };

    state = { ...state, inventory: nextInventory, lastUpdated: Date.now() };
    persistAndNotify();
  },

  addStock(itemData) {
    const newItem = {
      id: 'inv-' + Date.now(),
      name: itemData.name,
      generic: itemData.generic || '',
      manufacturer: itemData.manufacturer || 'Certified Pharma',
      category: itemData.category || 'General',
      batchNo: itemData.batchNo || 'WB-' + Math.floor(1000 + Math.random() * 9000),
      expiryDate: itemData.expiryDate || '2027-12-31',
      daysToExpiry: 450,
      mrp: Number(itemData.mrp) || 100,
      sellingPrice: Number(itemData.sellingPrice) || Number(itemData.mrp) || 90,
      stock: Number(itemData.units) || 50,
      reorderLevel: 20,
      status: Number(itemData.units) > 20 ? 'IN_STOCK' : 'LOW_STOCK',
      pharmacyId: 'pharma-01'
    };
    state = { ...state, inventory: [newItem, ...state.inventory], lastUpdated: Date.now() };
    persistAndNotify();
    return newItem;
  },

  removeStock(invId) {
    state = { ...state, inventory: state.inventory.filter((i) => i.id !== invId), lastUpdated: Date.now() };
    persistAndNotify();
  },

  // === RIDER STATUS & CASH ACTIONS ===
  toggleRiderOnline(riderId, isOnline) {
    const idx = state.riders.findIndex((r) => r.id === riderId);
    if (idx === -1) return;

    const nextRiders = [...state.riders];
    nextRiders[idx] = { ...nextRiders[idx], isOnline };

    state = { ...state, riders: nextRiders, lastUpdated: Date.now() };
    persistAndNotify();
  },

  reconcileCash(riderId, amountRemitted) {
    const idx = state.riders.findIndex((r) => r.id === riderId);
    if (idx === -1) return;

    const currentRider = state.riders[idx];
    const remitted = Number(amountRemitted) || currentRider.cashInHand;
    const nextRiders = [...state.riders];
    nextRiders[idx] = {
      ...currentRider,
      cashInHand: Math.max(0, currentRider.cashInHand - remitted),
      cashRemittedToday: (currentRider.cashRemittedToday || 0) + remitted,
    };

    state = { ...state, riders: nextRiders, lastUpdated: Date.now() };
    persistAndNotify();
  },
};

export default workspaceStore;
