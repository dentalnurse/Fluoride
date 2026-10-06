// CPD hub data layer. Every page talks to the database through this file.
//
// Two back ends with the same functions:
//   - Firebase (live): used once cpd/js/config.js has real Firebase values.
//   - Preview: add ?preview=1 to any page. Everything is stored in this
//     browser only (localStorage), with a sample learner who is also an
//     admin, so the whole hub can be tried before Firebase is set up.
//
// Database layout (Firebase):
//   courses/{slug}                   course details shown in the catalogue
//   courseContent/{slug}             lessons, quiz, reflection questions
//   learners/{uid}                   learner profile
//   learners/{uid}/progress/{slug}   progress, quiz, reflection, feedback, certificate
//   learners/{uid}/orders/{slug}     "I've paid" records waiting for an admin to check
//   access/{uid}                     { courses: { slug: {...} } } - admin-only write
//   admins/{email}                   extra admins added in the admin hub
//   media/{id}                       uploaded pictures/videos (files live in Storage)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
         sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, collectionGroup, getDocs,
         query, where, serverTimestamp, deleteField } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL, deleteObject }
         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

export const PREVIEW    = new URLSearchParams(location.search).get('preview') === '1';
export const CONFIGURED = !JSON.stringify(FIREBASE_CONFIG).includes('REPLACE_WITH');
const LIVE = CONFIGURED && !PREVIEW;

// Keep ?preview=1 on internal links while previewing.
export function link(href) {
  if (!PREVIEW) return href;
  const [path, hash] = href.split('#');
  return path + (path.includes('?') ? '&' : '?') + 'preview=1' + (hash ? '#' + hash : '');
}

export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 100;

// Summary fields stored with the course details so catalogue pages don't need
// to load the full course content.
export function deriveMeta(meta, content) {
  const lessons = (content && content.lessons) || [];
  return { ...meta,
    lessonTitles: lessons.map(l => l.title),
    questionCount: ((content && content.quiz && content.quiz.questions) || []).length,
    passMark: Number((content && content.quiz && content.quiz.passMark) || 80) };
}

const lc = (e) => String(e || '').trim().toLowerCase();
const now = () => new Date().toISOString();

// ═════════════════════════════════════════════════════════════════════════
// Firebase back end
// ═════════════════════════════════════════════════════════════════════════
let auth, db, storage;
if (LIVE) {
  const app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app); db = getFirestore(app); storage = getStorage(app);
}

