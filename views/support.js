import { CONFIG } from '../config.js';

const FORMSPREE_URL = 'https://formspree.io/f/xgozgqzd';

export function renderSupport(container, params = {}) {
  container.innerHTML = `
    <div class="max-w-xl mx-auto px-4 py-6">
      <h1 class="text-2xl font-bold mb-4">Support</h1>

      <div id="statusBox" class="bg-gray-100 border-l-4 border-yellow-500 p-4 mb-6 text-sm text-gray-800">
        Checking site status...
      </div>

      <p class="mb-4">
        If you have any questions, issues, or feedback, please reach out to us below.
      </p>

      <form id="supportForm" class="space-y-3">
        <input type="text" name="name" class="w-full p-2 border rounded" placeholder="Your name" required />
        <input type="email" name="email" class="w-full p-2 border rounded" placeholder="Your email" required />
        <input type="text" name="subject" class="w-full p-2 border rounded" placeholder="Subject" value="${params.subject || ''}" />
        <textarea name="message" class="w-full p-2 border rounded" rows="5" placeholder="Message" required></textarea>
        <input type="hidden" name="context" value="${params.context || ''}" />
        <input type="hidden" name="type" value="${params.subject ? 'abuse_report' : 'contact'}" />
        <label class="flex items-center space-x-2 text-sm">
          <input type="checkbox" id="confirmAdmin" required />
          <span>I understand this will be sent to site admins.</span>
        </label>
        <button type="submit" class="text-purple px-4 py-2 rounded">Send Message</button>
        <p id="supportMessage" class="text-sm"></p>
      </form>

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

  const supportForm = container.querySelector('#supportForm');
  const supportMessage = container.querySelector('#supportMessage');
  supportForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    supportMessage.textContent = '';
    const formData = Object.fromEntries(new FormData(supportForm).entries());
    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to send');
      supportMessage.className = 'text-sm text-green-700';
      supportMessage.textContent = 'Message sent. We will get back to you.';
      supportForm.reset();
    } catch (err) {
      supportMessage.className = 'text-sm text-red-600';
      supportMessage.textContent = err.message;
    }
  });
}
