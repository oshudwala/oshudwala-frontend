/**
 * Oshud Wala — Unified Workspace Ecosystem Store
 * Centralized, synchronized data engine linking Admin, Doctor, Pharmacist, Rider, and Receptionist.
 * Ensures strict data consistency: same Order ID, live Token Queue, Prescription, and Cash settlement.
 */

const STORAGE_KEY = 'oshud_workspace_state_v1';

// Initial Seed Data
const initialOrders = [
  {
    id: 'OW-89214',
    customerName: 'Ayon Paul',
    customerPhone: '+91 98300 11223',
    address: 'Flat 4B, Greenwood Park, Action Area 1, New Town',
    landmark: 'Near Biswa Bangla Gate',
    area: 'New Town, Kolkata',
    city: 'Kolkata',
    pharmacyId: 'pharma-01',
    pharmacyName: 'MedPlus Pharmacy - Sector V',
    pharmacyAddress: 'Sector V, Salt Lake, Kolkata 700091',
    pharmacyPhone: '+91 33 2357 8900',
    items: [
      { name: 'Augmentin 625 Duo Tablet', qty: 2, price: 201.5, form: 'Strip of 10' },
      { name: 'Pan 40 Tablet', qty: 2, price: 155.0, form: 'Strip of 15' },
      { name: 'Dolo 650 Tablet', qty: 1, price: 34.0, form: 'Strip of 15' },
    ],
    subtotal: 747.0,
    deliveryFee: 0.0,
    discount: 50.0,
    total: 697.0,
    status: 'READY_FOR_PICKUP', // Workflow: PENDING -> ACCEPTED -> PREPARING -> READY_FOR_PICKUP -> OUT_FOR_DELIVERY -> DELIVERED
    paymentMethod: 'COD',
    paymentStatus: 'PENDING_COLLECTION',
    assignedRider: {
      id: 'usr-rider-01',
      name: 'Rahul Das',
      phone: '+91 98304 55667',
      vehicle: 'Hero Electric (WB-02-AZ-4921)',
    },
    pickupQrCode: 'PICKUP-89214-SEC5',
    deliveryOtp: '4829',
    timeline: [
      { status: 'Order Placed', time: '10:15 AM, Today', completed: true },
      { status: 'Accepted by Pharmacy', time: '10:20 AM, Today', completed: true },
      { status: 'Prepared & Packed', time: '10:38 AM, Today', completed: true },
      { status: 'Ready for Pickup', time: '10:45 AM, Today', completed: true },
      { status: 'Out for Delivery', time: 'Pending Handover', completed: false },
      { status: 'Delivered', time: 'Estimated 11:30 AM', completed: false },
    ],
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'OW-89215',
    customerName: 'Sunita Mukherjee',
    customerPhone: '+91 98311 44552',
    address: 'Block CD-212, Sector 1, Salt Lake City',
    landmark: 'Opposite City Centre 1',
    area: 'Salt Lake, Kolkata',
    city: 'Kolkata',
    pharmacyId: 'pharma-01',
    pharmacyName: 'MedPlus Pharmacy - Sector V',
    pharmacyAddress: 'Sector V, Salt Lake, Kolkata 700091',
    pharmacyPhone: '+91 33 2357 8900',
    items: [
      { name: 'Thyronorm 50mcg Tablet', qty: 1, price: 185.0, form: 'Bottle of 120' },
      { name: 'Shelcal 500 Tablet', qty: 2, price: 131.0, form: 'Strip of 15' },
    ],
    subtotal: 447.0,
    deliveryFee: 30.0,
    discount: 0.0,
    total: 477.0,
    status: 'PREPARING',
    paymentMethod: 'ONLINE',
    paymentStatus: 'PAID',
    assignedRider: {
      id: 'usr-rider-01',
      name: 'Rahul Das',
      phone: '+91 98304 55667',
      vehicle: 'Hero Electric (WB-02-AZ-4921)',
    },
    pickupQrCode: 'PICKUP-89215-SEC5',
    deliveryOtp: '7103',
    timeline: [
      { status: 'Order Placed', time: '10:30 AM, Today', completed: true },
      { status: 'Accepted by Pharmacy', time: '10:35 AM, Today', completed: true },
      { status: 'Preparing & Packing', time: 'In Progress', completed: false },
      { status: 'Ready for Pickup', time: 'Pending', completed: false },
    ],
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'OW-89216',
    customerName: 'Amitava Banerjee',
    customerPhone: '+91 94330 88771',
    address: '88/2 Gariahat Road, South Kolkata',
    landmark: 'Near Golpark Post Office',
    area: 'Gariahat, Kolkata',
    city: 'Kolkata',
    pharmacyId: 'pharma-02',
    pharmacyName: 'Wellness Forever - Golpark',
    pharmacyAddress: 'Gariahat Main Road, Kolkata 700029',
    pharmacyPhone: '+91 33 2464 1200',
    items: [
      { name: 'Glucophage 500mg Tablet', qty: 3, price: 82.0, form: 'Strip of 10' },
      { name: 'Telma 40 Tablet', qty: 2, price: 210.0, form: 'Strip of 15' },
    ],
    subtotal: 666.0,
    deliveryFee: 0.0,
    discount: 60.0,
    total: 606.0,
    status: 'OUT_FOR_DELIVERY',
    paymentMethod: 'COD',
    paymentStatus: 'PENDING_COLLECTION',
    assignedRider: {
      id: 'usr-rider-02',
      name: 'Sourav Mondal',
      phone: '+91 98308 11990',
      vehicle: 'Honda Activa (WB-04-EK-1120)',
    },
    pickupQrCode: 'PICKUP-89216-GPK',
    deliveryOtp: '9215',
    timeline: [
      { status: 'Order Placed', time: '09:40 AM, Today', completed: true },
      { status: 'Accepted by Pharmacy', time: '09:45 AM, Today', completed: true },
      { status: 'Prepared & Packed', time: '10:00 AM, Today', completed: true },
      { status: 'Picked Up by Rider', time: '10:25 AM, Today', completed: true },
      { status: 'Out for Delivery', time: '10:30 AM, Today', completed: true },
    ],
    createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
  },
  {
    id: 'OW-89217',
    customerName: 'Rina Sen',
    customerPhone: '+91 98305 33221',
    address: 'P-44 Lake Gardens, Kolkata 700045',
    landmark: 'Beside Lake Club',
    area: 'Lake Gardens, Kolkata',
    city: 'Kolkata',
    pharmacyId: 'pharma-01',
    pharmacyName: 'MedPlus Pharmacy - Sector V',
    pharmacyAddress: 'Sector V, Salt Lake, Kolkata 700091',
    pharmacyPhone: '+91 33 2357 8900',
    items: [
      { name: 'Volini Gel 50g', qty: 1, price: 145.0, form: 'Tube of 50g' },
      { name: 'Combiflam Tablet', qty: 1, price: 42.0, form: 'Strip of 20' },
    ],
    subtotal: 187.0,
    deliveryFee: 25.0,
    discount: 0.0,
    total: 212.0,
    status: 'DELIVERED',
    paymentMethod: 'COD',
    paymentStatus: 'COLLECTED',
    assignedRider: {
      id: 'usr-rider-01',
      name: 'Rahul Das',
      phone: '+91 98304 55667',
      vehicle: 'Hero Electric (WB-02-AZ-4921)',
    },
    pickupQrCode: 'PICKUP-89217-SEC5',
    deliveryOtp: '3391',
    timeline: [
      { status: 'Order Placed', time: '08:50 AM, Today', completed: true },
      { status: 'Picked Up', time: '09:30 AM, Today', completed: true },
      { status: 'Delivered Successfully', time: '09:55 AM, Today', completed: true },
    ],
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
  },
];

