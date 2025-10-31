import { CONFIG } from '../config.js';

export async function renderNavbar(container) {
  const isLoggedIn = await checkLoginStatus();

  container.innerHTML = `
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
    font-size: 1.5rem;
    color: #4f46e5;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    .menu-toggle {
      display: block;
    }

    .menu {
      display: none;
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
    }

    .menu.show {
      display: flex;
    }

    .navbar a {
      margin: 0.5rem 0;
    }
  }
</style>


    <nav class="navbar">
      <a href="/#home" class="logo">${CONFIG.COMPANY_NAME}</a>
      <button id="menuToggle" class="menu-toggle" aria-label="Menu">☰</button>
      <div id="menu" class="menu">
        ${!isLoggedIn ? '<a href="/#home" class="nav-link">Home</a>' : ''}
        <a href="/#list" class="nav-link">${CONFIG.COMPANY_BUSINESS_THING_PLURAL}</a>
        <a href="/#post" class="nav-link">Post a ${CONFIG.COMPANY_BUSINESS_THING}</a>
        ${isLoggedIn ? '<a href="/#profile" class="nav-link">Profile</a>' : ''}
        ${isLoggedIn
          ? '<a href="#" class="nav-link" id="logoutLink">Logout</a>'
          : '<a href="/#login" class="nav-link">Login</a>'
        }
      </div>
    </nav>
  `;

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
      window.location.hash = '#login';
      renderNavbar(container);
    });
  }

  highlightActiveLink();
  window.addEventListener('hashchange', highlightActiveLink);
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
  try {
    const res = await fetch('/wp-json/customapi/v1/profile?_=' + Date.now(), {
      method: 'GET',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}
