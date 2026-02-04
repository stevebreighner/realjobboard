import { start2FA, verify2FA } from './2fa.js';
import { renderNavbar } from '../components/navbar.js';
import { clearProfileCache, clearSessionCache, getSessionCached, notifyAuthChanged } from '../utils/session.js';

export function renderLogin(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Login</h1>
    <form id="loginForm" class="space-y-4">
      <input type="email" placeholder="Email" class="w-full p-2 border rounded" required />
      <div class="relative">
        <input type="password" id="loginPassword" placeholder="Password" class="w-full p-2 border rounded pr-10" required />
        <button type="button" id="toggleLoginPassword" class="absolute right-2 inset-y-0 flex items-center justify-center text-gray-500" style="transform: translateY(-5px);">
          <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
      <button type="submit" class="text-purple px-4 py-2 rounded">Login</button>
    </form>
    <div id="loginMessage" class="mt-4 text-sm"></div>
    <div id="twoFASection" style="display:none; margin-top:1rem;">
      <label for="twoFACode" class="block mb-1">Enter 2FA Code:</label>
      <input type="text" id="twoFACode" class="w-full p-2 border rounded" maxlength="6" />
      <button id="verify2FAButton" class="mt-2 text-purple px-4 py-2 rounded">Verify</button>
    </div>
    <br>
    <p class="mt-4"><a href="/#forgot-password" class="text-blue-600">Forgot Password</a></p>
    <div class="mt-4">
      <p class="text-sm mb-2">Need a new verification email?</p>
      <form id="resendVerifyForm" class="space-y-2">
        <input type="email" id="resendEmail" placeholder="Email" class="w-full p-2 border rounded" required />
        <button type="submit" class="text-purple px-4 py-2 rounded">Resend Verification</button>
      </form>
    </div>
    <p class="mt-4">No account? <a href="/#register" class="text-blue-600">Register here</a></p>
  `;

  const form = container.querySelector('#loginForm');
  const twoFASection = container.querySelector('#twoFASection');
  const verifyBtn = container.querySelector('#verify2FAButton');
  const messageEl = container.querySelector('#loginMessage');
  const resendForm = container.querySelector('#resendVerifyForm');
  const passwordInput = container.querySelector('#loginPassword');
  const togglePasswordBtn = container.querySelector('#toggleLoginPassword');

  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    const eyeIcon = container.querySelector('#eyeIcon');
    if (eyeIcon) {
      eyeIcon.innerHTML = isHidden
        ? '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.72 21.72 0 0 1 5.17-6.11M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.76 21.76 0 0 1-3.17 4.11"/><path d="M1 1l22 22"/><path d="M9.9 9.9a3 3 0 0 0 4.24 4.24"/>'
        : '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.querySelector('input[type="email"]').value;
    const password = passwordInput.value;

    const response = await fetch('/wp-json/customapi/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok) {
      if (data.twoFARequired) {
        await start2FA(); // <- this is needed to trigger the email with code
        twoFASection.style.display = 'block';
        form.style.display = 'none';
        messageEl.className = 'mt-4 text-sm text-amber-700';
        messageEl.textContent = '2FA is required, please enter your code.';
      }else {
        messageEl.className = 'mt-4 text-sm text-green-700';
        messageEl.textContent = data.message || 'Login successful';
        clearSessionCache();
        clearProfileCache();
        const session = await getSessionCached({ force: true });
        notifyAuthChanged(session);
        renderNavbar(document.getElementById('navbar'));
        window.location.hash = '#profile';
      }
    } else {
      messageEl.className = 'mt-4 text-sm text-red-600';
      messageEl.textContent = `Login failed: ${data.message || 'Unknown error'}`;
    }
  });

  verifyBtn.addEventListener('click', async () => {
    const code = container.querySelector('#twoFACode').value.trim();
    if (!code) {
      messageEl.className = 'mt-4 text-sm text-amber-700';
      messageEl.textContent = 'Please enter the 2FA code.';
      return;
    }

    const { ok, message } = await verify2FA(code);
    if (ok) {
      messageEl.className = 'mt-4 text-sm text-green-700';
      messageEl.textContent = message || '2FA verified! Logged in successfully.';
      clearSessionCache();
      clearProfileCache();
      const session = await getSessionCached({ force: true });
      notifyAuthChanged(session);
      renderNavbar(document.getElementById('navbar'));
      window.location.hash = '#profile';
    } else {
      messageEl.className = 'mt-4 text-sm text-red-600';
      messageEl.textContent = `2FA verification failed: ${message || 'Invalid code'}`;
    }
  });

  resendForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#resendEmail').value.trim();
    if (!email) {
      messageEl.className = 'mt-4 text-sm text-amber-700';
      messageEl.textContent = 'Please enter your email.';
      return;
    }

    const response = await fetch('/wp-json/customapi/v1/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include',
    });

    const data = await response.json();
    if (response.ok) {
      messageEl.className = 'mt-4 text-sm text-green-700';
      messageEl.textContent = data.message || 'If that email exists, a verification link has been sent.';
    } else {
      messageEl.className = 'mt-4 text-sm text-red-600';
      messageEl.textContent = data.message || 'Unable to resend verification.';
    }
  });
}
