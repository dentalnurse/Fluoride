// ── Firebase Configuration ───────────────────────────────────────────────
// PLACEHOLDER VALUES. The CPD hub needs its OWN Firebase project (separate
// from the Fluoride and OHE courses) so CPD accounts and records are kept
// apart. Create a new Firebase project, then replace these values from:
// Firebase Console → Project Settings → Your Apps → Web App
// Until these are filled in, the hub only works in preview mode (?preview=1).
const FIREBASE_CONFIG = {
  apiKey:            "REPLACE_WITH_CPD_FIREBASE_API_KEY",
  authDomain:        "REPLACE_WITH_CPD_PROJECT.firebaseapp.com",
  projectId:         "REPLACE_WITH_CPD_PROJECT",
  storageBucket:     "REPLACE_WITH_CPD_PROJECT.firebasestorage.app",
  messagingSenderId: "REPLACE_WITH_CPD_SENDER_ID",
  appId:             "REPLACE_WITH_CPD_APP_ID"
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