const fb = {
  async getSessionUser() {
    if (!auth) return null; // Firebase not set up yet
    const user = await new Promise(res => { const off = onAuthStateChanged(auth, u => { off(); res(u); }); });
    if (!user) return null;
    let profile = {};
    try { const s = await getDoc(doc(db, 'learners', user.uid)); if (s.exists()) profile = s.data(); } catch (e) {}
    let isAdmin = ADMIN_EMAILS.map(lc).includes(lc(user.email));
    if (!isAdmin) { try { isAdmin = (await getDoc(doc(db, 'admins', lc(user.email)))).exists(); } catch (e) {} }
    return { uid: user.uid, email: user.email, name: profile.name || user.email, gdc: profile.gdc || '', workplace: profile.workplace || '', isAdmin };
  },
  async login(email, password) { await signInWithEmailAndPassword(auth, email, password); },
  async register({ name, email, gdc, workplace, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'learners', cred.user.uid), { name, email, gdc, workplace, createdAt: serverTimestamp() });
  },
  async resetPassword(email) { await sendPasswordResetEmail(auth, email); },
  async logout() { await signOut(auth); },
  async updateProfile(uid, data) { await setDoc(doc(db, 'learners', uid), data, { merge: true }); },

  async listCourses(includeAll) {
    if (!db) return []; // Firebase not set up yet
    const q = includeAll ? collection(db, 'courses') : query(collection(db, 'courses'), where('status', 'in', ['live', 'coming-soon']));
    return (await getDocs(q)).docs.map(d => d.data());
  },
  async getCourse(slug) { try { const s = await getDoc(doc(db, 'courses', slug)); return s.exists() ? s.data() : null; } catch (e) { return null; } },
  async getCourseContent(slug) { const s = await getDoc(doc(db, 'courseContent', slug)); return s.exists() ? s.data() : null; },
  async saveCourse(meta, content) {
    await setDoc(doc(db, 'courseContent', meta.slug), content);
    await setDoc(doc(db, 'courses', meta.slug), { ...deriveMeta(meta, content), updatedAt: serverTimestamp() });
  },
  async deleteCourse(slug) { await deleteDoc(doc(db, 'courseContent', slug)); await deleteDoc(doc(db, 'courses', slug)); },

  async getAccess(uid) { const s = await getDoc(doc(db, 'access', uid)); return s.exists() ? (s.data().courses || {}) : {}; },
  async grantAccess(uid, slug, by, note) {
    await setDoc(doc(db, 'access', uid), { courses: { [slug]: { grantedAt: now(), grantedBy: by, note: note || '' } } }, { merge: true });
    try { const o = doc(db, 'learners', uid, 'orders', slug); if ((await getDoc(o)).exists()) await updateDoc(o, { status: 'unlocked', unlockedAt: now(), unlockedBy: by }); } catch (e) {}
  },
  async revokeAccess(uid, slug) { await updateDoc(doc(db, 'access', uid), { ['courses.' + slug]: deleteField() }); },

  async createOrder(user, course) {
    await setDoc(doc(db, 'learners', user.uid, 'orders', course.slug), {
      uid: user.uid, name: user.name, email: user.email, gdc: user.gdc, slug: course.slug,
      title: course.title, price: course.price, status: 'pending', createdAt: now() });
  },
  async getOrders(uid) { return (await getDocs(collection(db, 'learners', uid, 'orders'))).docs.map(d => d.data()); },
  async listAllOrders() { return (await getDocs(collectionGroup(db, 'orders'))).docs.map(d => d.data()); },
  async deleteOrder(uid, slug) { await deleteDoc(doc(db, 'learners', uid, 'orders', slug)); },

  async getProgress(uid, slug) { const s = await getDoc(doc(db, 'learners', uid, 'progress', slug)); return s.exists() ? s.data() : null; },
  async listMyProgress(uid) { return (await getDocs(collection(db, 'learners', uid, 'progress'))).docs.map(d => d.data()); },
  async saveProgress(uid, slug, data) { await setDoc(doc(db, 'learners', uid, 'progress', slug), { ...data, uid, slug, lastActivity: now() }, { merge: true }); },
  async resetProgress(uid, slug) { await deleteDoc(doc(db, 'learners', uid, 'progress', slug)); },

  async listLearners() { return (await getDocs(collection(db, 'learners'))).docs.map(d => ({ uid: d.id, ...d.data() })); },
  async listAllAccess() { const out = {}; (await getDocs(collection(db, 'access'))).docs.forEach(d => { out[d.id] = d.data().courses || {}; }); return out; },
  async listAllProgress() { return (await getDocs(collectionGroup(db, 'progress'))).docs.map(d => d.data()); },

  async listAdmins() { return (await getDocs(collection(db, 'admins'))).docs.map(d => ({ email: d.id, ...d.data() })); },
  async addAdmin(email, by) { await setDoc(doc(db, 'admins', lc(email)), { addedBy: by, addedAt: now() }); },
  async removeAdmin(email) { await deleteDoc(doc(db, 'admins', lc(email))); },

  async listMedia() { return (await getDocs(collection(db, 'media'))).docs.map(d => ({ id: d.id, ...d.data() })); },
  uploadMedia(file, by, onProgress) {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      const path = 'media/' + id + '-' + file.name.replace(/[^\w.-]+/g, '_');
      const task = uploadBytesResumable(sRef(storage, path), file, { contentType: file.type });
      task.on('state_changed', s => onProgress && onProgress(s.bytesTransferred / s.totalBytes), reject, async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        const item = { name: file.name, url, path, type: file.type.startsWith('video') ? 'video' : 'image', size: file.size, uploadedAt: now(), uploadedBy: by };
        await setDoc(doc(db, 'media', id), item);
        resolve({ id, ...item });
      });
    });
  },
  async deleteMedia(item) { try { await deleteObject(sRef(storage, item.path)); } catch (e) {} await deleteDoc(doc(db, 'media', item.id)); },
};

// ═════════════════════════════════════════════════════════════════════════
// Preview back end (this browser only)
// ═════════════════════════════════════════════════════════════════════════
const PKEY = 'cpd_preview_db_v1';
const PUSER = { uid: 'preview-uid', email: 'preview@example.com', name: 'Jordan Sample', gdc: '123456', workplace: 'Sample Dental Practice', isAdmin: true };
function pload() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(PKEY)); } catch (e) {}
  if (!d) {
    d = { courses: {}, content: {}, learners: { [PUSER.uid]: { name: PUSER.name, email: PUSER.email, gdc: PUSER.gdc, workplace: PUSER.workplace, createdAt: now() } },
          access: {}, progress: {}, orders: {}, admins: {}, media: {}, loggedOut: false };
    if (typeof CPD_DEMO_COURSE !== 'undefined') {
      const { meta, content } = CPD_DEMO_COURSE;
      d.courses[meta.slug] = { ...deriveMeta(meta, content), updatedAt: now() };
      d.content[meta.slug] = content;
      d.access[PUSER.uid] = { [meta.slug]: { grantedAt: now(), grantedBy: 'preview', note: 'Demo' } };
    }
  }
  return d;
}
function psave(d) { try { localStorage.setItem(PKEY, JSON.stringify(d)); } catch (e) { toast('Preview storage is full - try a smaller file.', 'error'); throw e; } }
const clone = (x) => x == null ? x : JSON.parse(JSON.stringify(x));

