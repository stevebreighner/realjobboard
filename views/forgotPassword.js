export function renderForgotPassword(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Forgot Password</h1>
    <form class="space-y-4" onsubmit="handleForgotPassword(event)">
      <input type="email" id="forgot_email" placeholder="Email" class="w-full p-2 border rounded" required />
      <button type="submit" class="text-purple px-4 py-2 rounded">Send Reset Link</button>
    </form>
  `;
}

window.handleForgotPassword = async function(event) {
  event.preventDefault();
  const email = document.getElementById('forgot_email').value;

  const res = await fetch('/api/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  alert(data.message || 'Check your inbox.');
};
