# Oshud Wala — Patient-Facing Web Frontend

Modern, responsive, commercial healthcare and medicine delivery web platform built for **Oshud Wala**.

## 🎨 Visual Reference & Brand Identity

This frontend is designed and implemented in strict adherence to the approved Oshud Wala visual design specifications:

- **Primary Forest Green**: `#075C40`
- **Deep Forest Green**: `#06432F`
- **Dark Green**: `#092F25`
- **Secondary Green**: `#16875B`
- **Mint**: `#E7F4EB`
- **Soft Mint Background**: `#F0F8F2`
- **Warm White**: `#FAFCFA`
- **Typography**: `Manrope` for display & headings, `Inter` for interface & body.

## 🚀 Homepage Sequence

The homepage meticulously follows the approved section sequence:

1. **Header**: Brand logo, location switcher (`Dhaka, Bangladesh`), navigation links, notification popover with active badges, cart drawer counter, and user account menu.
2. **Promotional Banner (Hero Carousel)**: Multi-campaign slider with smooth transition, auto-play, manual controls, indicators, and medical still-life composition.
3. **Get your medicines via**:
   - **Add Prescription**: Interactive upload interface supporting drag & drop, JPG/PNG/PDF preview, zoom/rotate, pharmacy assignment, and progress feedback.
   - **Order On WhatsApp**: Direct channel to the configured official WhatsApp ordering line.
4. **Featured Doctors**: Verified specialists (Dr. Priya Sharma, Dr. Rohit Mehta, Dr. Sneha Das, Dr. Amit Verma) with ratings, availability badges, and interactive booking modal.
5. **Featured Pharmacies**: Partner pharmacies (MedPlus, Wellness Forever, Care N Cure, Apollo Pharmacy) with delivery availability indicators and storefront previews.
6. **Categories**: 6 core medicine and health categories (Pain Relief, Vitamins & Supplements, Skin Care, Personal Care, Diabetes Care, Respiratory Care).
7. **How It Works**: 4-step healthcare process (Discover -> Choose -> Order/Book -> Track).
8. **Why Choose Oshud Wala?**: Value propositions with custom icons.
9. **FAQ Section**: Accordion addressing medicine orders, prescription verification, pharmacy choice, appointments, and payments.
10. **Footer**: Deep forest green layout with brand credentials, quick links, healthcare links, support channels, and mobile app download badges.

## 📱 Complete Patient-Facing Pages

- **Appointments** (`/appointments`): Doctor directory, specialization filtering, interactive appointment booking with live queue token monitor.
- **Shop & Catalog** (`/shop`): Product search, category filters, prescription vs. OTC switches, sorting, and prescription upload CTA.
- **Product Details** (`/product/:id`): Drug info, strength, manufacturer, dosage instructions, contraindications, and related medications.
- **Cart** (`/cart`): Steppers, item subtotals, prescription warnings, coupon validation (`OSHUD10`, `WELCOME50`).
- **Checkout** (`/checkout`): Saved address selection, express vs scheduled delivery, prescription attachment, and payment selection.
- **Orders & Tracking** (`/orders`): Active vs history orders, multi-step visual delivery tracker, assigned rider contact & temperature box details, and delivery OTP.
- **Refers & Earn** (`/refers`): Referral code, social sharing, Oshud Coin wallet credits, and referral reward logs.
- **Patient Profile** (`/profile`): Personal info editor, address book, uploaded prescription archive with zoomable document viewer, and notification preferences.
- **Authentication**: Login with demo role switcher (`/login`), Registration (`/register`), and Password Recovery (`/forgot-password`).

## 🛠 Technology Stack

- **React 18** + **Vite**
- **Tailwind CSS** + PostCSS
- **React Router DOM 6**
- **Lucide React** (Medical & UI Icons)
- **Axios** (Centralized API client with interceptors)

## 💻 Running the Application

```bash
# Navigate to Web folder
cd Web

# Start development server
npm run dev

# Production build
npm run build
```
