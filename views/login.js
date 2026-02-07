import { start2FA, verify2FA } from './2fa.js';
import { CONFIG } from '../config.js';
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
          <button type="button" id="toggleLoginPassword" class="absolute inset-y-0 right-2 flex items-center justify-center text-gray-500 bg-transparent border-0 p-0 m-0" style="width:2rem;">
            <svg id="eyeIcon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>
        <div id="turnstile-container" class="mt-2"></div>
        <button type="submit" class="text-purple px-4 py-2 rounded w-full">Login</button>
      </form>
      <div id="googleLoginWrap" class="mt-4">
        <button type="button" id="googleLoginBtn" class="w-full border border-slate-300 rounded p-2 flex items-center justify-center gap-2 hover:bg-slate-50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="h-5 w-5">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.77 1.22 9.29 3.22l6.94-6.94C35.87 2.2 30.23 0 24 0 14.62 0 6.53 5.38 2.56 13.22l8.09 6.29C12.6 13.24 17.82 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24c0-1.59-.16-3.12-.46-4.59H24v9.19h12.71c-.55 2.97-2.22 5.49-4.71 7.19l7.22 5.6C43.5 37.36 46.5 31.1 46.5 24z"/>
            <path fill="#FBBC05" d="M10.65 28.51c-.53-1.58-.83-3.27-.83-5.01s.3-3.43.83-5.01l-8.09-6.29C.9 15.08 0 19.45 0 24s.9 8.92 2.56 12.8l8.09-6.29z"/>
            <path fill="#34A853" d="M24 48c6.23 0 11.46-2.05 15.28-5.61l-7.22-5.6c-2.01 1.35-4.6 2.15-8.06 2.15-6.18 0-11.4-3.74-13.35-9.01l-8.09 6.29C6.53 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>
      </div>
      <div id="loginMessage" class="mt-4 text-sm"></div>
      <div id="twoFASection" style="display:none; margin-top:1rem;">
        <label for="twoFACode" class="block mb-1">Enter 2FA Code:</label>
        <input type="text" id="twoFACode" class="w-full p-2 border rounded" maxlength="6" />
        <button id="verify2FAButton" class="mt-2 text-purple px-4 py-2 rounded w-full">Verify</button>
      </div>
      <br>
      <div class="mt-4 space-y-3">
        <a href="/#forgot-password" class="text-blue-600 text-sm block text-center">Forgot Password</a>
        <details class="border border-slate-200 rounded p-3">
          <summary class="cursor-pointer text-sm text-slate-700">Email me a magic login link</summary>
          <form id="magicLinkForm" class="space-y-2 mt-3">
            <input type="email" id="magicEmail" placeholder="Email" class="w-full p-2 border rounded" required />
            <button type="submit" class="text-purple px-4 py-2 rounded w-full">Send Magic Link</button>
          </form>
        </details>
        <details class="border border-slate-200 rounded p-3">
          <summary class="cursor-pointer text-sm text-slate-700">Resend verification email</summary>
          <form id="resendVerifyForm" class="space-y-2 mt-3">
            <input type="email" id="resendEmail" placeholder="Email" class="w-full p-2 border rounded" required />
            <button type="submit" class="text-purple px-4 py-2 rounded w-full">Resend Verification</button>
          </form>
        </details>
      </div>
      <p class="mt-4 text-center">No account? <a href="/#register" class="text-blue-600">Register here</a></p>
    </div>
  `;

  const form = container.querySelector('#loginForm');
  const turnstileContainer = container.querySelector('#turnstile-container');
  const googleBtn = container.querySelector('#googleLoginBtn');
  const twoFASection = container.querySelector('#twoFASection');
  const verifyBtn = container.querySelector('#verify2FAButton');
  const messageEl = container.querySelector('#loginMessage');
  const resendForm = container.querySelector('#resendVerifyForm');
  const magicForm = container.querySelector('#magicLinkForm');
  const passwordInput = container.querySelector('#loginPassword');
  const togglePasswordBtn = container.querySelector('#toggleLoginPassword');

  let turnstileWidgetId = null;

  (async () => {
    let devMode = false;
    try {
      const res = await fetch('/api/dev-flags', { credentials: 'include' });
      const data = await res.json();
      devMode = !!data?.dev_mode;
    } catch (err) {}
    if (devMode) {
      if (turnstileContainer) turnstileContainer.innerHTML = '<div class="text-xs text-gray-500">Dev mode: captcha disabled</div>';
      return;
    }
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (CONFIG.TURNSTILE_SITE_KEY && turnstileContainer) {
          turnstileWidgetId = window.turnstile.render(turnstileContainer, {
            sitekey: CONFIG.TURNSTILE_SITE_KEY
          });
        }
      };
      document.head.appendChild(script);
    } else if (CONFIG.TURNSTILE_SITE_KEY && turnstileContainer) {
      turnstileWidgetId = window.turnstile.render(turnstileContainer, {
        sitekey: CONFIG.TURNSTILE_SITE_KEY
      });
    }
  })();

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

    let turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null) {
      turnstileToken = window.turnstile.getResponse(turnstileWidgetId);
    }
    if (turnstileContainer && turnstileContainer.textContent.includes('captcha disabled')) {
      turnstileToken = '';
    }
    if (!CONFIG.TURNSTILE_SITE_KEY) {
      turnstileToken = '';
    }
    const captchaDisabled = turnstileContainer && turnstileContainer.textContent.includes('captcha disabled');
    if (CONFIG.TURNSTILE_SITE_KEY && !window.turnstile) {
      messageEl.className = 'mt-4 text-sm text-amber-700';
      messageEl.textContent = 'Captcha is blocked by the browser. Please refresh or disable blockers.';
      return;
    }
    if (!turnstileToken && turnstileContainer && !captchaDisabled && CONFIG.TURNSTILE_SITE_KEY) {
      messageEl.className = 'mt-4 text-sm text-amber-700';
      messageEl.textContent = 'Please complete the captcha.';
      return;
    }

    const payload = JSON.stringify({ email, password, turnstile_token: turnstileToken });
    const requestOpts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      credentials: 'include',
    };

    let response = await fetch('/api/login', requestOpts);
    let data = await response.json().catch(() => ({}));

    const needsFallback = !response.ok || !data || (!data.user && !data.message && !data.twoFARequired);
    if (needsFallback) {
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
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
    }
  });

  googleBtn?.addEventListener('click', () => {
    window.location.href = '/api/oauth/google/start';
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

    let turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null) {
      turnstileToken = window.turnstile.getResponse(turnstileWidgetId);
    }
    const response = await fetch('/api/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, turnstile_token: turnstileToken }),
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

    let turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null) {
      turnstileToken = window.turnstile.getResponse(turnstileWidgetId);
    }
    const response = await fetch('/api/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, turnstile_token: turnstileToken }),
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
