// 2fa.js

export async function start2FA() {
  const response = await fetch('/api/2fa-start', {
    method: 'POST',
    credentials: 'include',
  });
  return response.ok;
}
  
export async function verify2FA(code) {
  const response = await fetch('/api/2fa-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    credentials: 'include',
  });
  const data = await response.json();
  return { ok: response.ok, message: data.message };
}
  
  // Add this new function to render the 2FA page UI:
  export function render2FA(container) {
    container.innerHTML = `
      <div class="max-w-md mx-auto px-4">
        <h1 class="text-2xl font-bold mb-4 text-center">Two-Factor Authentication</h1>
        <form id="twofa-form" class="space-y-4">
          <label for="code" class="block text-sm text-gray-700">Enter your 2FA code:</label>
          <input type="text" id="code" name="code" class="w-full p-2 border rounded" required />
          <button type="submit" class="text-purple px-4 py-2 rounded w-full">Verify</button>
        </form>
        <div id="twofa-message" class="mt-4 text-sm text-center"></div>
      </div>
    `;
  
    const form = container.querySelector('#twofa-form');
    const message = container.querySelector('#twofa-message');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = form.code.value.trim();
  
      if (!code) {
        message.textContent = 'Please enter your 2FA code.';
        message.className = 'mt-4 text-sm text-center text-red-600';
        return;
      }
  
      const result = await verify2FA(code);
  
      if (result.ok) {
        message.textContent = '2FA verification successful!';
        message.className = 'mt-4 text-sm text-center text-green-700';
        // Redirect or do something after success
        window.location.hash = '#profile';
      } else {
        message.textContent = `Verification failed: ${result.message || 'Unknown error'}`;
        message.className = 'mt-4 text-sm text-center text-red-600';
      }
    });
  }
  
