// CPD hub data layer. Every page talks to the database through this file.
//
// Two back ends with the same functions:
//   - Firebase (live): used once cpd/js/config.js has real Firebase values.
//   - Preview: add ?preview=1 to any page. Everything is stored in this
//     browser only (IndexedDB), with a sample learner who is also an
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
    quizPerAttempt: Number((content && content.quiz && content.quiz.perAttempt) || 0),
    lessonQuizFlags: lessons.map(l => !!(l.quiz && (l.quiz.questions || []).length)),
    lessonQuizCount: lessons.filter(l => l.quiz && (l.quiz.questions || []).length).length,
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
// Preview data is kept in the browser's IndexedDB, which can hold hundreds of
// MB (the older localStorage version was limited to about 5MB).
const IDB_NAME = 'cpd_preview', IDB_STORE = 'kv';
let idbConn = null;
function idb() {
  if (idbConn) return idbConn;
  idbConn = new Promise((res, rej) => {
    const r = indexedDB.open(IDB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(IDB_STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return idbConn;
}
async function idbReq(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, mode), req = fn(tx.objectStore(IDB_STORE));
    tx.oncomplete = () => res(req.result);
    tx.onerror = tx.onabort = () => rej(tx.error || req.error);
  });
}
function seed() {
  const d = { courses: {}, content: {}, learners: { [PUSER.uid]: { name: PUSER.name, email: PUSER.email, gdc: PUSER.gdc, workplace: PUSER.workplace, createdAt: now() } },
        access: {}, progress: {}, orders: {}, admins: {}, media: {}, loggedOut: false };
  if (typeof CPD_DEMO_COURSE !== 'undefined') {
    const { meta, content } = CPD_DEMO_COURSE;
    d.courses[meta.slug] = { ...deriveMeta(meta, content), updatedAt: now() };
    d.content[meta.slug] = content;
    d.access[PUSER.uid] = { [meta.slug]: { grantedAt: now(), grantedBy: 'preview', note: 'Demo' } };
  }
  return d;
}
// Read fresh each time, so two open tabs don't overwrite each other's changes.
async function pload() {
  let d = null;
  try { d = await idbReq('readonly', st => st.get(PKEY)); } catch (e) { console.warn(e); }
  if (!d) {
    // Move across any preview data saved by the older localStorage version
    try { d = JSON.parse(localStorage.getItem(PKEY)); } catch (e) {}
    if (d) { await psave(d); try { localStorage.removeItem(PKEY); } catch (e) {} }
  }
  return d || seed();
}
async function psave(d) {
  try { await idbReq('readwrite', st => st.put(d, PKEY)); }
  catch (e) { toast('Could not save preview data: ' + (e && e.message || e), 'error'); throw e; }
}
const clone = (x) => x == null ? x : JSON.parse(JSON.stringify(x));

const pv = {
  async getSessionUser() {
    const d = (await pload());
    if (d.loggedOut) return null;
    const l = d.learners[PUSER.uid] || {};
    return { ...PUSER, name: l.name || PUSER.name, gdc: l.gdc != null ? l.gdc : PUSER.gdc, workplace: l.workplace != null ? l.workplace : PUSER.workplace };
  },
  async login() { const d = (await pload()); d.loggedOut = false; await psave(d); },
  async register() { const d = (await pload()); d.loggedOut = false; await psave(d); },
  async resetPassword() {},
  async logout() { const d = (await pload()); d.loggedOut = true; await psave(d); },
  async updateProfile(uid, data) { const d = (await pload()); d.learners[uid] = { ...d.learners[uid], ...data }; await psave(d); },

  async listCourses(includeAll) { return Object.values((await pload()).courses).filter(c => includeAll || ['live', 'coming-soon'].includes(c.status)).map(clone); },
  async getCourse(slug) { return clone((await pload()).courses[slug] || null); },
  async getCourseContent(slug) { return clone((await pload()).content[slug] || null); },
  async saveCourse(meta, content) { const d = (await pload()); d.courses[meta.slug] = { ...deriveMeta(meta, content), updatedAt: now() }; d.content[meta.slug] = content; await psave(d); },
  async deleteCourse(slug) { const d = (await pload()); delete d.courses[slug]; delete d.content[slug]; await psave(d); },

  async getAccess(uid) { return clone((await pload()).access[uid] || {}); },
  async grantAccess(uid, slug, by, note) {
    const d = (await pload()); d.access[uid] = d.access[uid] || {}; d.access[uid][slug] = { grantedAt: now(), grantedBy: by, note: note || '' };
    const o = d.orders[uid + '/' + slug]; if (o) Object.assign(o, { status: 'unlocked', unlockedAt: now(), unlockedBy: by });
    await psave(d);
  },
  async revokeAccess(uid, slug) { const d = (await pload()); if (d.access[uid]) delete d.access[uid][slug]; await psave(d); },

  async createOrder(user, course) { const d = (await pload()); d.orders[user.uid + '/' + course.slug] = { uid: user.uid, name: user.name, email: user.email, gdc: user.gdc, slug: course.slug, title: course.title, price: course.price, status: 'pending', createdAt: now() }; await psave(d); },
  async getOrders(uid) { return Object.values((await pload()).orders).filter(o => o.uid === uid).map(clone); },
  async listAllOrders() { return Object.values((await pload()).orders).map(clone); },
  async deleteOrder(uid, slug) { const d = (await pload()); delete d.orders[uid + '/' + slug]; await psave(d); },

  async getProgress(uid, slug) { return clone((await pload()).progress[uid + '/' + slug] || null); },
  async listMyProgress(uid) { return Object.values((await pload()).progress).filter(p => p.uid === uid).map(clone); },
  async saveProgress(uid, slug, data) { const d = (await pload()); const k = uid + '/' + slug; d.progress[k] = { ...(d.progress[k] || {}), ...clone(data), uid, slug, lastActivity: now() }; await psave(d); },
  async resetProgress(uid, slug) { const d = (await pload()); delete d.progress[uid + '/' + slug]; await psave(d); },

  async listLearners() { return Object.entries((await pload()).learners).map(([uid, l]) => ({ uid, ...l })); },
  async listAllAccess() { return clone((await pload()).access); },
  async listAllProgress() { return Object.values((await pload()).progress).map(clone); },

  async listAdmins() { return Object.entries((await pload()).admins).map(([email, a]) => ({ email, ...a })); },
  async addAdmin(email, by) { const d = (await pload()); d.admins[lc(email)] = { addedBy: by, addedAt: now() }; await psave(d); },
  async removeAdmin(email) { const d = (await pload()); delete d.admins[lc(email)]; await psave(d); },

  async listMedia() { return Object.entries((await pload()).media).map(([id, m]) => ({ id, ...m })); },
  uploadMedia(file, by, onProgress) {
    // Preview keeps files inside the browser, so only small ones fit.
    return new Promise((resolve, reject) => {
      if (file.size > 25 * 1024 * 1024) { reject(new Error('In preview mode files must be under 25MB. The live hub allows images up to ' + MAX_IMAGE_MB + 'MB and videos up to ' + MAX_VIDEO_MB + 'MB.')); return; }
      const r = new FileReader();
      r.onload = async () => {
        try {
          const d = (await pload()); const id = Date.now().toString(36);
          const item = { name: file.name, url: r.result, path: '', type: file.type.startsWith('video') ? 'video' : 'image', size: file.size, uploadedAt: now(), uploadedBy: by };
          d.media[id] = item; await psave(d); onProgress && onProgress(1); resolve({ id, ...item });
        } catch (e) { reject(e); }
      };
      r.onerror = reject; r.readAsDataURL(file);
    });
  },
  async deleteMedia(item) { const d = (await pload()); delete d.media[item.id]; await psave(d); },
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

export async function resetPreview() { try { localStorage.removeItem(PKEY); } catch (e) {} try { await idbReq('readwrite', st => st.delete(PKEY)); } catch (e) {} }

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
  const notOpen = (typeof HUB_OPEN !== 'undefined' && !HUB_OPEN)
    ? '<div class="building-strip">🔒 <strong>Soft launch:</strong> the CPD Hub is hidden from the public. Only people with the access code can see it.</div>' : '';
  const strip = notOpen + (PREVIEW
    ? '<div class="preview-strip">⚠ <strong>Preview mode</strong> - sample data saved in this browser only. Nothing here is real or visible to learners. <a href="#" id="pvReset">Reset preview</a></div>'
    : (!CONFIGURED ? '<div class="setup-strip">The CPD hub is not connected to Firebase yet, so logins will not work. <a href="' + prefix + 'index.html?preview=1">Open preview mode</a></div>' : ''));
  const right = user
    ? '<a href="' + link(prefix + 'index.html') + '" class="btn btn-outline btn-sm">Courses</a>'
      + '<a href="' + link(prefix + 'dashboard.html') + '" class="btn btn-primary btn-sm">My CPD</a>'
      + (user.isAdmin ? '<a href="' + link(prefix + 'admin/index.html') + '" class="btn btn-outline btn-sm">Admin</a>' : '')
      + '<button class="btn btn-sm" style="background:none;color:var(--ink-light)" id="navLogout">Log out</button>'
    : '<a href="' + link(prefix + 'login.html') + '" class="btn btn-outline btn-sm">Log in</a>'
      + '<a href="' + link(prefix + 'register.html') + '" class="btn btn-primary btn-sm">Create account</a>';
  const nav = strip + '<nav class="nav"><div class="nav-inner">'
    + '<a href="' + link(prefix + 'index.html') + '" class="nav-logo"><img src="' + LOGO_URL + '" alt="Dental Nurse Training" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'"/><span class="nav-logo-text" style="display:none">CPD Hub</span></a>'
    + '<div class="nav-right" style="gap:0.5rem;flex-wrap:wrap;justify-content:flex-end">' + right + '</div></div></nav>';
  const holder = document.getElementById('navHolder');
  if (holder) holder.innerHTML = nav;
  const footHolder = document.getElementById('footHolder');
  if (footHolder) footHolder.innerHTML = footerHtml(prefix + '../');
  const lo = document.getElementById('navLogout');
  if (lo) lo.onclick = async () => { await logout(); location.href = link(prefix + 'index.html'); };
  const rs = document.getElementById('pvReset');
  if (rs) rs.onclick = (e) => { e.preventDefault(); if (confirm('Clear all preview data in this browser and start again?')) { resetPreview().then(() => location.reload()); } };
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
