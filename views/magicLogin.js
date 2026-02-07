export async function renderMagicLogin(container, params = {}) {
  const token = params.token || '';
  container.innerHTML = `
    <div class="max-w-md mx-auto px-4">
      <h1 class="text-2xl font-bold mb-3">Signing you in…</h1>
      <p class="text-sm text-gray-600" id="magicMsg">Please wait.</p>
    </div>
  `;

  if (!token) {
    container.querySelector('#magicMsg').textContent = 'Invalid or missing token.';
    return;
  }

  try {
    const res = await fetch('/api/magic-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      container.querySelector('#magicMsg').textContent = data.error || 'Unable to log in.';
      return;
    }
    container.querySelector('#magicMsg').textContent = 'Logged in. Redirecting…';
    window.location.hash = '#home';
  } catch (err) {
    container.querySelector('#magicMsg').textContent = 'Unable to log in.';
  }
}