const pv = {
  async getSessionUser() { return pload().loggedOut ? null : { ...PUSER }; },
  async login() { const d = pload(); d.loggedOut = false; psave(d); },
  async register() { const d = pload(); d.loggedOut = false; psave(d); },
  async resetPassword() {},
  async logout() { const d = pload(); d.loggedOut = true; psave(d); },
  async updateProfile(uid, data) { const d = pload(); d.learners[uid] = { ...d.learners[uid], ...data }; psave(d); },

  async listCourses(includeAll) { return Object.values(pload().courses).filter(c => includeAll || ['live', 'coming-soon'].includes(c.status)).map(clone); },
  async getCourse(slug) { return clone(pload().courses[slug] || null); },
  async getCourseContent(slug) { return clone(pload().content[slug] || null); },
  async saveCourse(meta, content) { const d = pload(); d.courses[meta.slug] = { ...deriveMeta(meta, content), updatedAt: now() }; d.content[meta.slug] = content; psave(d); },
  async deleteCourse(slug) { const d = pload(); delete d.courses[slug]; delete d.content[slug]; psave(d); },

  async getAccess(uid) { return clone(pload().access[uid] || {}); },
  async grantAccess(uid, slug, by, note) {
    const d = pload(); d.access[uid] = d.access[uid] || {}; d.access[uid][slug] = { grantedAt: now(), grantedBy: by, note: note || '' };
    const o = d.orders[uid + '/' + slug]; if (o) Object.assign(o, { status: 'unlocked', unlockedAt: now(), unlockedBy: by });
    psave(d);
  },
  async revokeAccess(uid, slug) { const d = pload(); if (d.access[uid]) delete d.access[uid][slug]; psave(d); },

  async createOrder(user, course) { const d = pload(); d.orders[user.uid + '/' + course.slug] = { uid: user.uid, name: user.name, email: user.email, gdc: user.gdc, slug: course.slug, title: course.title, price: course.price, status: 'pending', createdAt: now() }; psave(d); },
  async getOrders(uid) { return Object.values(pload().orders).filter(o => o.uid === uid).map(clone); },
  async listAllOrders() { return Object.values(pload().orders).map(clone); },
  async deleteOrder(uid, slug) { const d = pload(); delete d.orders[uid + '/' + slug]; psave(d); },

  async getProgress(uid, slug) { return clone(pload().progress[uid + '/' + slug] || null); },
  async listMyProgress(uid) { return Object.values(pload().progress).filter(p => p.uid === uid).map(clone); },
  async saveProgress(uid, slug, data) { const d = pload(); const k = uid + '/' + slug; d.progress[k] = { ...(d.progress[k] || {}), ...clone(data), uid, slug, lastActivity: now() }; psave(d); },
  async resetProgress(uid, slug) { const d = pload(); delete d.progress[uid + '/' + slug]; psave(d); },

  async listLearners() { return Object.entries(pload().learners).map(([uid, l]) => ({ uid, ...l })); },
  async listAllAccess() { return clone(pload().access); },
  async listAllProgress() { return Object.values(pload().progress).map(clone); },

  async listAdmins() { return Object.entries(pload().admins).map(([email, a]) => ({ email, ...a })); },
  async addAdmin(email, by) { const d = pload(); d.admins[lc(email)] = { addedBy: by, addedAt: now() }; psave(d); },
  async removeAdmin(email) { const d = pload(); delete d.admins[lc(email)]; psave(d); },

  async listMedia() { return Object.entries(pload().media).map(([id, m]) => ({ id, ...m })); },
  uploadMedia(file, by, onProgress) {
    // Preview keeps files inside the browser, so only small ones fit.
    return new Promise((resolve, reject) => {
      if (file.size > 1.5 * 1024 * 1024) { reject(new Error('In preview mode files must be under 1.5MB. The live hub allows images up to ' + MAX_IMAGE_MB + 'MB and videos up to ' + MAX_VIDEO_MB + 'MB.')); return; }
      const r = new FileReader();
      r.onload = () => {
        try {
          const d = pload(); const id = Date.now().toString(36);
          const item = { name: file.name, url: r.result, path: '', type: file.type.startsWith('video') ? 'video' : 'image', size: file.size, uploadedAt: now(), uploadedBy: by };
          d.media[id] = item; psave(d); onProgress && onProgress(1); resolve({ id, ...item });
        } catch (e) { reject(e); }
      };
      r.onerror = reject; r.readAsDataURL(file);
    });
  },
  async deleteMedia(item) { const d = pload(); delete d.media[item.id]; psave(d); },
};

