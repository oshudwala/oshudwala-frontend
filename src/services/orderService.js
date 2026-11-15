import apiClient from './api';

export const orderService = {
  async placeOrder({ items, address, paymentMethod, deliverySlot, prescriptionId, couponCode, subtotal, deliveryFee, discount, total }) {
    try {
      const response = await apiClient.post('/orders', {
        items, address, paymentMethod, deliverySlot, prescriptionId, couponCode, total
      });
      return response.data;
    } catch {
      const orderId = "OW-" + Math.floor(100000 + Math.random() * 900000);
      const deliveryOtp = Math.floor(1000 + Math.random() * 9000);
      
      const newOrder = {
        id: orderId,
        items,
        address: address || "Flat 4B, Greenwood Park, Salt Lake Sector 1, Kolkata-700064",
        paymentMethod: paymentMethod || "Cash on Delivery",
        deliverySlot: deliverySlot || "Standard Express (35-45 mins)",
        prescriptionId: prescriptionId || null,
        couponCode: couponCode || null,
        subtotal,
        deliveryFee,
        discount,
        total,
        status: "PREPARING", // PLACED, ACCEPTED, PREPARING, OUT_FOR_DELIVERY, DELIVERED
        deliveryOtp,
        placedAt: new Date().toISOString(),
        pharmacy: {
          name: "MedPlus Pharmacy",
          address: "Block EP & GP, Sector V, Salt Lake, Kolkata-700091",
          phone: "+91 98301 22334"
        },
        rider: {
          name: "Subhashis Ghosh",
          phone: "+91 98319 87654",
          vehicle: "Hero Splendor Plus (WB 02 AR 4821)",
          currentLocation: "1.2 km away — Near Karunamoyee Metro",
          temperatureBox: "Active 4°C - 8°C Insulated Unit"
        },
        timeline: [
          { status: "ORDER_PLACED", title: "Order Placed", time: "Just now", completed: true },
          { status: "PHARMACY_CONFIRMED", title: "Pharmacy Confirmed & Verified", time: "Just now", completed: true },
          { status: "PREPARING", title: "Medicines Packed in Tamper-Proof Pouch", time: "In Progress", current: true },
          { status: "OUT_FOR_DELIVERY", title: "Rider Picked Up & En Route", time: "Estimated in 15 mins", completed: false },
          { status: "DELIVERED", title: "Order Delivered with OTP Verification", time: "Estimated 35 mins", completed: false }
        ]
      };

      const existing = JSON.parse(localStorage.getItem('oshud_orders') || '[]');
      existing.unshift(newOrder);
      localStorage.setItem('oshud_orders', JSON.stringify(existing));

      return { order: newOrder, isMock: true };
    }
  },

  getUserOrders() {
    const defaultOrders = [
      {
        id: "OW-89214",
        placedAt: "2026-11-15T09:15:00.000Z",
        status: "OUT_FOR_DELIVERY",
        total: 412,
        subtotal: 372,
        deliveryFee: 40,
        discount: 0,
        paymentMethod: "Cash on Delivery",
        deliverySlot: "Standard Express",
        address: "Flat 4B, Greenwood Park, Salt Lake Sector 1, Kolkata-700064",
        deliveryOtp: "4829",
        pharmacy: {
          name: "MedPlus Pharmacy",
          address: "Block EP & GP, Sector V, Salt Lake, Kolkata-700091",
          phone: "+91 98301 22334"
        },
        rider: {
          name: "Subhashis Ghosh",
          phone: "+91 98319 87654",
          vehicle: "Hero Splendor Plus (WB 02 AR 4821)",
          currentLocation: "Near Salt Lake Stadium, 800m away"
        },
        items: [
          {
            id: "prod-1",
            name: "Dolo 650",
            quantity: 3,
            price: 32,
            packaging: "Strip of 15 Tablets"
          },
          {
            id: "prod-2",
            name: "Pan 40",
            quantity: 2,
            price: 145,
            packaging: "Strip of 15 Tablets"
          },
          {
            id: "prod-8",
            name: "Allegra 120",
            quantity: 1,
            price: 190,
            packaging: "Strip of 10 Tablets"
          }
        ],
        timeline: [
          { status: "ORDER_PLACED", title: "Order Placed", time: "09:15 AM", completed: true },
          { status: "PHARMACY_CONFIRMED", title: "Prescription Verified by MedPlus Registered Pharmacist", time: "09:18 AM", completed: true },
          { status: "PREPARING", title: "Dispensed & Sealed in Medical Pouch", time: "09:25 AM", completed: true },
          { status: "OUT_FOR_DELIVERY", title: "Rider Subhashis Ghosh is Out for Delivery", time: "09:32 AM", current: true },
          { status: "DELIVERED", title: "Delivered to Customer", time: "Expected 09:50 AM", completed: false }
        ]
      },
      {
        id: "OW-74512",
        placedAt: "2026-11-10T14:20:00.000Z",
        status: "DELIVERED",
        total: 198,
        subtotal: 168,
        deliveryFee: 30,
        discount: 0,
        paymentMethod: "UPI (Google Pay)",
        deliverySlot: "Standard Delivery",
        address: "Flat 4B, Greenwood Park, Salt Lake Sector 1, Kolkata-700064",
        pharmacy: {
          name: "Wellness Forever",
          address: "Park Circus Crossing, Kolkata-700017"
        },
        items: [
          {
            id: "prod-4",
            name: "Limcee 500 Orange Chewable",
            quantity: 2,
            price: 26,
            packaging: "Strip of 15 Chewable Tablets"
          },
          {
            id: "prod-9",
            name: "Shelcal 500",
            quantity: 1,
            price: 115,
            packaging: "Strip of 15 Tablets"
          }
        ],
        timeline: [
          { status: "ORDER_PLACED", title: "Order Placed", time: "02:20 PM", completed: true },
          { status: "DELIVERED", title: "Delivered Safely", time: "03:05 PM", completed: true }
        ]
      }
    ];

    const stored = localStorage.getItem('oshud_orders');
    if (!stored) {
      localStorage.setItem('oshud_orders', JSON.stringify(defaultOrders));
      return defaultOrders;
    }
    return JSON.parse(stored);
  },

  getOrderById(id) {
    const orders = this.getUserOrders();
    return orders.find(o => o.id === id) || orders[0];
  }
};
