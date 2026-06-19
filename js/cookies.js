(function() {
  if (localStorage.getItem('cookieConsent') === '1') return;
  const bar = document.createElement('div');
  bar.id = 'cookieBar';
  bar.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#1A2E2F;color:#E5E7EB;font-size:0.82rem;padding:0.85rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;z-index:99999;box-shadow:0 -2px 12px rgba(0,0,0,0.2)';
  bar.innerHTML = '<span>We use cookies to keep you logged in, save your course progress, and understand how the site is used (Google Analytics). See our <a href="/Fluoride/privacy-policy.html" style="color:#7DD3D5;text-decoration:underline">Privacy Policy</a>.</span>'
    + '<button onclick="document.getElementById(\'cookieBar\').remove();localStorage.setItem(\'cookieConsent\',\'1\')" style="background:#00747A;color:white;border:none;border-radius:6px;padding:0.45rem 1.1rem;font-size:0.82rem;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit">Accept & continue</button>';
  document.body.appendChild(bar);
})();