const api = PREVIEW ? pv : fb;
export const {
  getSessionUser, login, register, resetPassword, logout, updateProfile,
  listCourses, getCourse, getCourseContent, saveCourse, deleteCourse,
  getAccess, grantAccess, revokeAccess,
  createOrder, getOrders, listAllOrders, deleteOrder,
  getProgress, listMyProgress, saveProgress, resetProgress,
  listLearners, listAllAccess, listAllProgress,
  listAdmins, addAdmin, removeAdmin,
  listMedia, uploadMedia, deleteMedia,
} = api;

export function resetPreview() { localStorage.removeItem(PKEY); }

// Best-effort email to the course team (EmailJS). Never blocks the learner.
export function notify(subject, message, learner) {
  if (PREVIEW) return;
  try {
    if (typeof emailjs === 'undefined') return;
    emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
      to_email: NOTIFY_EMAIL, to_name: 'Emily', subject,
      learner_name: (learner && learner.name) || '', learner_email: (learner && learner.email) || '', learner_gdc: (learner && learner.gdc) || '',
      submission_type: subject, file_url: 'N/A', submitted_at: new Date().toLocaleString('en-GB'), message,
    });
  } catch (e) {}
}

// Shared page chrome: nav bar, preview/setup strips, footer.
export async function mountChrome({ active, prefix = '' } = {}) {
  const user = await getSessionUser().catch(() => null);
  const strip = PREVIEW
    ? '<div class="preview-strip">⚠ <strong>Preview mode</strong> - sample data saved in this browser only. Nothing here is real or visible to learners. <a href="#" id="pvReset">Reset preview</a></div>'
    : (!CONFIGURED ? '<div class="setup-strip">The CPD hub is not connected to Firebase yet, so logins will not work. <a href="' + prefix + 'index.html?preview=1">Open preview mode</a></div>' : '');
  const right = user
    ? '<a href="' + link(prefix + 'index.html') + '" class="btn btn-outline btn-sm">Courses</a>'
      + '<a href="' + link(prefix + 'dashboard.html') + '" class="btn btn-primary btn-sm">My CPD</a>'
      + (user.isAdmin ? '<a href="' + link(prefix + 'admin/index.html') + '" class="btn btn-outline btn-sm">Admin</a>' : '')
      + '<button class="btn btn-sm" style="background:none;color:var(--ink-light)" id="navLogout">Log out</button>'
    : '<a href="' + link(prefix + 'login.html') + '" class="btn btn-outline btn-sm">Log in</a>'
      + '<a href="' + link(prefix + 'register.html') + '" class="btn btn-primary btn-sm">Create account</a>';
  const nav = strip + '<nav class="nav"><div class="nav-inner">'
    + '<a href="' + link(prefix + 'index.html') + '" class="nav-logo"><img src="' + LOGO_URL + '" alt="Dental Nurse Training" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'"/><span class="nav-logo-text" style="display:none">DNT CPD Hub</span></a>'
    + '<div class="nav-right" style="gap:0.5rem;flex-wrap:wrap;justify-content:flex-end">' + right + '</div></div></nav>';
  const holder = document.getElementById('navHolder');
  if (holder) holder.innerHTML = nav;
  const footHolder = document.getElementById('footHolder');
  if (footHolder) footHolder.innerHTML = footerHtml(prefix + '../');
  const lo = document.getElementById('navLogout');
  if (lo) lo.onclick = async () => { await logout(); location.href = link(prefix + 'index.html'); };
  const rs = document.getElementById('pvReset');
  if (rs) rs.onclick = (e) => { e.preventDefault(); if (confirm('Clear all preview data in this browser and start again?')) { resetPreview(); location.reload(); } };
  return user;
}

// Course completion rules, used by the player, dashboard and admin.
export function courseSteps(content) {
  const lessons = (content && content.lessons) || [];
  return lessons.length + 3; // lessons + quiz + reflection + feedback
}
export function stepsDone(content, prog) {
  if (!prog) return 0;
  const ids = ((content && content.lessons) || []).map(l => l.id);
  return ids.filter(id => (prog.lessonsDone || []).includes(id)).length
    + (prog.quiz && prog.quiz.passed ? 1 : 0) + (prog.reflection ? 1 : 0) + (prog.feedback ? 1 : 0);
}
