import { start2FA, verify2FA } from './2fa.js';

export function renderLogin(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Login</h1>
    <form id="loginForm" class="space-y-4">
      <input type="email" placeholder="Email" class="w-full p-2 border rounded" required />
      <input type="password" placeholder="Password" class="w-full p-2 border rounded" required />
      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
    </form>
    <div id="twoFASection" style="display:none; margin-top:1rem;">
      <label for="twoFACode" class="block mb-1">Enter 2FA Code:</label>
      <input type="text" id="twoFACode" class="w-full p-2 border rounded" maxlength="6" />
      <button id="verify2FAButton" class="mt-2 bg-green-600 text-white px-4 py-2 rounded">Verify</button>
    </div>
    <br>
    <p class="mt-4"><a href="/#forgot-password" class="text-blue-600">Forgot Password</a></p>
    <p class="mt-4">No account? <a href="/#register" class="text-blue-600">Register here</a></p>
  `;

  const form = container.querySelector('#loginForm');
  const twoFASection = container.querySelector('#twoFASection');
  const verifyBtn = container.querySelector('#verify2FAButton');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;

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
        alert('2FA is required, please enter your code.');
      }else {
        alert(data.message || 'Login successful');
        window.location.hash = '#profile';
      }
    } else {
      alert(`❌ Login failed: ${data.message || 'Unknown error'}`);
    }
  });

  verifyBtn.addEventListener('click', async () => {
    const code = container.querySelector('#twoFACode').value.trim();
    if (!code) {
      alert('Please enter the 2FA code');
      return;
    }

    const { ok, message } = await verify2FA(code);
    if (ok) {
      alert(message || '2FA verified! Logged in successfully.');
      window.location.hash = '#profile';
    } else {
      alert(`❌ 2FA verification failed: ${message || 'Invalid code'}`);
    }
  });
}
