import { getUserProfileCached, getUserProfileCachedAny } from '../utils/session.js';

export function renderProfile(container) {
  container.innerHTML = `
  <h1 class="text-2xl font-bold mb-2">Profile</h1>
  <style>
    .profile-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(79, 70, 229, 0.25);
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      vertical-align: -2px;
      margin-right: 6px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  <h2 id="roleLabel" class="text-lg font-semibold text-gray-700 mb-4"></h2>
  <div id="profileStatus" class="mb-4 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-3 py-2">
    <span class="profile-spinner" aria-hidden="true"></span>
    Decrypting profile...
  </div>

  <div id="avatar-preview-container" class="mb-4">
    <img id="avatarPreview" src="/default-avatar.svg"
         alt="Avatar" class="rounded-full border object-cover" loading="lazy" decoding="async" />
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

    <h3 class="text-lg font-semibold mt-4">Address (USA Only)</h3>
    <label for="street1" class="block font-semibold">Street Address</label>
    <input type="text" id="street1" name="street1" class="w-full p-2 border rounded" required /><br />

    <label for="street2" class="block font-semibold">Unit/Suite (optional)</label>
    <input type="text" id="street2" name="street2" class="w-full p-2 border rounded" /><br />

    <label for="city" class="block font-semibold">City</label>
    <input type="text" id="city" name="city" class="w-full p-2 border rounded" required /><br />

    <label for="state" class="block font-semibold">State (2-letter)</label>
    <input type="text" id="state" name="state" class="w-full p-2 border rounded" required maxlength="2" /><br />

    <label for="zip" class="block font-semibold">ZIP Code</label>
    <input type="text" id="zip" name="zip" class="w-full p-2 border rounded" required /><br />

    <label for="country" class="block font-semibold">Country</label>
    <input type="text" id="country" name="country" class="w-full p-2 border rounded" required /><br />

    <p id="profileError" class="text-sm text-red-600"></p>
    <button type="submit" class="text-purple px-4 py-2 rounded">Save</button>
  </form>

  <div id="jobboard-links" class="mt-4"></div>

  <p class="mt-4"><a href="/#update-password" class="text-purple-600">Update Password</a></p>
`;

  const jobboardLinks = container.querySelector('#jobboard-links');
  const roleLabel     = container.querySelector('#roleLabel');
  const previewImg    = container.querySelector('#avatarPreview');
  const profileStatus = container.querySelector('#profileStatus');

  // Fetch profile + role info
  function applyProfileData(data) {
    document.getElementById('username').value   = data.username || '';
    document.getElementById('email').value      = data.email || '';
    document.getElementById('first_name').value = data.first_name || '';
    document.getElementById('last_name').value  = data.last_name || '';
    document.getElementById('company').value  = data.company || '';
    document.getElementById('dob').value        = data.dob || '';
    document.getElementById('street1').value    = data.street1 || '';
    document.getElementById('street2').value    = data.street2 || '';
    document.getElementById('city').value       = data.city || '';
    document.getElementById('state').value      = data.state || '';
    document.getElementById('zip').value        = data.zip || '';
    document.getElementById('country').value    = data.country || 'United States';
    previewImg.src = data.avatar_url || '/default-avatar.svg';

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

    if (profileStatus) {
      profileStatus.textContent = 'Profile decrypted.';
      profileStatus.className = 'mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2';
      setTimeout(() => {
        profileStatus.classList.add('hidden');
      }, 1500);
    }
  }

  async function getProfileInfo() {
    try {
      // Stale-while-revalidate: show cached data immediately if available
      const cached = getUserProfileCachedAny({ light: false });
      if (cached) {
        applyProfileData(cached);
      }

      const data = await getUserProfileCached({ maxAgeMs: 30000, light: false });
      if (data) {
        applyProfileData(data);
      } else {
        alert('❌ Error fetching profile: Unable to load profile.');
        window.location.hash = '#/login';
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
  const errorEl = document.getElementById('profileError');
  const formData = new FormData(form);
  if (errorEl) errorEl.textContent = '';

  const country = (formData.get('country') || '').trim();
  const state = (formData.get('state') || '').trim();
  const zip = (formData.get('zip') || '').trim();
  const usaValues = ['usa', 'us', 'united states', 'united states of america'];
  if (!usaValues.includes(country.toLowerCase())) {
    if (errorEl) errorEl.textContent = 'USA only: please enter United States.';
    return;
  }
  if (state && !/^[A-Za-z]{2}$/.test(state)) {
    if (errorEl) errorEl.textContent = 'State must be a 2-letter code.';
    return;
  }
  if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) {
    if (errorEl) errorEl.textContent = 'ZIP must be 5 digits (or 5+4).';
    return;
  }

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
