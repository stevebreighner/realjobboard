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
    padding: 0.85rem 1.5rem;
    font-family: sans-serif;
    background: #fff;
    border-bottom: 1px solid #ddd;
    width: 100%;
    margin: 0;
    box-sizing: border-box;
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
  .logo-name {
    color: #0f172a;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    line-height: 1;
    margin: 0;
    white-space: nowrap;
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
  .menu .nav-link {
    white-space: nowrap;
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
    box-shadow: none;
  }
  .menu-toggle:hover {
    background: none;
    border: none;
  }
  .menu-toggle:focus,
  .menu-toggle:focus-visible {
    outline: none;
    box-shadow: none;
  }

  @media (max-width: 640px) {
    .menu-toggle {
      display: block;
      width: auto !important;
    }

    .menu {
      flex-direction: column;
      align-items: stretch;
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0.75rem;
      left: auto;
      width: clamp(150px, 60vw, 240px);
      box-sizing: border-box;
      background: rgba(255, 255, 255, 0.98);
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18);
      backdrop-filter: blur(10px);
      z-index: 1000;
      max-height: 0;
      opacity: 0;
      transform: translateY(-6px) scale(0.98);
      overflow-x: hidden;
      overflow-y: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      pointer-events: none;
      transition: max-height 0.35s ease, opacity 0.2s ease, transform 0.2s ease;
    }
    .menu::-webkit-scrollbar {
      width: 0;
      height: 0;
    }

    .menu.show {
      max-height: min(70vh, 520px);
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .navbar a {
      margin: 0;
    }
    .menu .nav-link {
      display: block;
      width: 100%;
      white-space: normal;
      overflow-wrap: anywhere;
      padding: 0.7rem 0.75rem;
      border-radius: 12px;
      color: #0f172a;
      transition: background-color 0.15s ease, border-color 0.15s ease;
      border: 1px solid transparent;
    }
    .menu .nav-link:hover {
      text-decoration: none;
      background: rgba(79, 70, 229, 0.08);
      border-color: rgba(79, 70, 229, 0.16);
    }
    .logo-name {
      display: none;
    }
  }
</style>


    <nav class="navbar">
      <a href="/#home" class="logo" aria-label="${CONFIG.COMPANY_NAME}">
        <img src="${CONFIG.LOGO_URL || '/logo.svg'}" alt="${CONFIG.COMPANY_NAME} logo" />
        <h1 class="logo-name">${CONFIG.COMPANY_NAME}</h1>
        <span class="sr-only">${CONFIG.COMPANY_NAME}</span>
      </a>
      <button id="menuToggle" class="menu-toggle" aria-label="Menu">☰</button>
      <div id="menu" class="menu">
        <a href="/#list" class="nav-link">${CONFIG.COMPANY_BUSINESS_THING_PLURAL}</a>
        ${isEmployer ? `<a href="/#post" class="nav-link">Post a ${CONFIG.COMPANY_BUSINESS_THING}</a>` : ''}
        ${isEmployer ? `<a href="/#my-job-posts" class="nav-link">${CONFIG.JOB_COPY?.MY_POSTS_TITLE || 'My Job Posts'}</a>` : ''}
        ${isSiteAdmin ? `<a href="/#admin" class="nav-link">Admin</a>` : ''}
        ${isSiteAdmin ? `<a href="/#analytics" class="nav-link">Analytics</a>` : ''}
        ${isLoggedIn ? '<a href="/#profile" class="nav-link">Profile</a>' : ''}
        ${isLoggedIn && !isEmployer ? `<a href="/#saved-searches" class="nav-link">${CONFIG.JOB_COPY?.SAVED_SEARCHES_TITLE || 'Saved Searches'}</a>` : ''}
        ${isLoggedIn && !isEmployer ? `<a href="/#myApplications" class="nav-link">${CONFIG.JOB_COPY?.MY_APPLICATIONS_TITLE || 'My Applications'}</a>` : ''}
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

  const closeMenu = (evt) => {
    if (!menu || !menu.classList.contains('show')) return;
    const target = evt.target;
    if (menu.contains(target) || toggle?.contains(target)) return;
    menu.classList.remove('show');
  };
  document.addEventListener('click', closeMenu);
  document.addEventListener('touchstart', closeMenu);

  // Logout handler
  if (isLoggedIn) {
    document.getElementById('logoutLink')?.addEventListener('click', async (e) => {
      e.preventDefault();
      let res = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include',
        });
      }
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
