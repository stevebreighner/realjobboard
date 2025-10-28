// 2fa.js

export async function start2FA() {
    const response = await fetch('/wp-json/customapi/v1/2fa-start', {
      method: 'POST',
      credentials: 'include',
    });
    return response.ok;
  }
  
  export async function verify2FA(code) {
    const response = await fetch('/wp-json/customapi/v1/2fa-verify', {
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
      <h1 class="text-2xl font-bold mb-4">Two-Factor Authentication</h1>
      <form id="twofa-form" class="space-y-4">
        <label for="code">Enter your 2FA code:</label>
        <input type="text" id="code" name="code" class="w-full p-2 border rounded" required />
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Verify</button>
      </form>
      <div id="twofa-message" class="mt-4"></div>
    `;
  
    const form = container.querySelector('#twofa-form');
    const message = container.querySelector('#twofa-message');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = form.code.value.trim();
  
      if (!code) {
        message.textContent = 'Please enter your 2FA code.';
        message.style.color = 'red';
        return;
      }
  
      const result = await verify2FA(code);
  
      if (result.ok) {
        message.textContent = '✅ 2FA verification successful!';
        message.style.color = 'green';
        // Redirect or do something after success
        window.location.hash = '#profile';
      } else {
        message.textContent = `❌ Verification failed: ${result.message || 'Unknown error'}`;
        message.style.color = 'red';
      }
    });
  }
  