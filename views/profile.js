export function renderProfile(container) {
  container.innerHTML = `
  <h1 class="text-2xl font-bold mb-2">Profile</h1>
  <h2 id="roleLabel" class="text-lg font-semibold text-gray-700 mb-4"></h2>

  <div id="avatar-preview-container" class="mb-4">
    <img id="avatarPreview" src="/default-avatar.png"
         alt="Avatar" class="rounded-full border object-cover" />
  </div>

  <div class="mb-4">
    <label for="avatar" class="block font-semibold">Upload Avatar (Max 2MB)</label>
    <input type="file" id="avatar" name="avatar" class="w-full p-2 border rounded" accept="image/*" />
  </div>

  <form class="space-y-4" onsubmit="handleProfileUpdate(event)">
    <label for="username" class="block font-semibold">Username</label>
    <input type="text" id="username" name="username" class="w-full p-2 border rounded" readonly /><br />

    <label for="email" class="block font-semibold">Email</label>
    <input type="email" id="email" name="email" class="w-full p-2 border rounded" readonly /><br />

    <label for="company" class="block font-semibold">Company</label>
    <input type="text" id="company" name="company" class="w-full p-2 border rounded" /><br />

    <label for="first_name" class="block font-semibold">First Name</label>
    <input type="text" id="first_name" name="first_name" class="w-full p-2 border rounded" /><br />

    <label for="last_name" class="block font-semibold">Last Name</label>
    <input type="text" id="last_name" name="last_name" class="w-full p-2 border rounded" /><br />

    <label for="dob" class="block font-semibold">Date of Birth</label>
    <input type="date" id="dob" name="dob" class="w-full p-2 border rounded" /><br />

    <button type="submit" class="bg-purple-600 text-white px-4 py-2 rounded">Save</button>
  </form>

  <div id="jobboard-links" class="mt-4"></div>

  <p class="mt-4"><a href="/#update-password" class="text-red-600">Update Password</a></p>
`;

  const jobboardLinks = container.querySelector('#jobboard-links');
  const roleLabel     = container.querySelector('#roleLabel');
  const previewImg    = container.querySelector('#avatarPreview');

  // Fetch profile + role info
  async function getProfileInfo() {
    try {
      const response = await fetch('/wp-json/customapi/v1/user-profile?_=' + Date.now(), {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        document.getElementById('username').value   = data.username || '';
        document.getElementById('email').value      = data.email || '';
        document.getElementById('first_name').value = data.first_name || '';
        document.getElementById('last_name').value  = data.last_name || '';
        document.getElementById('company').value  = data.company || '';
        document.getElementById('dob').value        = data.dob || '';
        previewImg.src = data.avatar_url || '/default-avatar.png';

        // Determine role + links
        const roles = data.roles || []; // backend should return roles array
        if (roles.includes('employer')) {
          roleLabel.textContent = "Employer";
          jobboardLinks.innerHTML = `
            <p class="mt-2"><a href="/#my-job-posts" class="text-blue-600">Manage Job Applications</a></p>
          `;
        } else {
          roleLabel.textContent = "Job Seeker";
          jobboardLinks.innerHTML = `
            <p class="mt-2"><a href="/#resume" class="text-blue-600">Manage Resume & Cover Letter</a></p>
          `;
        }

      } else {
        alert('❌ Error fetching profile: ' + (data.message || 'Unknown error'));
        if (response.status === 401) window.location.hash = '#/login';
      }
    } catch (err) {
      alert('❌ Network error: ' + err.message);
    }
  }

  getProfileInfo();
}
async function handleProfileUpdate(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  try {
    const response = await fetch('/wp-json/customapi/v1/user-profile-update', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert('✅ Profile updated successfully!');
    } else {
      alert('❌ Failed to update profile: ' + (data.message || 'Unknown error'));
    }
  } catch (err) {
    alert('❌ Network error: ' + err.message);
  }
}

window.handleProfileUpdate = handleProfileUpdate; // 👈 make it globally callable from form
