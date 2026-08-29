// ── Firebase Configuration ───────────────────────────────────────────────
// PLACEHOLDER VALUES. This course needs its OWN Firebase project (separate
// from the Fluoride course) so learner accounts and records are kept apart.
// Create a new Firebase project, then replace these values from:
// Firebase Console → Project Settings → Your Apps → Web App
const FIREBASE_CONFIG = {
  apiKey:            "REPLACE_WITH_OHE_FIREBASE_API_KEY",
  authDomain:        "REPLACE_WITH_OHE_PROJECT.firebaseapp.com",
  projectId:         "REPLACE_WITH_OHE_PROJECT",
  storageBucket:     "REPLACE_WITH_OHE_PROJECT.firebasestorage.app",
  messagingSenderId: "REPLACE_WITH_OHE_SENDER_ID",
  appId:             "REPLACE_WITH_OHE_APP_ID"
};

// ── EmailJS Configuration ────────────────────────────────────────────────
// Sign up free at emailjs.com, create a service + template, paste IDs here.
// (Can reuse the same EmailJS account as the Fluoride course if you like -
// just make sure the template supports the same merge fields.)
const EMAILJS_CONFIG = {
  serviceId:  "REPLACE_WITH_EMAILJS_SERVICE_ID",
  templateId: "REPLACE_WITH_EMAILJS_TEMPLATE_ID",
  publicKey:  "REPLACE_WITH_EMAILJS_PUBLIC_KEY"
};

// ── Admin identities ─────────────────────────────────────────────────────
// Add email addresses here for anyone who should have admin access.
// Passwords are managed entirely by Firebase Authentication - never stored here.
const ADMIN_EMAILS = [
  "emily@dentalnurse.training",
  "erica@dentalnurse.training",
];
const ADMIN_EMAIL = ADMIN_EMAILS[0]; // kept for backwards compatibility

// ── Stripe payment links ─────────────────────────────────────────────────
// PLACEHOLDER. Create a Stripe Payment Link for this course and its 1-month
// extension, then paste the URLs here.
const STRIPE_PAYMENT_URL     = "REPLACE_WITH_OHE_STRIPE_PAYMENT_LINK";
const EXTENSION_STRIPE_LINK  = "REPLACE_WITH_OHE_EXTENSION_STRIPE_LINK";
const COURSE_PRICE           = "£400";
const EXTENSION_FEE          = "£15";
const COURSE_DURATION_MONTHS = 9;
const CPD_HOURS               = 25;

// ── Course structure ─────────────────────────────────────────────────────
const MODULES = [
  { id: 1, title: "Principles of Oral Health Education & Preventive Dentistry", icon: "🪥" },
  { id: 2, title: "Diet, Nutrition and Caries Prevention",                      icon: "🍎" },
  { id: 3, title: "Oral Hygiene Techniques and Periodontal Health",             icon: "🦷" },
  { id: 4, title: "Communication, Behaviour Change and Special Groups",         icon: "💬" },
  { id: 5, title: "Professional, Legal and GDC Responsibilities in OHE",        icon: "⚖️" },
  { id: 6, title: "What an Oral Health Education Session Looks Like",           icon: "📋" },
];

const STAGES = [
  { id: "theory",    label: "Theory & MCQs",    icon: "📚", modules: [1,2,3,4,5,6] },
  { id: "written",   label: "Written Tasks",     icon: "✍️", modules: [] },
  { id: "practical", label: "Practical Work",    icon: "🦷", modules: [] },
  { id: "reflection",label: "Final Reflection",  icon: "🪞", modules: [] },
];

// ── Practical portfolio: patients & topics ───────────────────────────────
// 6 supervised patients in total. 3 are seen for TWO sessions (one topic
// each, from PCAS_TOPICS_TWICE), 3 are seen for ONE session (one topic
// each, from PCAS_TOPICS_ONCE) - 9 sessions in total. Across the 6
// patients, at least 4 of the 6 PATIENT_GROUPS below must be represented.
const PCAS_TOPICS_TWICE = [
  { code: "1", label: "Prevention of dental caries" },
  { code: "2", label: "Prevention and control of periodontal disease" },
  { code: "3", label: "Diet, tooth wear and general preventive advice" },
];
const PCAS_TOPICS_ONCE = [
  { code: "4", label: "Care of dentures, crowns, bridges or implants" },
  { code: "5", label: "Care of orthodontic or other removable appliances" },
  { code: "6", label: "A patient with additional needs or a medically complex history" },
];
const PCAS_TOPICS = [...PCAS_TOPICS_TWICE, ...PCAS_TOPICS_ONCE];

const PATIENT_GROUPS = [
  "Pregnant or nursing mother",
  "Parent/carer of a child under 11",
  "Adolescent (12-18)",
  "Adult (19-64)",
  "Older adult (65+)",
  "Patient with additional needs or medically complex",
];
