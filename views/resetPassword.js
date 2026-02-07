import { CONFIG } from "../config.js";

export function renderResetPassword(container, params) {
  const token = params.token;

  if (!token) {
    container.innerHTML = '<p class="text-red-600">❌ Invalid or missing reset token.</p>';
    return;
  }

  container.innerHTML = `
    <div class="max-w-md mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4 text-center">Reset Password</h1>
      <form class="space-y-4" onsubmit="handleResetPassword(event)">
        <input type="hidden" id="reset_token" value="${token}" />
        <input type="password" id="new_password" class="w-full p-2 border rounded" placeholder="New Password" required />
        <input type="password" id="confirm_password" class="w-full p-2 border rounded" placeholder="Confirm Password" required />
        <div id="turnstile-container" class="mt-2"></div>
        <div class="flex justify-end">
          <button type="submit" class="text-purple px-4 py-2 rounded w-full hover:bg-green-700 transition">
            Set New Password
          </button>
        </div>
      </form>
      <div id="resetMsg" class="mt-3 text-sm text-center"></div>
    </div>
  `;
  initTurnstile();
}

window.handleResetPassword = async function(event) {
  if (!turnstileWidgetId) {
    await initTurnstile();
  }
  event.preventDefault();

  const token = document.getElementById('reset_token').value.trim();
  const newPassword = document.getElementById('new_password').value.trim();
  const confirmPassword = document.getElementById('confirm_password').value.trim();

  const msg = document.getElementById('resetMsg');
  if (newPassword !== confirmPassword) {
    if (msg) {
      msg.className = 'mt-3 text-sm text-red-600';
      msg.textContent = 'Passwords do not match.';
    }
    return;
  }

  try {
    let turnstileToken = '';
    if (window.turnstile && turnstileWidgetId !== null) {
      turnstileToken = window.turnstile.getResponse(turnstileWidgetId);
    }
    if (!CONFIG.TURNSTILE_SITE_KEY) {
      turnstileToken = '';
    }
    if (!turnstileToken && msg && !document.getElementById('turnstile-container')?.textContent?.includes('captcha disabled') && CONFIG.TURNSTILE_SITE_KEY) {
      msg.className = 'mt-3 text-sm text-amber-700';
      msg.textContent = 'Please complete the captcha.';
      return;
    }
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: newPassword, turnstile_token: turnstileToken }),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      if (msg) {
        msg.className = 'mt-3 text-sm text-green-700';
        msg.textContent = data.message || 'Password reset successfully.';
      }
      window.location.hash = '#login';
    } else {
      if (msg) {
        msg.className = 'mt-3 text-sm text-red-600';
        msg.textContent = data.message || 'Unknown error.';
      }
    }
  } catch (error) {
    if (msg) {
      msg.className = 'mt-3 text-sm text-red-600';
      msg.textContent = 'Network error: ' + error.message;
    }
  }
};

let turnstileWidgetId = null;
async function initTurnstile() {
  let devMode = false;
  try {
    const res = await fetch('/api/dev-flags', { credentials: 'include' });
    const data = await res.json();
    devMode = !!data?.dev_mode;
  } catch (err) {}
  const container = document.getElementById('turnstile-container');
  if (devMode) {
    if (container) container.innerHTML = '<div class="text-xs text-gray-500">Dev mode: captcha disabled</div>';
    return;
  }
  if (!window.turnstile) {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (CONFIG.TURNSTILE_SITE_KEY && container) {
        turnstileWidgetId = window.turnstile.render(container, { sitekey: CONFIG.TURNSTILE_SITE_KEY });
      }
    };
    document.head.appendChild(script);
  } else if (CONFIG.TURNSTILE_SITE_KEY && container) {
    turnstileWidgetId = window.turnstile.render(container, { sitekey: CONFIG.TURNSTILE_SITE_KEY });
  }
}

window.initResetTurnstile = initTurnstile;
