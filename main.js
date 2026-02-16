import { router } from './router.js';
import { renderNavbar } from './components/navbar.js'; // Adjust path if needed
import { CONFIG } from '../config.js';
import { getSessionCached, getUserProfileCached } from './utils/session.js';
import { hashToPath, normalizeInternalHref } from './utils/routes.js';

let hasRouteClickInterceptor = false;
let hasHashCompatListener = false;

function startApp() {
  normalizeLegacyHashUrl();
  renderNavbar(document.getElementById('navbar'));
  if (CONFIG.SITE_TITLE) {
    document.title = CONFIG.SITE_TITLE;
  }
  router();
  preloadData();
  trackPageView();
  bindRouteInterception();
  bindHashCompatibility();
}
// main.js or a dedicated footer.js
const yearEl = document.getElementById('year');
const companyNameEl = document.getElementById('companyName');

yearEl.textContent = new Date().getFullYear();
companyNameEl.textContent = CONFIG.COMPANY_NAME; // will explain next
// companyNameEl.textContent = CONFIG.COMPANY_BUSINESS_THING; // will explain next
// Re-render both navbar and route on page load and route changes
window.addEventListener('load', startApp);
window.addEventListener('popstate', () => {
  router();
  trackPageView();
});

function trackPageView() {
  const path = `${window.location.pathname}${window.location.search}`;
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

function normalizeLegacyHashUrl() {
  if (!window.location.hash || window.location.hash === '#') return;
  const prettyPath = hashToPath(window.location.hash);
  if (prettyPath && `${window.location.pathname}${window.location.search}` !== prettyPath) {
    window.history.replaceState({}, '', prettyPath);
  }
}

function bindRouteInterception() {
  if (hasRouteClickInterceptor) return;
  hasRouteClickInterceptor = true;
  document.addEventListener('click', (e) => {
    const link = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!link) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;
    const href = link.getAttribute('href') || '';
    const next = normalizeInternalHref(href);
    if (!next) return;
    const current = `${window.location.pathname}${window.location.search}`;
    e.preventDefault();
    if (next === current) return;
    window.history.pushState({}, '', next);
    router();
    trackPageView();
  });
}

function bindHashCompatibility() {
  if (hasHashCompatListener) return;
  hasHashCompatListener = true;
  window.addEventListener('hashchange', () => {
    if (!window.location.hash || window.location.hash === '#') return;
    const next = hashToPath(window.location.hash);
    window.history.replaceState({}, '', next);
    router();
    trackPageView();
  });
}
