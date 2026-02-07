export function renderUpdatePassword(container) {
  container.innerHTML = `
    <div class="max-w-md mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4 text-center">Update Password</h1>
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
        <button type="submit" class="text-purple px-4 py-2 rounded w-full hover:bg-blue-700 transition">Update Password</button>
      </form>
      <div id="updatePassMsg" class="mt-3 text-sm text-center"></div>
      <p class="mt-4 text-center"><a href="/#profile" class="text-blue-600 hover:underline">← Back to Profile</a></p>
    </div>
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
  const msg = document.getElementById('updatePassMsg');

  if (newPassword !== confirmPassword) {
    if (msg) {
      msg.className = 'mt-3 text-sm text-red-600';
      msg.textContent = 'New passwords do not match.';
    }
    return;
  }

  if (!checkPasswordStrength(newPassword)) {
    if (msg) {
      msg.className = 'mt-3 text-sm text-red-600';
      msg.textContent = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
    }
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
      if (msg) {
        msg.className = 'mt-3 text-sm text-green-700';
        msg.textContent = data.message || 'Password updated successfully.';
      }
      window.location.hash = '#profile';
    } else {
      if (msg) {
        msg.className = 'mt-3 text-sm text-red-600';
        msg.textContent = data.message || 'Unknown error';
      }
    }
  } catch (error) {
    if (msg) {
      msg.className = 'mt-3 text-sm text-red-600';
      msg.textContent = 'Network error: ' + error.message;
    }
  }
};