// Initial Live Token Queue for Doctor (Dr. Priya Sharma) & Receptionist (Apollo Clinic)
const initialTokens = [
  {
    tokenNumber: 12,
    patientName: 'Subhasis Deb',
    patientPhone: '+91 98301 77889',
    age: 48,
    gender: 'Male',
    doctorName: 'Dr. Priya Sharma',
    clinicName: 'Apollo Clinic, Salt Lake Kolkata',
    room: 'Room 204',
    type: 'APPOINTMENT',
    slot: '10:30 AM - 10:45 AM',
    status: 'SERVING', // Statuses: SERVING, NEXT, WAITING, COMPLETED, SKIPPED
    vitals: { bp: '130/85', pulse: '76 bpm', temp: '98.4°F', weight: '72 kg' },
    symptoms: 'Persistent dry cough for 5 days, mild fever in evenings',
    arrivedAt: '10:20 AM',
    prescription: null,
  },
  {
    tokenNumber: 13,
    patientName: 'Debarati Ganguly',
    patientPhone: '+91 98312 99001',
    age: 32,
    gender: 'Female',
    doctorName: 'Dr. Priya Sharma',
    clinicName: 'Apollo Clinic, Salt Lake Kolkata',
    room: 'Room 204',
    type: 'APPOINTMENT',
    slot: '10:45 AM - 11:00 AM',
    status: 'NEXT',
    vitals: { bp: '118/76', pulse: '72 bpm', temp: '98.6°F', weight: '58 kg' },
    symptoms: 'Follow-up for migraine, reporting increased screen fatigue',
    arrivedAt: '10:35 AM',
    prescription: null,
  },
  {
    tokenNumber: 14,
    patientName: 'Monojit Ghosh',
    patientPhone: '+91 98366 11234',
    age: 55,
    gender: 'Male',
    doctorName: 'Dr. Priya Sharma',
    clinicName: 'Apollo Clinic, Salt Lake Kolkata',
    room: 'Room 204',
    type: 'WALK_IN',
    slot: 'Queue Walk-in',
    status: 'WAITING',
    vitals: { bp: '142/90', pulse: '82 bpm', temp: '99.1°F', weight: '79 kg' },
    symptoms: 'High blood pressure checkup, dizziness after morning walk',
    arrivedAt: '10:42 AM',
    prescription: null,
  },
  {
    tokenNumber: 15,
    patientName: 'Priyanka Roy',
    patientPhone: '+91 94321 00987',
    age: 27,
    gender: 'Female',
    doctorName: 'Dr. Priya Sharma',
    clinicName: 'Apollo Clinic, Salt Lake Kolkata',
    room: 'Room 204',
    type: 'APPOINTMENT',
    slot: '11:00 AM - 11:15 AM',
    status: 'WAITING',
    vitals: { bp: '120/80', pulse: '74 bpm', temp: '98.2°F', weight: '54 kg' },
    symptoms: 'Seasonal throat irritation and allergic rhinitis',
    arrivedAt: '10:48 AM',
    prescription: null,
  },
  {
    tokenNumber: 11,
    patientName: 'Alok Nath Mukherjee',
    patientPhone: '+91 98300 44556',
    age: 63,
    gender: 'Male',
    doctorName: 'Dr. Priya Sharma',
    clinicName: 'Apollo Clinic, Salt Lake Kolkata',
    room: 'Room 204',
    type: 'APPOINTMENT',
    slot: '10:15 AM - 10:30 AM',
    status: 'COMPLETED',
    vitals: { bp: '128/82', pulse: '70 bpm', temp: '98.4°F', weight: '68 kg' },
    symptoms: 'Routine diabetic consultation and HbA1c review',
    arrivedAt: '10:05 AM',
    prescription: {
      medicines: ['Metformin 500mg SR (1-0-1)', 'Glimepiride 1mg (1-0-0)'],
      advice: 'Repeat fasting blood sugar after 15 days. Maintain low GI diet.',
    },
  },
];

