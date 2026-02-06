import { getUserProfileCached, getUserProfileCachedAny } from '../utils/session.js';

export function renderProfile(container) {
  container.innerHTML = `
  <div class="max-w-4xl mx-auto px-4">
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

    <label for="company_site" class="block font-semibold">Company Website</label>
    <input type="url" id="company_site" name="company_site" class="w-full p-2 border rounded" placeholder="https://example.com" /><br />

    <label for="company_key" class="block font-semibold">Company Team Key (optional)</label>
    <input type="text" id="company_key" name="company_key" class="w-full p-2 border rounded" placeholder="Shared key for your company" />
    <p class="text-xs text-gray-500 mb-4">Use the same key across team members to group accounts later.</p>

    <label for="first_name" class="block font-semibold">First Name</label>
    <input type="text" id="first_name" name="first_name" class="w-full p-2 border rounded" /><br />

    <label for="last_name" class="block font-semibold">Last Name</label>
    <input type="text" id="last_name" name="last_name" class="w-full p-2 border rounded" /><br />

    <label for="dob" class="block font-semibold">Date of Birth</label>
    <input type="date" id="dob" name="dob" class="w-full p-2 border rounded" /><br />

    <div class="mt-4">
      <button type="button" id="toggleAddressBtn" class="text-sm text-indigo-600 hover:underline">
        Hide Address Details
      </button>
    </div>
    <div id="addressSection">
      <h3 class="text-lg font-semibold mt-2">Address (USA Only)</h3>
      <label for="street1" class="block font-semibold">Street Address</label>
      <input type="text" id="street1" name="street1" class="w-full p-2 border rounded" required />
      <p class="text-xs text-gray-500 mt-1">Include a street number and name (e.g., 111 N Main St).</p><br />

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
    </div>

    <label class="flex items-center space-x-2">
      <input type="checkbox" id="hide_email" name="hide_email" />
      <span class="text-sm">Hide my email from employers</span>
    </label>

    <p id="profileError" class="text-sm text-red-600"></p>
    <button type="submit" class="text-purple px-4 py-2 rounded">Save</button>
  </form>

    <div id="jobboard-links" class="mt-4"></div>

    <p class="mt-4"><a href="/#update-password" class="text-purple-600">Update Password</a></p>
  </div>
`;

  const jobboardLinks = container.querySelector('#jobboard-links');
  const roleLabel     = container.querySelector('#roleLabel');
  const previewImg    = container.querySelector('#avatarPreview');
  const profileStatus = container.querySelector('#profileStatus');
  const toggleAddressBtn = container.querySelector('#toggleAddressBtn');
  const addressSection = container.querySelector('#addressSection');
  const hideEmailToggle = container.querySelector('#hide_email')?.closest('label');

  // Fetch profile + role info
  function applyProfileData(data) {
    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value ?? '';
    };
    const setChecked = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!value;
    };

    setValue('username', data.username || '');
    setValue('email', data.email || '');
    setValue('first_name', data.first_name || '');
    setValue('last_name', data.last_name || '');
    setValue('company', data.company || '');
    setValue('company_site', data.company_site || '');
    setValue('company_key', data.company_key || '');
    setValue('dob', data.dob || '');
    setValue('street1', data.street1 || '');
    setValue('street2', data.street2 || '');
    setValue('city', data.city || '');
    setValue('state', data.state || '');
    setValue('zip', data.zip || '');
    setValue('country', data.country || 'United States');
    setChecked('hide_email', data.hide_email);
    previewImg.src = data.avatar_url || '/default-avatar.svg';

    if (profileStatus) {
      profileStatus.textContent = 'Profile decrypted.';
      profileStatus.className = 'mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2';
      setTimeout(() => {
        profileStatus.classList.add('hidden');
      }, 1500);
    }

    // Determine role + links
    const roles = data.roles || []; // backend should return roles array
    const isSiteAdmin = roles.includes('site_admin') || roles.includes('administrator');
    if (isSiteAdmin) {
      roleLabel.textContent = "Site Admin";
      jobboardLinks.innerHTML = `
        <p class="mt-2"><a href="/#admin" class="text-blue-600">Open Admin Panel</a></p>
      `;
      if (toggleAddressBtn) toggleAddressBtn.classList.add('hidden');
      if (addressSection) addressSection.classList.add('hidden');
      if (hideEmailToggle) hideEmailToggle.classList.add('hidden');
      return;
    }

    if (roles.includes('employer')) {
      const verified = data.employer_verified;
      roleLabel.textContent = verified ? "Employer (Verified)" : "Employer (Pending Verification)";
      jobboardLinks.innerHTML = `
        <p class="mt-2"><a href="/#my-job-posts" class="text-blue-600">Manage My Openings</a></p>
      `;
    } else {
      roleLabel.textContent = "Job Seeker";
      jobboardLinks.innerHTML = `
        <p class="mt-2"><a href="/#resume" class="text-blue-600">Manage Resume & Cover Letter</a></p>
        <p class="mt-2"><a href="/#my-applications" class="text-blue-600">My Applications</a></p>
      `;
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

  let addressCollapsed = false;
  const updateAddressVisibility = () => {
    if (!addressSection || !toggleAddressBtn) return;
    if (addressCollapsed) {
      addressSection.classList.add('hidden');
      toggleAddressBtn.textContent = 'Show Address Details';
    } else {
      addressSection.classList.remove('hidden');
      toggleAddressBtn.textContent = 'Hide Address Details';
    }
  };
  updateAddressVisibility();
  toggleAddressBtn?.addEventListener('click', () => {
    addressCollapsed = !addressCollapsed;
    updateAddressVisibility();
  });
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
