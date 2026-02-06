import { start2FA, verify2FA } from './2fa.js';
import { renderNavbar } from '../components/navbar.js';
import { clearProfileCache, clearSessionCache, getSessionCached, notifyAuthChanged } from '../utils/session.js';

export function renderLogin(container) {
  container.innerHTML = `
    <div class="max-w-md mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4 text-center">Login</h1>
      <form id="loginForm" class="space-y-4">
        <input type="email" placeholder="Email" class="w-full p-2 border rounded" required />
        <div class="relative w-full">
          <input type="password" id="loginPassword" placeholder="Password" class="w-full p-2 border rounded pr-10" required />
          <button type="button" id="toggleLoginPassword" class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 bg-transparent border-0 p-0 m-0" style="width:2rem;height:2rem;right:1.4rem;">
            <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        <button type="submit" class="text-purple px-4 py-2 rounded w-full">Login</button>
      </form>
      <div id="loginMessage" class="mt-4 text-sm"></div>
      <div id="twoFASection" style="display:none; margin-top:1rem;">
        <label for="twoFACode" class="block mb-1">Enter 2FA Code:</label>
        <input type="text" id="twoFACode" class="w-full p-2 border rounded" maxlength="6" />
        <button id="verify2FAButton" class="mt-2 text-purple px-4 py-2 rounded w-full">Verify</button>
      </div>
      <br>
      <p class="mt-4"><a href="/#forgot-password" class="text-blue-600">Forgot Password</a></p>
      <div class="mt-4">
        <p class="text-sm mb-2">Need a new verification email?</p>
        <form id="resendVerifyForm" class="space-y-2">
          <input type="email" id="resendEmail" placeholder="Email" class="w-full p-2 border rounded" required />
          <button type="submit" class="text-purple px-4 py-2 rounded w-full">Resend Verification</button>
        </form>
      </div>
      <div class="mt-6">
        <p class="text-sm mb-2">Prefer a one-time link?</p>
        <form id="magicLinkForm" class="space-y-2">
          <input type="email" id="magicEmail" placeholder="Email" class="w-full p-2 border rounded" required />
          <button type="submit" class="text-purple px-4 py-2 rounded w-full">Send Magic Link</button>
        </form>
      </div>
      <p class="mt-4 text-center">No account? <a href="/#register" class="text-blue-600">Register here</a></p>
    </div>
  `;

  const form = container.querySelector('#loginForm');
  const twoFASection = container.querySelector('#twoFASection');
  const verifyBtn = container.querySelector('#verify2FAButton');
  const messageEl = container.querySelector('#loginMessage');
  const resendForm = container.querySelector('#resendVerifyForm');
  const magicForm = container.querySelector('#magicLinkForm');
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

    const payload = JSON.stringify({ email, password });
    const requestOpts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      credentials: 'include',
    };

    let response = await fetch('/wp-json/customapi/v1/login', requestOpts);
    let data = await response.json().catch(() => ({}));

    if (!response.ok) {
      response = await fetch('/api/login', requestOpts);
      data = await response.json().catch(() => ({}));
    }

    if (response.ok) {
      if (data.twoFARequired) {
        await start2FA(); // <- this is needed to trigger the email with code
        twoFASection.style.display = 'block';
        form.style.display = 'none';
        messageEl.className = 'mt-4 text-sm text-amber-700';
        messageEl.textContent = '2FA is required, please enter your code.';
      } else {
        messageEl.className = 'mt-4 text-sm text-green-700';
        messageEl.textContent = data.message || 'Login successful';
        clearSessionCache();
        clearProfileCache();
        const session = await getSessionCached({ force: true });
        notifyAuthChanged(session);
        renderNavbar(document.getElementById('navbar'));
        const redirect = sessionStorage.getItem('postLoginRedirect');
        if (redirect) {
          sessionStorage.removeItem('postLoginRedirect');
          window.location.hash = redirect;
        } else {
          window.location.hash = '#home';
        }
      }
    } else {
      messageEl.className = 'mt-4 text-sm text-red-600';
      messageEl.textContent = `Login failed: ${data.message || data.error || 'Unknown error'}`;
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
      const redirect = sessionStorage.getItem('postLoginRedirect');
      if (redirect) {
        sessionStorage.removeItem('postLoginRedirect');
        window.location.hash = redirect;
      } else {
        window.location.hash = '#home';
      }
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

  magicForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#magicEmail').value.trim();
    if (!email) {
      messageEl.className = 'mt-4 text-sm text-amber-700';
      messageEl.textContent = 'Please enter your email.';
      return;
    }

    const response = await fetch('/wp-json/customapi/v1/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include',
    });

    const data = await response.json();
    if (response.ok) {
      messageEl.className = 'mt-4 text-sm text-green-700';
      messageEl.textContent = data.message || 'Magic link sent. Check your email.';
    } else {
      messageEl.className = 'mt-4 text-sm text-red-600';
      messageEl.textContent = data.message || 'Unable to send magic link.';
    }
  });
}
