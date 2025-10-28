import { CONFIG } from '../config.js';

export function renderSupport(container) {
  container.innerHTML = `
    <div class="max-w-xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-4">Support</h1>

      <div id="statusBox" class="bg-gray-100 border-l-4 border-yellow-500 p-4 mb-6 text-sm text-gray-800">
        Checking site status...
      </div>

      <p class="mb-4">
        If you have any questions, issues, or feedback, please reach out to us at:
      </p>
      <p class="text-blue-700 font-semibold">
        <a href="mailto:${CONFIG.COMPANY_SUPPORT_EMAIL}">${CONFIG.COMPANY_SUPPORT_EMAIL}</a>
      </p>

      <p class="mt-6 text-sm text-gray-600">
        Visit our website: 
        <a href="https://${CONFIG.WEBSITE_URL}" class="text-blue-600 underline" target="_blank">
          ${CONFIG.WEBSITE_URL}
        </a>
      </p>
    </div>
  `;

  // Simulated real-time status check
  const statusBox = document.getElementById('statusBox');

  fetch('/wp-json/customapi/v1/ping?_=' + Date.now())
    .then(res => {
      if (res.ok) {
        statusBox.innerHTML = '✅ All systems are operational.';
        statusBox.classList.remove('border-yellow-500');
        statusBox.classList.add('border-green-600', 'bg-green-50');
      } else {
        throw new Error('Server returned error');
      }
    })
    .catch(() => {
      statusBox.innerHTML = '⚠️ Some issues detected with the site. Please try again later.';
      statusBox.classList.remove('border-yellow-500');
      statusBox.classList.add('border-red-600', 'bg-red-50');
    });
}
