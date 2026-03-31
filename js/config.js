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

// ── Admin credentials (hardcoded — change before going live) ─────────────
const ADMIN_EMAIL    = "emily@dentalnurse.training";
const ADMIN_PASSWORD = "wave33LIKE!";   // Change this before going live

// ── Stripe payment link ──────────────────────────────────────────────────
// Create a payment link in your Stripe dashboard and paste the URL here
const STRIPE_PAYMENT_URL = "https://buy.stripe.com/YOUR_PAYMENT_LINK";
const COURSE_PRICE       = "£100";

// ── Course structure ─────────────────────────────────────────────────────
const MODULES = [
  { id: 1, title: "Fluoride Science and Caries Prevention",        icon: "🔬" },
  { id: 2, title: "Patient Assessment and Communication",           icon: "🗣️" },
  { id: 3, title: "Clinical Application and Safety",               icon: "🦷" },
  { id: 4, title: "Professional Responsibilities and Law",          icon: "⚖️" },
  { id: 5, title: "Reluctance to Fluoride — Managing Refusal",     icon: "💬" },
];

const STAGES = [
  { id: "theory",    label: "Theory & MCQs",    icon: "📚", modules: [1,2,3,4,5] },
  { id: "written",   label: "Written Tasks",     icon: "✍️", modules: [] },
  { id: "practical", label: "Practical Work",    icon: "🦷", modules: [] },
  { id: "reflection",label: "Final Reflection",  icon: "🪞", modules: [] },
];
