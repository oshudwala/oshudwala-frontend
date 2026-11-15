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
        address: address || "House 24, Road 7, Dhanmondi, Dhaka",
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
          address: "Road 2, Dhanmondi, Dhaka",
          phone: "+880 1711-223344"
        },
        rider: {
          name: "Kamrul Islam",
          phone: "+880 1819-987654",
          vehicle: "Yamaha Saluto 125 (Dhaka Metro-Ha 34-9182)",
          currentLocation: "1.2 km away — Near Shimanto Square",
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
        total: 395,
        subtotal: 355,
        deliveryFee: 40,
        discount: 0,
        paymentMethod: "Cash on Delivery",
        deliverySlot: "Standard Express",
        address: "House 24, Road 7, Dhanmondi, Dhaka",
        deliveryOtp: "4829",
        pharmacy: {
          name: "MedPlus Pharmacy",
          address: "Road 2, Dhanmondi, Dhaka",
          phone: "+880 1711-223344"
        },
        rider: {
          name: "Kamrul Islam",
          phone: "+880 1819-987654",
          vehicle: "Yamaha Saluto 125 (Dhaka Metro-Ha 34-9182)",
          currentLocation: "Near Dhanmondi Lake, 800m away"
        },
        items: [
          {
            id: "prod-1",
            name: "Napa Extra",
            quantity: 3,
            price: 30,
            packaging: "Strip of 10 Tablets"
          },
          {
            id: "prod-2",
            name: "Sergel 20",
            quantity: 2,
            price: 98,
            packaging: "Strip of 14 Capsules"
          },
          {
            id: "prod-8",
            name: "Fexo 120",
            quantity: 1,
            price: 90,
            packaging: "Strip of 10 Tablets"
          }
        ],
        timeline: [
          { status: "ORDER_PLACED", title: "Order Placed", time: "09:15 AM", completed: true },
          { status: "PHARMACY_CONFIRMED", title: "Prescription Verified by MedPlus Pharmacist", time: "09:18 AM", completed: true },
          { status: "PREPARING", title: "Dispensed & Sealed in Medical Pouch", time: "09:25 AM", completed: true },
          { status: "OUT_FOR_DELIVERY", title: "Rider Kamrul Islam is Out for Delivery", time: "09:32 AM", current: true },
          { status: "DELIVERED", title: "Delivered to Customer", time: "Expected 09:50 AM", completed: false }
        ]
      },
      {
        id: "OW-74512",
        placedAt: "2026-11-10T14:20:00.000Z",
        status: "DELIVERED",
        total: 215,
        subtotal: 185,
        deliveryFee: 30,
        discount: 0,
        paymentMethod: "bKash Online",
        deliverySlot: "Standard Delivery",
        address: "House 24, Road 7, Dhanmondi, Dhaka",
        pharmacy: {
          name: "Wellness Forever",
          address: "Avenue 4, Block C, Banani, Dhaka"
        },
        items: [
          {
            id: "prod-4",
            name: "Ceevit 250 Chewable",
            quantity: 1,
            price: 110,
            packaging: "Bottle of 50 Tablets"
          },
          {
            id: "prod-5",
            name: "Bicozin Syrup",
            quantity: 1,
            price: 75,
            packaging: "Bottle of 100 ml"
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
