import { router } from './router.js';
import { renderNavbar } from './components/navbar.js'; // Adjust path if needed
import { CONFIG } from '../config.js';
import { getSessionCached, getUserProfileCached } from './utils/session.js';
function startApp() {
  renderNavbar(document.getElementById('navbar'));
  router();
  preloadData();
  trackPageView();
}
// main.js or a dedicated footer.js
const yearEl = document.getElementById('year');
const companyNameEl = document.getElementById('companyName');

yearEl.textContent = new Date().getFullYear();
companyNameEl.textContent = CONFIG.COMPANY_NAME; // will explain next
// companyNameEl.textContent = CONFIG.COMPANY_BUSINESS_THING; // will explain next
// Re-render both navbar and route on page load and route changes
window.addEventListener('load', startApp);
window.addEventListener('hashchange', () => {
  router();
  trackPageView();
});

function trackPageView() {
  const path = window.location.hash || '#home';
  const payload = {
    event: 'pageview',
    path,
    referrer: document.referrer || '',
  };
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  }).catch(() => {});
}

function preloadData() {
  const run = () => {
    if (!window.__preload) {
      window.__preload = {};
    }
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        window.__preload.list = { data, ts: Date.now() };
      })
      .catch(() => {});

    // Warm session/profile cache to speed up profile/avatar load
    getSessionCached({ maxAgeMs: 30000, force: true })
      .then(session => {
        if (session) {
          return getUserProfileCached({ maxAgeMs: 30000, force: true, light: true });
        }
        return null;
      })
      .catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 300);
  }
}
