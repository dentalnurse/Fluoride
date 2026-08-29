// Soft-launch access gate for the not-yet-announced Oral Health Education course.
// This is a simple shared-passcode screen to keep the section unlisted while
// it's being built out - it is NOT real security (the passcode is visible to
// anyone who reads this file). Real access control for learner/admin accounts
// is handled separately by Firebase Auth once config.js has live credentials.
(function () {
  var PASSCODE = '7774';
  var STORAGE_KEY = 'ohe_gate_unlocked';

  if (window.localStorage && localStorage.getItem(STORAGE_KEY) === '1') return;

  document.documentElement.style.visibility = 'hidden';

  function showGate() {
    document.documentElement.style.visibility = 'visible';

    var overlay = document.createElement('div');
    overlay.id = 'ohe-gate-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:#00474B;z-index:99999;display:flex;align-items:center;justify-content:center;font-family:"Nunito Sans",system-ui,sans-serif;padding:1rem;box-sizing:border-box';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:12px;padding:2.5rem 2rem;max-width:340px;width:100%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,0.3)">' +
        '<div style="font-size:2rem;margin-bottom:0.75rem">🔒</div>' +
        '<h2 style="margin:0 0 0.5rem;font-size:1.15rem;color:#00474B">This page is private</h2>' +
        '<p style="margin:0 0 1.25rem;font-size:0.88rem;color:#6B7280">Enter the access code to continue.</p>' +
        '<input type="password" id="ohe-gate-input" inputmode="numeric" autocomplete="off" style="width:100%;box-sizing:border-box;padding:0.7rem 0.9rem;border:1px solid #D1D5DB;border-radius:8px;font-size:1rem;text-align:center;margin-bottom:0.75rem" placeholder="Access code"/>' +
        '<div id="ohe-gate-err" style="display:none;color:#D32F2F;font-size:0.82rem;margin-bottom:0.75rem">Incorrect code, please try again.</div>' +
        '<button id="ohe-gate-btn" style="width:100%;padding:0.7rem;background:#00747A;color:#fff;border:none;border-radius:8px;font-size:0.95rem;font-weight:600;cursor:pointer">Enter</button>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = document.getElementById('ohe-gate-input');
    var btn   = document.getElementById('ohe-gate-btn');
    var err   = document.getElementById('ohe-gate-err');
    input.focus();

    function tryUnlock() {
      if (input.value === PASSCODE) {
        if (window.localStorage) localStorage.setItem(STORAGE_KEY, '1');
        overlay.remove();
      } else {
        err.style.display = 'block';
        input.value = '';
        input.focus();
      }
    }
    btn.addEventListener('click', tryUnlock);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryUnlock(); });
  }

  if (document.body) {
    showGate();
  } else {
    document.addEventListener('DOMContentLoaded', showGate);
  }
})();
