/* ── Nav burger ─────────────────────────────────────────────────────────── */
const burger = document.querySelector('.nav-burger');
const navLinks = document.querySelector('.nav-links');
if (burger && navLinks) {
  burger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
}

/* ── Scroll reveal ──────────────────────────────────────────────────────── */
const reveals = document.querySelectorAll('.card, .module-card, .doc-item, .doc-card, .app-log-chip');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 0.4s ease ${i * 0.06}s, transform 0.4s ease ${i * 0.06}s`;
    io.observe(el);
  });
}

/* ── Active nav link ────────────────────────────────────────────────────── */
const links = document.querySelectorAll('.nav-links a');
const current = window.location.pathname.split('/').pop();
links.forEach(link => {
  const href = link.getAttribute('href').split('/').pop();
  if (href === current || (current === '' && href === 'index.html')) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});
