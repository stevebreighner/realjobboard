import { CONFIG } from "../config.js";

export function renderForgotPassword(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Forgot Password</h1>
    <form class="space-y-4" onsubmit="handleForgotPassword(event)">
      <input type="email" id="forgot_email" placeholder="Email" class="w-full p-2 border rounded" required />
      <div id="turnstile-container" class="mt-2"></div>
      <button type="submit" class="text-purple px-4 py-2 rounded">Send Reset Link</button>
    </form>
    <div id="forgotMsg" class="mt-3 text-sm"></div>
  `;
  initTurnstile();
}

window.handleForgotPassword = async function(event) {
  event.preventDefault();
  const email = document.getElementById('forgot_email').value;
  const msg = document.getElementById('forgotMsg');
  let turnstileToken = '';
  if (window.turnstile && turnstileWidgetId !== null) {
    turnstileToken = window.turnstile.getResponse(turnstileWidgetId);
  }
  if (!turnstileToken && msg && !document.getElementById('turnstile-container')?.textContent?.includes('captcha disabled')) {
    msg.className = 'mt-3 text-sm text-amber-700';
    msg.textContent = 'Please complete the captcha.';
    return;
  }

  const res = await fetch('/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, turnstile_token: turnstileToken })
  });

  const data = await res.json();
  if (msg) {
    msg.className = res.ok ? 'mt-3 text-sm text-green-700' : 'mt-3 text-sm text-red-600';
    msg.textContent = data.message || 'Check your inbox.';
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

window.initForgotTurnstile = initTurnstile;
