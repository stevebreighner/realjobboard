export function renderForgotPassword(container) {
  container.innerHTML = `
    <h1>Forgot Password</h1>
    <form onsubmit="handleForgotPassword(event)">
      <input type="email" id="forgot_email" placeholder="Email" required />
      <button type="submit">Send Reset Link</button>
    </form>
  `;
}

window.handleForgotPassword = async function(event) {
  event.preventDefault();
  const email = document.getElementById('forgot_email').value;

  const res = await fetch('/wp-json/customapi/v1/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  alert(data.message || 'Check your inbox.');
};
