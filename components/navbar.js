import { CONFIG } from '../config.js';
import { getSessionCached, clearProfileCache, clearSessionCache, notifyAuthChanged } from '../utils/session.js';

let hasHashListener = false;

function navbarHtml(isLoggedIn, isEmployer, isSiteAdmin) {
  return `
    <style>
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    font-family: sans-serif;
    background: #fff;
    border-bottom: 1px solid #ddd;
    min-height: 64px;
    gap: 0.75rem;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    box-sizing: border-box;
  }
  .header-left {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
  }
  .header-middle {
    flex: 1 1 auto;
    min-width: 0;
  }
  .header-right {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 0 0 auto;
  }
  .brand-logo {
    display: inline-flex;
    align-items: center;
  }
  .brand-logo img {
    width: auto;
    height: 132px;
    max-width: 780px;
    object-fit: contain;
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

  .menu .nav-link {
    color: #4f46e5;
    text-decoration: none;
    font-size: 0.9rem;
    padding: 0.4rem 0;
    margin: 0;
    white-space: nowrap;
  }
  .menu .nav-link:hover {
    text-decoration: underline;
  }

  .menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
    background: #fff;
    padding: 0.5rem 0.9rem;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    z-index: 1000;
    max-height: 0;
    opacity: 0;
    transform: translateY(-8px);
    overflow: hidden;
    pointer-events: none;
    transition: max-height 0.25s ease, opacity 0.2s ease, transform 0.2s ease;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  }

  .menu.show {
    max-height: 480px;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .menu-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
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
    .brand-logo img {
      height: 72px;
      max-width: 340px;
    }
    .menu {
      min-width: min(88vw, 320px);
      right: 0;
    }
  }
</style>


    <div class="header-row">
      <div class="header-left">
        <a href="/#home" class="brand-logo" aria-label="${CONFIG.COMPANY_NAME}">
          <img src="${CONFIG.LOGO_URL || '/logo.svg'}" alt="${CONFIG.COMPANY_NAME} logo" />
          <span class="sr-only">${CONFIG.COMPANY_NAME}</span>
        </a>
      </div>
      <div class="header-middle" aria-hidden="true"></div>
      <div class="header-right">
        <button id="menuToggle" class="menu-toggle" aria-label="Menu">☰</button>
        <nav id="menu" class="menu" aria-label="Primary">
          <a href="/#list" class="nav-link">${CONFIG.COMPANY_BUSINESS_THING_PLURAL}</a>
          ${isEmployer ? `<a href="/#post" class="nav-link">Post a ${CONFIG.COMPANY_BUSINESS_THING}</a>` : ''}
          ${isEmployer ? `<a href="/#my-job-posts" class="nav-link">${CONFIG.JOB_COPY?.MY_POSTS_TITLE || 'My Job Posts'}</a>` : ''}
          ${isSiteAdmin ? `<a href="/#admin" class="nav-link">Admin</a>` : ''}
          ${isLoggedIn ? '<a href="/#profile" class="nav-link">Profile</a>' : ''}
          ${isLoggedIn && !isEmployer ? `<a href="/#saved-searches" class="nav-link">${CONFIG.JOB_COPY?.SAVED_SEARCHES_TITLE || 'Saved Searches'}</a>` : ''}
          ${isLoggedIn && !isEmployer ? `<a href="/#myApplications" class="nav-link">${CONFIG.JOB_COPY?.MY_APPLICATIONS_TITLE || 'My Applications'}</a>` : ''}
          ${isLoggedIn
            ? '<a href="#" class="nav-link" id="logoutLink">Logout</a>'
            : '<a href="/#login" class="nav-link">Login</a>'
          }
        </nav>
      </div>
    </div>
  `;
}

function bindNavbar(container, isLoggedIn) {
  // Toggle menu on all screen sizes
  const menu = document.getElementById('menu');
  const toggle = document.getElementById('menuToggle');
  toggle?.addEventListener('click', () => {
    menu?.classList.toggle('show');
  });
  menu?.addEventListener('click', (evt) => {
    if (evt.target?.closest?.('a.nav-link')) {
      menu.classList.remove('show');
    }
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