// Initial Prescriptions Queue
const initialPrescriptions = [
  {
    id: 'RX-9921',
    patientName: 'Sourav Chattopadhyay',
    patientPhone: '+91 98302 55441',
    patientAge: 44,
    patientGender: 'Male',
    doctorName: 'Dr. Sneha Das (Dermatologist)',
    clinicName: 'Skin & Cure Clinic, Park Street Kolkata',
    rxDate: '19 Nov 2026',
    status: 'PENDING_VERIFICATION', // PENDING_VERIFICATION, VERIFIED, REJECTED, CLARIFICATION
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
    extractedMedicines: [
      { name: 'Nadoxin Ointment 10g', dosage: 'Apply twice daily', qty: 1, available: true },
      { name: 'Allegra 120mg Tablet', dosage: '1 tablet at bedtime', qty: 10, available: true },
      { name: 'Moiz Moisturizing Cream 100g', dosage: 'Liberally after bath', qty: 1, available: true },
    ],
    notes: 'Prescription clear, CDSCO Reg: WB-MED-7712.',
    submittedAt: '10:30 AM, Today',
  },
  {
    id: 'RX-9922',
    patientName: 'Anindita Sen',
    patientPhone: '+91 98319 88123',
    patientAge: 38,
    patientGender: 'Female',
    doctorName: 'Dr. Rohit Mehta (Cardiologist)',
    clinicName: 'BM Birla Heart Research Centre',
    rxDate: '18 Nov 2026',
    status: 'VERIFIED',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800',
    extractedMedicines: [
      { name: 'Rosuvas 10 Tablet', dosage: '1 tablet at bedtime', qty: 30, available: true },
      { name: 'Concor 2.5 Tablet', dosage: '1 tablet morning', qty: 30, available: true },
      { name: 'Ecosprin 75mg Tablet', dosage: '1 tablet post lunch', qty: 30, available: true },
    ],
    notes: 'Verified by Senior Pharmacist Subhash Bose.',
    submittedAt: '09:15 AM, Today',
  },
];

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

