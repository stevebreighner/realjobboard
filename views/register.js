import { CONFIG } from '../config.js'; // optional if you want to use config constants

export function renderRegister(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Register</h1>
    <form id="registerForm" class="space-y-4">
      <input type="text" name="username" placeholder="Username" class="w-full p-2 border rounded" required />
      <input type="email" name="email" placeholder="Email" class="w-full p-2 border rounded" required />
      <input type="password" name="password" placeholder="Password" class="w-full p-2 border rounded" required />
      
      <select name="role" class="w-full p-2 border rounded" required>
        <option value="" disabled selected>Select Role</option>
        <option value="employee">Employee</option>
        <option value="employer">Employer</option>
      </select>

      <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">Register</button>
    </form>
    <p class="mt-4">
      Have an account? <a href="#/login" class="text-blue-600">Login here</a>
    </p>
  `;

  const form = container.querySelector('#registerForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/wp-json/customapi/v1/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Registered successfully!');
        window.location.hash = '#/login';
      } else {
        alert('❌ Registration failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ Registration error. Check console.');
    }
  });
}
