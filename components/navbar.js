import { CONFIG } from '../config.js';
import { getSessionCached, clearProfileCache, clearSessionCache, notifyAuthChanged } from '../utils/session.js';

let hasHashListener = false;

function navbarHtml(isLoggedIn, isEmployer, isSiteAdmin) {
  return `
    <style>
  .navbar {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    padding: 0.75rem 1rem;
    font-family: sans-serif;
    background: #fff;
    border-bottom: 1px solid #ddd;
  }
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .logo img {
    width: 28px;
    height: 28px;
    display: block;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .navbar a {
    color: #4f46e5;
    text-decoration: none;
    margin-left: 1rem;
    font-size: 0.9rem;
  }

  .navbar a:hover {
    text-decoration: underline;
  }

  .menu {
    display: flex;
    align-items: center;
  }

  .menu-toggle {
    display: none;
    padding: 5px;
    background: none;
    border: none;
    outline: none;
    font-size: 1.5rem;
    color: #4f46e5;
    cursor: pointer;
  }
  .menu-toggle:focus,
  .menu-toggle:focus-visible {
    outline: none;
    box-shadow: none;
  }

  @media (max-width: 640px) {
    .menu-toggle {
      display: block;
    }

    .menu {
      flex-direction: column;
      align-items: flex-start;
      position: absolute;
      top: 100%;
      right: 0;
      left: 0;
      background: white;
      padding: 0.75rem 1rem;
      border-top: 1px solid #ddd;
      z-index: 1000;
      max-height: 0;
      opacity: 0;
      transform: translateY(-6px);
      overflow: hidden;
      pointer-events: none;
      transition: max-height 0.35s ease, opacity 0.2s ease, transform 0.2s ease;
    }

    .menu.show {
      max-height: 320px;
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .navbar a {
      margin: 0.5rem 0;
    }
  }
</style>


    <nav class="navbar">
      <a href="/#home" class="logo" aria-label="${CONFIG.COMPANY_NAME}">
        <img src="/wp-content/themes/jobs/assets/email-logo.svg" alt="${CONFIG.COMPANY_NAME} logo" />
        <span class="sr-only">${CONFIG.COMPANY_NAME}</span>
      </a>
      <button id="menuToggle" class="menu-toggle" aria-label="Menu">☰</button>
      <div id="menu" class="menu">
        <a href="/#list" class="nav-link">${CONFIG.COMPANY_BUSINESS_THING_PLURAL}</a>
        ${isEmployer ? `<a href="/#post" class="nav-link">Post a ${CONFIG.COMPANY_BUSINESS_THING}</a>` : ''}
        ${isSiteAdmin ? `<a href="/#admin" class="nav-link">Admin</a>` : ''}
        ${isLoggedIn ? '<a href="/#profile" class="nav-link">Profile</a>' : ''}
        ${isLoggedIn
          ? '<a href="#" class="nav-link" id="logoutLink">Logout</a>'
          : '<a href="/#login" class="nav-link">Login</a>'
        }
      </div>
    </nav>
  `;
}

function bindNavbar(container, isLoggedIn) {
  // Toggle menu on small screens
  const menu = document.getElementById('menu');
  const toggle = document.getElementById('menuToggle');
  toggle?.addEventListener('click', () => {
    menu.classList.toggle('show');
  });

  // Logout handler
  if (isLoggedIn) {
    document.getElementById('logoutLink')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await fetch('/wp-json/customapi/v1/logout', {
        method: 'POST',
        credentials: 'include',
      });
      clearSessionCache();
      clearProfileCache();
      notifyAuthChanged(null);
      window.location.hash = '#login';
      renderNavbar(container);
    });
  }

  highlightActiveLink();
  if (!hasHashListener) {
    window.addEventListener('hashchange', highlightActiveLink);
    hasHashListener = true;
  }
}

export function renderNavbar(container) {
  // Render immediately for fast paint
  container.innerHTML = navbarHtml(false, false, false);
  bindNavbar(container, false);

  // Update nav after async auth check
  checkLoginStatus().then(({ isLoggedIn, isEmployer, isSiteAdmin }) => {
    if (!isLoggedIn) {
      return;
    }
    container.innerHTML = navbarHtml(true, isEmployer, isSiteAdmin);
    bindNavbar(container, true);
  });
}

function renderNavbarFromSession(container, session) {
  const roles = Array.isArray(session?.roles) ? session.roles : [];
  const isLoggedIn = !!session;
  const isEmployer = roles.includes('employer');
  const isSiteAdmin = roles.includes('site_admin') || roles.includes('administrator');
  container.innerHTML = navbarHtml(isLoggedIn, isEmployer, isSiteAdmin);
  bindNavbar(container, isLoggedIn);
}

function highlightActiveLink() {
  const hash = window.location.hash || '#/home';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === hash) {
      link.style.textDecoration = 'underline';
      link.style.fontWeight = 'bold';
    } else {
      link.style.textDecoration = '';
      link.style.fontWeight = '';
    }
  });
}

async function checkLoginStatus() {
  const session = await getSessionCached({ maxAgeMs: 30000 });
  if (!session) return { isLoggedIn: false, isEmployer: false };
  const roles = Array.isArray(session?.roles) ? session.roles : [];
  return {
    isLoggedIn: true,
    isEmployer: roles.includes('employer'),
    isSiteAdmin: roles.includes('site_admin') || roles.includes('administrator'),
  };
}

window.addEventListener('auth:changed', (e) => {
  const container = document.getElementById('navbar');
  if (!container) return;
  renderNavbarFromSession(container, e.detail || null);
});
