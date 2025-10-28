export function renderUpdatePassword(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Update Password</h1>
    <form class="space-y-4" onsubmit="handleChangePassword(event)">
      <div>
        <label for="current_password" class="block text-sm font-medium text-gray-700">Current Password</label>
        <input type="password" id="current_password" class="w-full p-2 border rounded" placeholder="Current Password" required />
      </div>
      <div>
        <label for="new_password" class="block text-sm font-medium text-gray-700">New Password</label>
        <input type="password" id="new_password" class="w-full p-2 border rounded" placeholder="New Password" required />
      </div>
      <div>
        <label for="confirm_password" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
        <input type="password" id="confirm_password" class="w-full p-2 border rounded" placeholder="Confirm New Password" required />
      </div>
      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Update Password</button>
    </form>
    <p class="mt-4"><a href="/#profile" class="text-blue-600 hover:underline">← Back to Profile</a></p>
  `;
}

function checkPasswordStrength(password) {
  // Enforce at least 8 chars, uppercase, lowercase, number, special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return regex.test(password);
}

window.handleChangePassword = async function(event) {
  event.preventDefault();

  const currentPassword = document.getElementById('current_password').value.trim();
  const newPassword = document.getElementById('new_password').value.trim();
  const confirmPassword = document.getElementById('confirm_password').value.trim();

  if (newPassword !== confirmPassword) {
    alert('❌ New passwords do not match.');
    return;
  }

  if (!checkPasswordStrength(newPassword)) {
    alert('❌ Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
    return;
  }

  try {
    const response = await fetch('/wp-json/customapi/v1/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      }),
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok) {
      alert('✅ Password updated successfully! A confirmation email has been sent.');
      window.location.hash = '#profile';
    } else {
      alert('❌ Error updating password: ' + (data.message || 'Unknown error'));
    }
  } catch (error) {
    alert('❌ Network error: ' + error.message);
  }
};
