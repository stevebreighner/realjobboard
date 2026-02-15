import { CONFIG } from '../config.js';

const FORMSPREE_URL = 'https://formspree.io/f/xgozgqzd';

export function renderSupport(container, params = {}) {
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-3xl font-bold">Support</h1>
          <p class="text-sm text-gray-600">We respond quickly — usually within 1–2 business days.</p>
        </div>
        <div id="statusBox" class="rounded-xl border px-4 py-3 text-sm text-gray-800 bg-gray-50 border-gray-200 w-full md:w-auto">
          Checking site status...
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="border rounded-2xl p-4 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Report Abuse</div>
          <p class="text-sm text-gray-700 mb-3">
            See spam, scams, or harassment? Report it and we’ll review quickly.
          </p>
          <a href="/#support?subject=Report%20Abuse&context=support" class="text-indigo-600 hover:underline text-sm">Report abuse →</a>
        </div>
        <div class="border rounded-2xl p-4 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Account Help</div>
          <p class="text-sm text-gray-700 mb-3">
            Need help with verification, login, or billing? We’ve got you.
          </p>
          <a href="/#support?subject=Account%20Help&context=support" class="text-indigo-600 hover:underline text-sm">Get account help →</a>
        </div>
      </div>

      <div class="border rounded-2xl p-5 md:p-6 bg-white shadow-sm">
        <p class="mb-4 text-gray-700">
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
      </div>
    </div>
  `;

  // Simulated real-time status check
  const statusBox = document.getElementById('statusBox');

  fetch('/api/ping?_=' + Date.now())
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
