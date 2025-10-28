import { router } from './router.js';
import { renderNavbar } from './components/navbar.js'; // Adjust path if needed
import { CONFIG } from '../config.js';
function startApp() {
  renderNavbar(document.getElementById('navbar'));
  router();
}
// main.js or a dedicated footer.js
const yearEl = document.getElementById('year');
const companyNameEl = document.getElementById('companyName');

yearEl.textContent = new Date().getFullYear();
companyNameEl.textContent = CONFIG.COMPANY_NAME; // will explain next
// companyNameEl.textContent = CONFIG.COMPANY_BUSINESS_THING; // will explain next
// Re-render both navbar and route on page load and route changes
window.addEventListener('load', startApp);
window.addEventListener('hashchange', startApp);
