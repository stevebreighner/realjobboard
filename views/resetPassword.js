export function renderResetPassword(container, params) {
  const token = params.token;

  if (!token) {
    container.innerHTML = '<p class="text-red-600">❌ Invalid or missing reset token.</p>';
    return;
  }

  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Reset Password</h1>
    <form class="space-y-4" onsubmit="handleResetPassword(event)">
      <input type="hidden" id="reset_token" value="${token}" />
      <input type="password" id="new_password" class="w-full p-2 border rounded" placeholder="New Password" required />
      <input type="password" id="confirm_password" class="w-full p-2 border rounded" placeholder="Confirm Password" required />
      <div class="flex justify-end">
        <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
          Set New Password
        </button>
      </div>
    </form>
  `;
}

window.handleResetPassword = async function(event) {
  event.preventDefault();

  const token = document.getElementById('reset_token').value.trim();
  const newPassword = document.getElementById('new_password').value.trim();
  const confirmPassword = document.getElementById('confirm_password').value.trim();

  if (newPassword !== confirmPassword) {
    alert('❌ Passwords do not match.');
    return;
  }

  try {
    const response = await fetch('/wp-json/customapi/v1/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      alert('✅ Password reset successfully!');
      window.location.hash = '/#login';
    } else {
      alert('❌ Error: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    alert('❌ Network error: ' + error.message);
  }
};