// Initial Riders Fleet
const initialRiders = [
  {
    id: 'usr-rider-01',
    name: 'Rahul Das',
    phone: '+91 98304 55667',
    vehicle: 'Hero Electric (WB-02-AZ-4921)',
    zone: 'Kolkata South & Salt Lake',
    isOnline: true,
    activeOrderId: 'OW-89214',
    cashInHand: 697.0, // Collected from previous or pending deliveries
    cashRemittedToday: 1420.0,
    rating: 4.9,
    deliveriesToday: 7,
  },
  {
    id: 'usr-rider-02',
    name: 'Sourav Mondal',
    phone: '+91 98308 11990',
    vehicle: 'Honda Activa (WB-04-EK-1120)',
    zone: 'Gariahat & Ballygunge',
    isOnline: true,
    activeOrderId: 'OW-89216',
    cashInHand: 606.0,
    cashRemittedToday: 850.0,
    rating: 4.8,
    deliveriesToday: 5,
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
    cashRemittedToday: 1100.0,
    rating: 4.7,
    deliveriesToday: 4,
  },
];

// Helper to load or initialize state
const loadInitialState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
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

  assignRider(orderId, rider) {
    return this.updateOrderStatus(orderId, 'READY_FOR_PICKUP', {
      assignedRider: {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicle: rider.vehicle,
      },
    });
  },

  verifyPickup(orderId, qrInput) {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    if (order.pickupQrCode !== qrInput.trim()) {
      throw new Error(`Invalid QR / Verification Code. Expected: ${order.pickupQrCode}`);
    }
    return this.updateOrderStatus(orderId, 'OUT_FOR_DELIVERY');
  },

  completeDelivery(orderId, otpInput, codAmountCollected = 0) {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');
    if (order.deliveryOtp !== otpInput.trim()) {
      throw new Error(`Incorrect Customer OTP. Expected: ${order.deliveryOtp}`);
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

  // === TOKEN QUEUE ACTIONS (Doctor & Receptionist Synchronized) ===
  generateToken({ patientName, patientPhone, age, gender, symptoms, type = 'WALK_IN' }) {
    const nextTokenNum = Math.max(...state.tokens.map((t) => t.tokenNumber), 10) + 1;
    const newToken = {
      tokenNumber: nextTokenNum,
      patientName,
      patientPhone,
      age: Number(age) || 30,
      gender: gender || 'Other',
      doctorName: 'Dr. Priya Sharma',
      clinicName: 'Apollo Clinic, Salt Lake Kolkata',
      room: 'Room 204',
      type,
      slot: type === 'WALK_IN' ? 'Walk-in Queue' : 'Booked',
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

  callNextToken() {
    // Find current serving token and complete it or move it
    const servingIdx = state.tokens.findIndex((t) => t.status === 'SERVING');
    const nextIdx = state.tokens.findIndex((t) => t.status === 'NEXT');
    const waitingIdx = state.tokens.findIndex((t) => t.status === 'WAITING');

    const nextTokens = state.tokens.map((t) => ({ ...t }));

    if (servingIdx !== -1) {
      nextTokens[servingIdx].status = 'COMPLETED';
    }

    if (nextIdx !== -1) {
      nextTokens[nextIdx].status = 'SERVING';
      // Promote the first waiting patient to NEXT
      if (waitingIdx !== -1) {
        nextTokens[waitingIdx].status = 'NEXT';
      }
    } else if (waitingIdx !== -1) {
      nextTokens[waitingIdx].status = 'SERVING';
      // promote subsequent
      const subsequentIdx = nextTokens.findIndex(
        (t, idx) => idx > waitingIdx && t.status === 'WAITING'
      );
      if (subsequentIdx !== -1) {
        nextTokens[subsequentIdx].status = 'NEXT';
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
