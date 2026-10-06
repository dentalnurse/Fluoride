// Shared page helpers for the CPD hub (plain script, loaded before page modules).

const LOGO_URL = "https://dentalnurse.training/wp-content/uploads/2023/05/WEBLOGO.png";

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Light formatting used in all course text boxes, so no HTML is needed:
//   blank line = new paragraph     ## Heading      - bullet     1. numbered
//   **bold**   *italic*   [link text](https://...)
function md(text) {
  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  let html = '', list = null, para = [];
  const flushPara = () => { if (para.length) { html += '<p>' + para.map(inline).join('<br/>') + '</p>'; para = []; } };
  const flushList = () => { if (list) { html += '</' + list + '>'; list = null; } };
  for (const raw of lines) {
    const line = raw.trim();
    let m;
    if (!line) { flushPara(); flushList(); continue; }
    if ((m = line.match(/^#{2,3}\s+(.*)$/))) { flushPara(); flushList(); html += '<h3>' + inline(m[1]) + '</h3>'; continue; }
    if ((m = line.match(/^[-•]\s+(.*)$/))) { flushPara(); if (list !== 'ul') { flushList(); html += '<ul>'; list = 'ul'; } html += '<li>' + inline(m[1]) + '</li>'; continue; }
    if ((m = line.match(/^\d+[.)]\s+(.*)$/))) { flushPara(); if (list !== 'ol') { flushList(); html += '<ol>'; list = 'ol'; } html += '<li>' + inline(m[1]) + '</li>'; continue; }
    flushList(); para.push(line);
  }
  flushPara(); flushList();
  return html;
}

function toast(msg, type) {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = 'toast'; }, 3200);
}

function fmtDate(d) {
  if (!d) return '';
  const date = d.toDate ? d.toDate() : new Date(d);
  if (isNaN(date)) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function qs(name) { return new URLSearchParams(location.search).get(name); }

function footerHtml(prefix) {
  prefix = prefix || '../';
  return '<footer class="site-footer"><div class="container"><p>© ' + new Date().getFullYear() +
    ' Dental Nurse Training Ltd · CPD Hub · <a href="' + prefix + 'privacy-policy.html">Privacy Policy</a> &middot; <a href="' + prefix + 'terms.html">Terms</a></p></div></footer>';
}

// Course types:
//   "verifiable" - GDC verifiable CPD, for dental professionals
//   "both"       - CPD for everyone, and GDC verifiable for anyone who has a GDC number
//   "general"    - CPD for everyone, not GDC verifiable ("skills" is an older name for this)
// Courses with no type count as "verifiable".
function cpdType(c) { const t = (c && c.cpdType) || 'verifiable'; return t === 'skills' ? 'general' : t; }
// Does the course carry GDC development outcomes?
function usesGdc(c) { return cpdType(c) !== 'general'; }
// Is it verifiable CPD for this particular learner?
function verifiableFor(c, learner) { const t = cpdType(c); return t === 'verifiable' || (t === 'both' && !!(learner && learner.gdc)); }
function hoursText(c) {
  const h = Number(c && c.hours) || 0, hrs = h + ' hour' + (h === 1 ? '' : 's');
  return { verifiable: hrs + ' verifiable CPD', both: hrs + ' verifiable CPD (with your GDC number)', general: hrs + ' CPD' }[cpdType(c)];
}
function typePill(c) {
  return { verifiable: '<span class="pill pill-teal">Verifiable CPD</span>',
           both: '<span class="pill pill-teal">GDC verifiable CPD</span>',
           general: '<span class="pill pill-orange">CPD</span>' }[cpdType(c)];
}
function typeLabel(c) { return { verifiable: 'Verifiable CPD', both: 'CPD (verifiable for dental professionals)', general: 'CPD (not GDC verifiable)' }[cpdType(c)]; }

// ── Course page building blocks (used by course.html and learn.html) ──
function courseChips(c) {
  const n = (c.lessonTitles || []).length, q = c.questionCount || 0, h = Number(c.hours) || 0;
  return [
    '⏱ ' + h + ' hour' + (h === 1 ? '' : 's') + (cpdType(c) === 'general' ? ' CPD' : ' verifiable CPD'),
    '📚 ' + n + ' lesson' + (n === 1 ? '' : 's'),
    '🧩 Interactive activities',
    '✅ ' + q + '-question quiz',
    '🏅 ' + (cpdType(c) === 'general' ? 'CPD certificate' : 'Verifiable CPD certificate'),
  ].map(t => '<span class="ch-chip">' + esc(t) + '</span>').join('');
}
function objectivesGrid(c) {
  return '<div class="learn-grid">' + (c.objectives || []).map(o => '<div class="learn-item"><span class="li-tick">✓</span><span>' + esc(o) + '</span></div>').join('') + '</div>';
}
function lessonList(c, opts) {
  opts = opts || {};
  const lessons = (c.lessonTitles || []).map((t, i) => '<div class="ll-item"><span class="ll-num">' + (i + 1) + '</span><span class="ll-title">' + esc(t) + '</span></div>').join('');
  const finish = [['✅', 'End of course quiz', 'Pass mark ' + (c.passMark || 80) + '%. Retake as often as you need.'],
                  ['🪞', 'Reflection', 'A few short questions on what you learned.'],
                  ['💬', 'Feedback', 'Tell us what you thought.'],
                  ['🏅', 'Your certificate', cpdType(c) === 'both' ? 'A verifiable CPD certificate if you add your GDC number, or a CPD certificate.' : cpdType(c) === 'general' ? 'A CPD certificate to download and keep.' : 'A verifiable CPD certificate for your CPD record.']]
    .map(([i, t, d]) => '<div class="ll-item finish"><span class="ll-num">' + i + '</span><span class="ll-title">' + esc(t) + '<small>' + esc(d) + '</small></span></div>').join('');
  return '<div class="lesson-list">' + lessons + finish + '</div>';
}
function outcomesBadges(c) {
  return (c.outcomes || []).map(o => '<div class="outcome-item"><span class="outcome-letter">' + esc(o) + '</span><span>' + esc(GDC_OUTCOMES[o] || '') + '</span></div>').join('');
}
function audienceText(c) {
  return { verifiable: 'For GDC-registered dental professionals. Counts towards your verifiable CPD hours.',
           both: 'GDC verifiable CPD for dental professionals: just add your GDC number to your account. Also open to anyone else, who will receive a CPD certificate.',
           general: 'Open to everyone. You get a CPD certificate, but this course is not GDC verifiable CPD.' }[cpdType(c)];
}
function courseVisual(c) {
  return c.thumbnail ? '<img src="' + esc(c.thumbnail) + '" alt=""/>' : '<span class="cv-icon">' + esc(c.icon || '📘') + '</span>';
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function slugify(s) {
  return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}
