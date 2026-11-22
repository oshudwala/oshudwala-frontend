import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const TRANSLATIONS = {
  en: {
    // Header & Nav
    nav_home: 'Home',
    nav_appointments: 'Appointments',
    nav_shop: 'Shop',
    nav_orders: 'Orders',
    nav_refers: 'Refers',
    sign_in: 'Sign In',
    register: 'Register',
    go_to_dashboard: 'Go to Dashboard',
    change_location: 'Change delivery location',
    cart: 'Cart',
    items: 'items',

    // Search Bar
    search_placeholder: 'Search medicines, doctors, clinics, symptoms...',
    search_voice_tooltip: 'Search by voice',
    search_medicines: 'Medicines',
    search_doctors: 'Doctors',
    search_clinics: 'Clinics',
    search_no_results: 'No matching medicines, doctors, or clinics found.',
    search_view_all: 'View all results',

    // Voice Overlay
    voice_listening: 'Listening…',
    voice_speak_now: 'Speak now — ask for medicine or doctor',
    voice_tap_stop: 'Tap the mic when you’re done',
    voice_tap_retry: 'Tap the mic to try again',
    voice_nospeech: 'Didn’t catch that. Please speak again.',
    voice_denied: 'Microphone access is blocked in browser settings.',
    voice_nomic: 'No microphone found on this device.',
    voice_network: 'Network error. Please check your connection.',
    voice_unsupported: 'Voice search isn’t supported in this browser. Try Chrome.',
    voice_close: 'Close',

    // Channels
    get_medicines_via: 'Get your medicines via',
    get_medicines_subtitle: 'Choose your preferred channel to order verified medicines with express home delivery',
    add_prescription: 'Add Prescription',
    upload_prescription: 'Upload Prescription',
    prescription_subtitle: 'Upload your doctor’s prescription directly for 30-min delivery',
    recommended_fastest: 'Recommended & Fastest',
    order_on_call: 'Order on Call',
    order_on_whatsapp: 'Order on WhatsApp',
    helpline_247: '24/7 Helpline',
    instant_order: 'Instant Order via Chat',

    // New Directory Cards
    find_doctors_title: 'Find Doctors',
    find_doctors_subtitle: 'Browse certified specialists across General Medicine, Cardiology, Dermatology & more',
    registered_doctors_badge: 'Verified Specialists Available',
    browse_all_doctors: 'Browse All Doctors',
    explore_clinics_title: 'Explore Clinics',
    explore_clinics_subtitle: 'Locate partner polyclinics, diagnostic chambers & live digital queue tokens',
    registered_clinics_badge: 'Partner Chambers & Centers',
    browse_all_clinics: 'Explore All Clinics',
    live_queue_tokens: 'Live Queue Tokens',
    zero_wait_time: 'Zero Wait Queues',

    // Featured Doctors & Clinics
    featured_doctors: 'Featured Doctors',
    featured_doctors_subtitle: 'Consult experienced doctors for better care',
    featured_clinics: 'Featured Clinics',
    featured_clinics_subtitle: 'Visit trusted polyclinics and diagnostic chambers near you',
    book_appointment: 'Book Appointment',
    view_all: 'View All',
    available_today: 'Available Today',
    on_break: 'On Break',
    chamber_offline: 'Chamber Offline',
    consultation_fee: 'Fee',
    experience_years: 'Years Exp',

    // Hero Banner
    banner_1_badge: 'Oshud Wala Care',
    banner_1_headline: 'Your Health,\nMade Simpler.',
    banner_1_subtext: 'Order medicines, book appointments, and access trusted healthcare services — all in one place.',
    banner_1_cta: 'Explore Services',
    banner_1_sec_cta: 'Upload Prescription',
    banner_2_badge: 'Superfast Delivery',
    banner_2_headline: 'Quality Medicines\nDelivered in 45 Mins.',
    banner_2_subtext: 'Sourced strictly from licensed pharmacies near you with sealed, temperature-safe packaging.',
    banner_2_cta: 'Order Medicines Now',
    banner_3_badge: 'Smart Consultations',
    banner_3_headline: 'Find & Book The\nRight Doctor Today.',
    banner_3_subtext: 'Real-time queue tracking from your phone. No more spending hours in crowded clinic waiting rooms.',
    banner_3_cta: 'Book Appointment',

    // Categories
    categories_title: 'Categories',
    categories_subtitle: 'Browse genuine medicines, personal care, and specialized healthcare products',
    cat_personal_care: 'Personal Care',
    cat_health_care: 'Health Care',
    cat_baby_mother: 'Baby & Mother',
    cat_sexual_wellness: 'Sexual Wellness',
    cat_otc_medicine: 'OTC Medicine',
    cat_medical_devices: 'Medical Devices',

    // Featured Pharmacies
    featured_pharmacies: 'Featured Pharmacies',
    featured_pharmacies_subtitle: 'Trusted, certified partner pharmacies delivering near you',
    open_now: 'Open Now',
    view_pharmacy: 'View Pharmacy',

    // How It Works
    how_it_works_title: 'How It Works',
    how_step_1: 'Choose your medicine or healthcare service',
    how_step_2: 'Upload prescription or select a service',
    how_step_3: 'Confirm your order or appointment',
    how_step_4: 'Track your order or appointment live',

    // Why Choose Us
    why_choose_title: 'Why Choose Oshud Wala?',
    why_choose_subtitle: 'Your trusted partner for better healthcare',
    benefit_trusted_pharmacies: 'Trusted\nPharmacies',
    benefit_prescription_upload: 'Easy Prescription\nUploads',
    benefit_doctor_booking: 'Doctor Appointment\nBooking',
    benefit_convenient_delivery: 'Convenient\nDelivery',
    benefit_secure_payment: 'Secure Payment\nOptions',
    benefit_order_tracking: 'Order\nTracking',

    // FAQs
    faqs_title: 'Frequently Asked Questions',
    faqs_subtitle: 'Find answers to common queries regarding medicine ordering, prescription reviews, and doctor appointments.',
    view_all_questions: 'View All Questions',
    show_less: 'Show Less',

    // Safety & Compliance Bar
    safety_title: 'Certified Patient Safety & Data Confidentiality',
    safety_desc: 'Every prescription is verified by registered pharmacists. Medical consultations and deliveries are governed by official healthcare standards and privacy safeguards.',

    // Floating Bar & Modals
    floating_bar_title: 'Need medicines or consultation quickly?',
    floating_upload: 'Upload Prescription',
    floating_call: 'Call Helpline',
    select_location: 'Select Delivery Location',
    select_location_desc: 'Choose your city or enter PIN code to check fastest express medicine delivery options in West Bengal',

    // Footer & Common
    footer_tagline: 'Your trusted healthcare partner for medicines, doctor appointments, and verified pharmacy care.',
    footer_rights: '© 2026 Oshud Wala. All rights reserved.',
    privacy_policy: 'Privacy Policy',
    terms_conditions: 'Terms & Conditions',
    contact_support: 'Contact Support',
    quick_links: 'Quick Links',
    services: 'Services',
    for_partners: 'For Partners',
    contact: 'Contact',
    join_doctor: 'Join as Doctor',
    register_pharmacy: 'Register Pharmacy',
    drive_rider: 'Deliver with Us',
    list_clinic: 'List Your Clinic',

    // Notifications
    notifications: 'Notifications',
    new_badge: '2 New',
    notif_rider_title: 'Rider is on the way!',
    notif_rider_desc: 'Kamrul Islam is 800m away with your order OW-89214. OTP: 4829',
    notif_rider_time: '10m ago',
    notif_token_title: 'Appointment Token Reminder',
    notif_token_desc: 'Dr. Priya Sharma is currently serving token GP-11. Your token: GP-14',
    notif_token_time: '25m ago',
    notif_rx_title: 'Prescription Verified',
    notif_rx_desc: 'Prescription RX-841920 approved by MedPlus pharmacist.',
    notif_rx_time: '2h ago',
    view_all_activity: 'View all activity',

    // Doctor Specialties
    'General Physician': 'General Physician',
    'Cardiologist': 'Cardiologist',
    'Dermatologist': 'Dermatologist',
    'Pediatrician': 'Pediatrician',
    'Gynecologist': 'Gynecologist',
    'Orthopedic': 'Orthopedic',
    'Neurologist': 'Neurologist',
    'ENT Specialist': 'ENT Specialist',
    in_chamber: 'In Chamber',
    in_consultation: 'In Consultation',
    verified_doctor: 'Verified Doctor',

    // Clinic Card & Modal
    open_today: 'Open Today',
    doctor_available: 'Doctor Available',
    doctors_available: 'Doctors Available',
    chamber_consultations: 'In-person chamber consultations',
    tokens_open: 'Tokens Open',
    view_doctors_book: 'View Doctors & Book',
    clinic_doctors_title: 'Consultation Doctors at this Clinic',
    clinic_doctors_subtitle: 'Select a doctor to book your chamber appointment or queue token',
    reviews: 'reviews',
    close: 'Close',
    quality_protocol: 'Verified chamber consultation under Oshud Wala Quality Protocol',

    // Pharmacy Card
    open_for_delivery: 'Open for Delivery',
    high_volume_delays: 'High Volume (Delays Expected)',
    closed_for_delivery: 'Closed for Delivery',

    // Booking Modal
    modal_book_appointment: 'Book Appointment',
    modal_token_confirmed: 'Appointment Confirmed',
    modal_token_notice: 'Chamber Booking Notice',
    token_confirmed_badge: 'Token Confirmed',
    patient_queue_token: 'Patient Queue Token',
    select_date: 'Select Date',
    available_time_slots: 'Available Time Slots',
    patient_name: 'Patient Name',
    phone_number: 'Phone Number',
    confirm_appointment: 'Confirm Appointment',
    pay_at_clinic: '(Pay at clinic)',
    queue_sms_notice: 'You will receive SMS queue reminders. You can track this token live in your Appointments dashboard.',
    done: 'Done',
    cancel: 'Cancel',
    today: 'Today',
    tomorrow: 'Tomorrow',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    slots_open: 'Slots Open',
    available: 'Available',
    chamber_location: 'Chamber Location',
    reception_phone: 'Reception Phone',
    doctor_label: 'Doctor',
    clinic_label: 'Clinic',
    date_time_label: 'Date & Time',

    // Category Items
    'Baby And Mom Care': 'Baby And Mom Care',
    'Hair Care': 'Hair Care',
    'Skin Care': 'Skin Care',
    'Body Care': 'Body Care',
    'Sexual Wellness': 'Sexual Wellness',
    'Oral Care': 'Oral Care',
    'Feminine Hygiene': 'Feminine Hygiene',
    'Miscellaneous': 'Miscellaneous',
    'Cough And Cold': 'Cough And Cold',
    'Pain Relief': 'Pain Relief',
    'Digestive Health': 'Digestive Health',
    'Infection Care': 'Infection Care',
    'Immunity Boosters': 'Immunity Boosters',
    'Fever Care': 'Fever Care',
    'First Aid Care': 'First Aid Care',
    'Skin Infections': 'Skin Infections',
    'Blood Glucose Monitors': 'Blood Glucose Monitors',
    'Test Strips': 'Test Strips',
    'BP Monitors': 'BP Monitors',
    'Cholesterol Care': 'Cholesterol Care',
    'Ayurvedic Cardiac Care': 'Ayurvedic Cardiac Care',
    'Sugar Free Products': 'Sugar Free Products',
    'Nebulizers': 'Nebulizers',
    'Digital Thermometers': 'Digital Thermometers',
    'Pulse Oximeters': 'Pulse Oximeters',
    'Weighing Scales': 'Weighing Scales',
    'Ortho Supports & Belts': 'Ortho Supports & Belts',
    'Surgical Masks & Gloves': 'Surgical Masks & Gloves',
    'Multivitamins': 'Multivitamins',
    'Calcium & Vitamin D': 'Calcium & Vitamin D',
    'Omega 3 & Fish Oil': 'Omega 3 & Fish Oil',
    'Protein Powders': 'Protein Powders',
    'Herbal Supplements': 'Herbal Supplements',
    'Antioxidants': 'Antioxidants',
    'Kids Nutrition': 'Kids Nutrition',
  },
  bn: {
    // Header & Nav
    nav_home: 'হোম',
    nav_appointments: 'অ্যাপয়েন্টমেন্ট',
    nav_shop: 'ওষুধের দোকান',
    nav_orders: 'অর্ডারসমূহ',
    nav_refers: 'রেফার করুন',
    sign_in: 'লগইন',
    register: 'রেজিস্টার',
    go_to_dashboard: 'ড্যাশবোর্ড',
    change_location: 'ডেলিভারি লোকেশন পরিবর্তন করুন',
    cart: 'কার্ট',
    items: 'টি আইটেম',

    // Search Bar
    search_placeholder: 'ওষুধ, ডাক্তার, ক্লিনিক বা লক্ষণ খুঁজুন...',
    search_voice_tooltip: 'মুখে বলে খুঁজুন',
    search_medicines: 'ওষুধসমূহ',
    search_doctors: 'ডাক্তারগণ',
    search_clinics: 'ক্লিনিকসমূহ',
    search_no_results: 'কোনো ওষুধ, ডাক্তার বা ক্লিনিক পাওয়া যায়নি।',
    search_view_all: 'সব ফলাফল দেখুন',

    // Voice Overlay
    voice_listening: 'শুনছি…',
    voice_speak_now: 'এখন বলুন — ওষুধ বা ডাক্তারের নাম বলুন',
    voice_tap_stop: 'বলা শেষ হলে মাইকে চাপুন',
    voice_tap_retry: 'আবার চেষ্টা করতে মাইকে চাপুন',
    voice_nospeech: 'কিছু শুনতে পাইনি। অনুগ্রহ করে আবার বলুন।',
    voice_denied: 'মাইক্রোফোনের অনুমতি বন্ধ আছে। ব্রাউজার সেটিংসে অনুমতি দিন।',
    voice_nomic: 'এই ডিভাইসে কোনো মাইক্রোফোন পাওয়া যায়নি।',
    voice_network: 'নেটওয়ার্ক সমস্যা। ইন্টারনেট চেক করে আবার চেষ্টা করুন।',
    voice_unsupported: 'এই ব্রাউজারে ভয়েস সার্চ চলে না। Chrome ব্যবহার করুন।',
    voice_close: 'বন্ধ করুন',

    // Channels
    get_medicines_via: 'যেভাবে ওষুধ সংগ্রহ করবেন',
    get_medicines_subtitle: 'আপনার পছন্দের মাধ্যমে দ্রুত হোম ডেলিভারিসহ যাচাইকৃত ওষুধ অর্ডার করুন',
    add_prescription: 'প্রেসক্রিপশন আপলোড',
    upload_prescription: 'প্রেসক্রিপশন দিন',
    prescription_subtitle: '৩০ মিনিটে দ্রুত ওষুধ ডেলিভারির জন্য প্রেসক্রিপশন আপলোড করুন',
    recommended_fastest: 'সবচেয়ে দ্রুত ও নির্ভরযোগ্য',
    order_on_call: 'ফোনে অর্ডার করুন',
    order_on_whatsapp: 'হোয়াটসঅ্যাপে অর্ডার',
    helpline_247: '২৪/৭ হেল্পলাইন',
    instant_order: 'সরাসরি চ্যাটে ওষুধ অর্ডার',

    // New Directory Cards
    find_doctors_title: 'ডাক্তার খুঁজুন',
    find_doctors_subtitle: 'জেনারেল মেডিসিন, হৃদরোগ, চর্মরোগ ও অন্যান্য বিশেষজ্ঞ ডাক্তারদের তালিকা দেখুন',
    registered_doctors_badge: 'নিবন্ধিত বিশেষজ্ঞ ডাক্তার',
    browse_all_doctors: 'সব ডাক্তার দেখুন',
    explore_clinics_title: 'ক্লিনিকসমূহ দেখুন',
    explore_clinics_subtitle: 'নিকটস্থ পলিক্লিনিক, ডায়াগনস্টিক চেম্বার ও ডিজিটাল লাইভ টোকেন খুঁজুন',
    registered_clinics_badge: 'পার্টনার চেম্বার ও ক্লিনিক',
    browse_all_clinics: 'সব ক্লিনিক দেখুন',
    live_queue_tokens: 'লাইভ সিরিয়াল টোকেন',
    zero_wait_time: 'দেরি ছাড়া পরামর্শ',

    // Featured Doctors & Clinics
    featured_doctors: 'বিশেষ ডাক্তারগণ',
    featured_doctors_subtitle: 'অভিজ্ঞ চিকিৎসকদের সাথে আজই পরামর্শ করুন',
    featured_clinics: 'সেরা ক্লিনিকসমূহ',
    featured_clinics_subtitle: 'আপনার এলাকার বিশ্বস্ত পলিক্লিনিক ও চেম্বারসমূহ',
    book_appointment: 'অ্যাপয়েন্টমেন্ট বুক করুন',
    view_all: 'সব দেখুন',
    available_today: 'আজ উপলব্ধ',
    on_break: 'বিরতিতে আছেন',
    chamber_offline: 'চেম্বার অফলাইন',
    consultation_fee: 'ফি',
    experience_years: 'বছরের অভিজ্ঞতা',

    // Hero Banner
    banner_1_badge: 'ওষুধ ওয়ালা কেয়ার',
    banner_1_headline: 'আপনার সুস্বাস্থ্য,\nএখন আরও সহজ।',
    banner_1_subtext: 'ওষুধ অর্ডার, ডাক্তার বুকিং এবং নির্ভরযোগ্য স্বাস্থ্যসেবা — সবকিছু এক জায়গায়।',
    banner_1_cta: 'সেবাসমূহ দেখুন',
    banner_1_sec_cta: 'প্রেসক্রিপশন আপলোড',
    banner_2_badge: 'দ্রুত ডেলিভারি',
    banner_2_headline: 'গুণগত মানের ওষুধ\n৪৫ মিনিটে ডেলিভারি।',
    banner_2_subtext: 'লাইসেন্সপ্রাপ্ত ফার্মেসি থেকে সিল করা ও তাপমাত্রা-সুরক্ষিত প্যাকেজিংয়ে সরবরাহ।',
    banner_2_cta: 'এখনই ওষুধ অর্ডার করুন',
    banner_3_badge: 'স্মার্ট পরামর্শ',
    banner_3_headline: 'সঠিক বিশেষজ্ঞ ডাক্তার\nখুঁজুন ও বুক করুন।',
    banner_3_subtext: 'মোবাইল থেকেই লাইভ সিরিয়াল টোকেন ট্র্যাক করুন। চেম্বারের দীর্ঘ লাইনে দাঁড়িয়ে থাকার ঝামেলা নেই।',
    banner_3_cta: 'অ্যাপয়েন্টমেন্ট নিন',

    // Categories
    categories_title: 'ক্যাটাগরিসমূহ',
    categories_subtitle: 'প্রয়োজনীয় ওষুধ, ব্যক্তিগত যত্ন ও বিশেষ স্বাস্থ্যপণ্য দেখুন',
    cat_personal_care: 'পার্সোনাল কেয়ার',
    cat_health_care: 'হেলথ কেয়ার',
    cat_baby_mother: 'মা ও শিশু যত্ন',
    cat_sexual_wellness: 'সেক্সুয়াল ওয়েলনেস',
    cat_otc_medicine: 'ওটিসি ওষুধ',
    cat_medical_devices: 'মেডিকেল ডিভাইস',

    // Featured Pharmacies
    featured_pharmacies: 'সেরা ফার্মেসিসমূহ',
    featured_pharmacies_subtitle: 'আপনার এলাকার বিশ্বস্ত ও নিবন্ধিত পার্টনার ফার্মেসি',
    open_now: 'এখন খোলা আছে',
    view_pharmacy: 'ফার্মেসি দেখুন',

    // How It Works
    how_it_works_title: 'যেভাবে কাজ করে',
    how_step_1: 'প্রয়োজনীয় ওষুধ বা স্বাস্থ্যসেবা বেছে নিন',
    how_step_2: 'প্রেসক্রিপশন আপলোড করুন বা সেবা সিলেক্ট করুন',
    how_step_3: 'আপনার অর্ডার বা অ্যাপয়েন্টমেন্ট নিশ্চিত করুন',
    how_step_4: 'লাইভ ডেলিভারি বা অ্যাপয়েন্টমেন্ট সিরিয়াল ট্র্যাক করুন',

    // Why Choose Us
    why_choose_title: 'কেন ওষুধ ওয়ালা বেছে নেবেন?',
    why_choose_subtitle: 'উন্নত স্বাস্থ্যসেবায় আপনার বিশ্বস্ত সাথী',
    benefit_trusted_pharmacies: 'বিশ্বস্ত\nফার্মেসি',
    benefit_prescription_upload: 'সহজ প্রেসক্রিপশন\nআপলোড',
    benefit_doctor_booking: 'ডাক্তার অ্যাপয়েন্টমেন্ট\nবুকিং',
    benefit_convenient_delivery: 'দ্রুত ও সহজ\nডেলিভারি',
    benefit_secure_payment: 'নিরাপদ পেমেন্ট\nপদ্ধতি',
    benefit_order_tracking: 'লাইভ অর্ডার\nট্র্যাকিং',

    // FAQs
    faqs_title: 'সাধারণ জিজ্ঞাসাসমূহ (FAQ)',
    faqs_subtitle: 'ওষুধ অর্ডার, প্রেসক্রিপশন যাচাই ও ডাক্তার অ্যাপয়েন্টমেন্ট সম্পর্কিত তথ্য।',
    view_all_questions: 'সব প্রশ্ন দেখুন',
    show_less: 'কম দেখুন',

    // Safety & Compliance Bar
    safety_title: 'নিবন্ধিত স্বাস্থ্য নিরাপত্তা ও গোপনীয়তার নিশ্চয়তা',
    safety_desc: 'প্রতিটি প্রেসক্রিপশন সরকারি নিবন্ধিত ফার্মাসিস্ট দ্বারা যাচাই করা হয়। সমস্ত চিকিৎসা পরামর্শ ও ডেলিভারি স্বাস্থ্যবিধি মেনে পরিচালিত।',

    // Floating Bar & Modals
    floating_bar_title: 'দ্রুত ওষুধ বা ডাক্তার পরামর্শ প্রয়োজন?',
    floating_upload: 'প্রেসক্রিপশন আপলোড',
    floating_call: 'হেল্পলাইনে কল করুন',
    select_location: 'ডেলিভারি লোকেশন নির্বাচন করুন',
    select_location_desc: 'পশ্চিমবঙ্গে আপনার এলাকা বা পিন কোড লিখে দ্রুততম এক্সপ্রেস ওষুধ ডেলিভারি চেক করুন',

    // Footer & Common
    footer_tagline: 'ওষুধ, ডাক্তার অ্যাপয়েন্টমেন্ট ও যাচাইকৃত ফার্মেসি সেবায় আপনার বিশ্বস্ত মাধ্যম।',
    footer_rights: '© ২০২৬ ওষুধ ওয়ালা। সর্বস্বত্ব সংরক্ষিত।',
    privacy_policy: 'প্রাইভেসি পলিসি',
    terms_conditions: 'শর্তাবলী ও নিয়মাবলী',
    contact_support: 'কাস্টমার সাপোর্ট',
    quick_links: 'কুইক লিঙ্কস',
    services: 'সেবাসমূহ',
    for_partners: 'পার্টনারদের জন্য',
    contact: 'যোগাযোগ',
    join_doctor: 'ডাক্তার হিসেবে যুক্ত হন',
    register_pharmacy: 'ফার্মেসি নিবন্ধন করুন',
    drive_rider: 'রাইডার হিসেবে কাজ করুন',
    list_clinic: 'ক্লিনিক যুক্ত করুন',

    // Notifications
    notifications: 'বিজ্ঞপ্তি',
    new_badge: '২টি নতুন',
    notif_rider_title: 'রাইডার রওনা হয়েছেন!',
    notif_rider_desc: 'কামরুল ইসলাম আপনার অর্ডার OW-89214 নিয়ে ৮০০ মিটার দূরে আছেন। OTP: ৪৮২৯',
    notif_rider_time: '১০ মিনিট আগে',
    notif_token_title: 'অ্যাপয়েন্টমেন্ট সিরিয়াল রিমাইন্ডার',
    notif_token_desc: 'ডাঃ প্রিয়া শর্মা বর্তমানে টোকেন GP-11 দেখছেন। আপনার সিরিয়াল: GP-14',
    notif_token_time: '২৫ মিনিট আগে',
    notif_rx_title: 'প্রেসক্রিপশন যাচাই সম্পন্ন',
    notif_rx_desc: 'মেডপ্লাস ফার্মাসিস্ট প্রেসক্রিপশন RX-841920 অনুমোদন করেছেন।',
    notif_rx_time: '২ ঘণ্টা আগে',
    view_all_activity: 'সমস্ত কার্যকলাপ দেখুন',

    // Doctor Specialties
    'General Physician': 'জেনারেল ফিজিশিয়ান',
    'Cardiologist': 'হৃদরোগ বিশেষজ্ঞ',
    'Dermatologist': 'চর্মরোগ বিশেষজ্ঞ',
    'Pediatrician': 'শিশু বিশেষজ্ঞ',
    'Gynecologist': 'স্ত্রীরোগ বিশেষজ্ঞ',
    'Orthopedic': 'অর্থোপেডিক বিশেষজ্ঞ',
    'Neurologist': 'স্নায়ুরোগ বিশেষজ্ঞ',
    'ENT Specialist': 'নাক-কান-গলা বিশেষজ্ঞ',
    in_chamber: 'চেম্বারে আছেন',
    in_consultation: 'পরামর্শ দিচ্ছেন',
    verified_doctor: 'যাচাইকৃত চিকিৎসক',

    // Clinic Card & Modal
    open_today: 'আজ খোলা আছে',
    doctor_available: 'ডাক্তার উপলব্ধ',
    doctors_available: 'ডাক্তার উপলব্ধ',
    chamber_consultations: 'সরাসরি চেম্বার পরামর্শ',
    tokens_open: 'সিরিয়াল চালু',
    view_doctors_book: 'ডাক্তারগণ দেখুন ও বুক করুন',
    clinic_doctors_title: 'এই ক্লিনিকের কনসালট্যান্ট ডাক্তারগণ',
    clinic_doctors_subtitle: 'চেম্বার অ্যাপয়েন্টমেন্ট বা সিরিয়াল টোকেন নিতে ডাক্তার নির্বাচন করুন',
    reviews: 'রিভিউ',
    close: 'বন্ধ করুন',
    quality_protocol: 'ওষুধ ওয়ালা মানদণ্ড অনুসারে যাচাইকৃত চিকিৎসা পরামর্শ',

    // Pharmacy Card
    open_for_delivery: 'ডেলিভারি চালু আছে',
    high_volume_delays: 'অধিক অর্ডার (সামান্য বিলম্ব হতে পারে)',
    closed_for_delivery: 'এখন ডেলিভারি বন্ধ',

    // Booking Modal
    modal_book_appointment: 'অ্যাপয়েন্টমেন্ট বুক করুন',
    modal_token_confirmed: 'অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে',
    modal_token_notice: 'চেম্বার বুকিং সংক্রান্ত তথ্য',
    token_confirmed_badge: 'টোকেন নিশ্চিত হয়েছে',
    patient_queue_token: 'রোগীর কিউ সিরিয়াল টোকেন',
    select_date: 'তারিখ নির্বাচন করুন',
    available_time_slots: 'উপলব্ধ সময়সূচি',
    patient_name: 'রোগীর নাম',
    phone_number: 'মোবাইল নম্বর',
    confirm_appointment: 'অ্যাপয়েন্টমেন্ট নিশ্চিত করুন',
    pay_at_clinic: '(চেম্বারে পরিশোধ করুন)',
    queue_sms_notice: 'আপনি এসএমএসে সিরিয়াল আপডেট পাবেন। অ্যাপয়েন্টমেন্ট পেজে লাইভ ট্র্যাক করতে পারবেন।',
    done: 'সম্পন্ন',
    cancel: 'বাতিল',
    today: 'আজ',
    tomorrow: 'আগামীকাল',
    wednesday: 'বুধবার',
    thursday: 'বৃহস্পতিবার',
    slots_open: 'স্লট খোলা আছে',
    available: 'উপলব্ধ',
    chamber_location: 'চেম্বারের ঠিকানা',
    reception_phone: 'রিসেপশন ফোন',
    doctor_label: 'ডাক্তার',
    clinic_label: 'ক্লিনিক',
    date_time_label: 'তারিখ ও সময়',

    // Category Items
    'Baby And Mom Care': 'মা ও শিশু যত্ন',
    'Hair Care': 'চুলের যত্ন',
    'Skin Care': 'ত্বকের যত্ন',
    'Body Care': 'শরীরের যত্ন',
    'Sexual Wellness': 'সেক্সুয়াল ওয়েলনেস',
    'Oral Care': 'দাঁতের যত্ন',
    'Feminine Hygiene': 'নারী স্বাস্থ্য ও হাইজিন',
    'Miscellaneous': 'বিবিধ যত্ন',
    'Cough And Cold': 'কাশি ও সর্দি',
    'Pain Relief': 'ব্যথানাশক',
    'Digestive Health': 'হজম ও পেটের যত্ন',
    'Infection Care': 'সংক্রমণ প্রতিরোধ',
    'Immunity Boosters': 'রোগ প্রতিরোধ ক্ষমতা',
    'Fever Care': 'জ্বরের যত্ন',
    'First Aid Care': 'ফার্স্ট এইড',
    'Skin Infections': 'ত্বকের সংক্রমণ',
    'Blood Glucose Monitors': 'গ্লুকোজ মনিটর',
    'Test Strips': 'টেস্ট স্ট্রিপস',
    'BP Monitors': 'রক্তচাপ মাপার যন্ত্র',
    'Cholesterol Care': 'কোলেস্টেরল কেয়ার',
    'Ayurvedic Cardiac Care': 'আয়ুর্বেদিক হার্ট কেয়ার',
    'Sugar Free Products': 'সুগার ফ্রি পণ্য',
    'Nebulizers': 'নেবুলাইজার',
    'Digital Thermometers': 'ডিজিটাল থার্মোমিটার',
    'Pulse Oximeters': 'পালস অক্সিমিটার',
    'Weighing Scales': 'ওজন মাপার যন্ত্র',
    'Ortho Supports & Belts': 'অর্থোপেডিক সাপোর্ট',
    'Surgical Masks & Gloves': 'মাস্ক ও গ্লাভস',
    'Multivitamins': 'মাল্টিভিটামিন',
    'Calcium & Vitamin D': 'ক্যালসিয়াম ও ভিটামিন ডি',
    'Omega 3 & Fish Oil': 'ওমেগা ৩ ও ফিশ অয়েল',
    'Protein Powders': 'প্রোটিন সাপ্লিমেন্ট',
    'Herbal Supplements': 'ভেষজ সাপ্লিমেন্ট',
    'Antioxidants': 'অ্যান্টিঅক্সিডেন্ট',
    'Kids Nutrition': 'শিশুদের পুষ্টি',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('oshud_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    const valid = lang === 'bn' ? 'bn' : 'en';
    setLanguageState(valid);
    try {
      localStorage.setItem('oshud_language', valid);
      window.dispatchEvent(new CustomEvent('oshud_language_changed', { detail: valid }));
    } catch {}
  };

  const t = (key, fallback = '') => {
    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isBengali: language === 'bn' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
