import { clearSessionCache, clearProfileCache, notifyAuthChanged } from '../utils/session.js';

export async function renderVerifyEmail(container, params = {}) {
  clearSessionCache();
  clearProfileCache();
  notifyAuthChanged(null);
  const token = params.token || '';
  container.innerHTML = `
    <div class="max-w-md mx-auto px-4">
      <h1 class="text-2xl font-bold mb-3">Verifying email…</h1>
      <p class="text-sm text-gray-600" id="verifyMsg">Please wait.</p>
    </div>
  `;

  if (!token) {
    container.querySelector('#verifyMsg').textContent = 'Invalid or missing token.';
    return;
  }

  try {
    const res = await fetch(`/api/verify-email?token=${encodeURIComponent(token)}`, {
      credentials: 'include'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      container.querySelector('#verifyMsg').textContent = data.error || 'Unable to verify.';
      return;
    }
    container.querySelector('#verifyMsg').textContent = 'Email verified. You can now log in.';
  } catch (err) {
    container.querySelector('#verifyMsg').textContent = 'Unable to verify.';
  }
}
