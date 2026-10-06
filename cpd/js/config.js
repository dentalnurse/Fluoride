// ── Launch switch ────────────────────────────────────────────────────────
// While false, every CPD page shows a "Preview - not open yet" banner.
// Change to true when the hub is ready for learners.
const HUB_OPEN = false;

// ── Firebase Configuration ───────────────────────────────────────────────
// The CPD Hub's own Firebase project (dnt-cpd), kept separate from the
// Fluoride and OHE courses so CPD accounts and records are kept apart.
// From: Firebase Console → Project Settings → Your Apps → Web App
// Preview mode (?preview=1) still works and never touches this project.
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBXSSgUTBiZsZeQTECXhAMthEhKaaq-LP4",
  authDomain:        "dnt-cpd.firebaseapp.com",
  projectId:         "dnt-cpd",
  storageBucket:     "dnt-cpd.firebasestorage.app",
  messagingSenderId: "574879584437",
  appId:             "1:574879584437:web:701f28452291399fa7eefc"
};

// ── EmailJS Configuration ────────────────────────────────────────────────
// Can reuse the same EmailJS account/template as the Fluoride course.
// Used to email you when someone pays for a course or completes one.
const EMAILJS_CONFIG = {
  serviceId:  "service_h9qou6j",
  templateId: "template_o63hswi",
  publicKey:  "saPEjicUFr73FNtI2"
};

// ── Admin identities ─────────────────────────────────────────────────────
// Anyone listed here gets the admin panel. Keep this list in step with the
// admin emails in cpd/firestore.rules.
const ADMIN_EMAILS = [
  "emily@dentalnurse.training",
  "erica@dentalnurse.training",
];
const NOTIFY_EMAIL = "emily@dentalnurse.training";

// ── Certificate signatory ────────────────────────────────────────────────
const CERT_SIGNATORY_NAME = "Emily Bremner";
const CERT_SIGNATORY_ROLE = "Course Lead, Dental Nurse Training";
const PROVIDER_NAME       = "Dental Nurse Training";

// ── GDC development outcomes (used on course pages and certificates) ────
const GDC_OUTCOMES = {
  A: "Effective communication with patients, the dental team and others across dentistry, including when obtaining consent, dealing with complaints, and raising concerns when patients are at risk.",
  B: "Effective management of self, and effective management of others or effective work with others in the dental team, in the interests of patients; providing constructive leadership where appropriate.",
  C: "Maintenance and development of knowledge and skill within your field of practice.",
  D: "Maintenance of skills, behaviours and attitudes which maintain patient confidence in you and the dental profession and put patients' interests first.",
};
