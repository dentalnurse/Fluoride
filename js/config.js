// ── Firebase Configuration ───────────────────────────────────────────────
// Replace these values with your own Firebase project config
// Get them from: Firebase Console → Project Settings → Your Apps → Web App
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCofwedLfZrFBikCFkFGCRTGv26TbQLxNY",
  authDomain:        "fluoride-b2729.firebaseapp.com",
  projectId:         "fluoride-b2729",
  storageBucket:     "fluoride-b2729.firebasestorage.app",
  messagingSenderId: "917895943537",
  appId:             "1:917895943537:web:707ec2006effba107fd2d0"
};

// ── EmailJS Configuration ────────────────────────────────────────────────
// Sign up free at emailjs.com, create a service + template, paste IDs here
const EMAILJS_CONFIG = {
  serviceId:  "service_h9qou6j",
  templateId: "template_o63hswi",
  publicKey:  "saPEjicUFr73FNtI2"
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
// Create a payment link in your Stripe dashboard and paste the URL here
const STRIPE_PAYMENT_URL     = "https://buy.stripe.com/YOUR_PAYMENT_LINK";
// TODO: this is a Stripe test-mode link - replace with the live Payment Link before launch
const EXTENSION_STRIPE_LINK  = "https://buy.stripe.com/test_aFa4gAgDe9t68PL915bZe04";
const COURSE_PRICE           = "£120";
const COURSE_ORIGINAL_PRICE  = "£150";
const EXTENSION_FEE          = "£12";
const COURSE_DURATION_MONTHS = 3;

// ── Course structure ─────────────────────────────────────────────────────
const MODULES = [
  { id: 1, title: "Fluoride Science and Caries Prevention",        icon: "🔬" },
  { id: 2, title: "Patient Assessment and Communication",           icon: "🗣️" },
  { id: 3, title: "Clinical Application and Safety",               icon: "🦷" },
  { id: 4, title: "Professional Responsibilities and Law",          icon: "⚖️" },
  { id: 5, title: "Reluctance to Fluoride - Managing Refusal",     icon: "💬" },
];

const STAGES = [
  { id: "theory",    label: "Theory & MCQs",    icon: "📚", modules: [1,2,3,4,5] },
  { id: "written",   label: "Written Tasks",     icon: "✍️", modules: [] },
  { id: "practical", label: "Practical Work",    icon: "🦷", modules: [] },
  { id: "reflection",label: "Final Reflection",  icon: "🪞", modules: [] },
];
