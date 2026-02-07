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

    <form class="grid grid-cols-1 md:grid-cols-2 gap-4" onsubmit="handleProfileUpdate(event)">
    <div>
      <label for="username" class="block font-semibold">Username</label>
      <input type="text" id="username" name="username" class="w-full p-2 border rounded" readonly />
    </div>

    <div>
      <label for="email" class="block font-semibold">Email</label>
      <input type="email" id="email" name="email" class="w-full p-2 border rounded" readonly />
    </div>

    <div id="companySection" class="hidden">
      <h3 class="text-lg font-semibold mt-4">Company Profile</h3>
      <label for="company" class="block font-semibold">Company</label>
      <input type="text" id="company" name="company" class="w-full p-2 border rounded" readonly /><br />

      <label for="company_site" class="block font-semibold">Company Website</label>
      <input type="url" id="company_site" name="company_site" class="w-full p-2 border rounded" placeholder="https://example.com" readonly /><br />

      <label for="company_logo" class="block font-semibold">Company Logo URL</label>
      <input type="url" id="company_logo" name="company_logo" class="w-full p-2 border rounded" placeholder="https://..." /><br />

      <label for="company_street1" class="block font-semibold">Company Street</label>
      <input type="text" id="company_street1" name="company_street1" class="w-full p-2 border rounded" /><br />

      <label for="company_street2" class="block font-semibold">Company Suite (optional)</label>
      <input type="text" id="company_street2" name="company_street2" class="w-full p-2 border rounded" /><br />

      <label for="company_city" class="block font-semibold">Company City</label>
      <input type="text" id="company_city" name="company_city" class="w-full p-2 border rounded" /><br />

      <label for="company_state" class="block font-semibold">Company State</label>
      <input type="text" id="company_state" name="company_state" class="w-full p-2 border rounded" maxlength="2" /><br />

      <label for="company_zip" class="block font-semibold">Company ZIP</label>
      <input type="text" id="company_zip" name="company_zip" class="w-full p-2 border rounded" /><br />

      <label for="company_country" class="block font-semibold">Company Country</label>
      <input type="text" id="company_country" name="company_country" class="w-full p-2 border rounded" /><br />

      <button type="button" id="saveCompanyBtn" class="text-purple px-4 py-2 rounded">Save Company</button>
      <p id="companyMsg" class="text-sm mt-2"></p>
    </div>

    <div>
      <label for="first_name" class="block font-semibold">First Name</label>
      <input type="text" id="first_name" name="first_name" class="w-full p-2 border rounded" />
    </div>

    <div>
      <label for="last_name" class="block font-semibold">Last Name</label>
      <input type="text" id="last_name" name="last_name" class="w-full p-2 border rounded" />
    </div>

    <div>
      <label for="dob" class="block font-semibold">Date of Birth</label>
      <input type="date" id="dob" name="dob" class="w-full p-2 border rounded" />
    </div>

    <div class="md:col-span-2" id="addressSection">
      <h3 class="text-lg font-semibold mt-2">Address (USA Only)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div class="md:col-span-2">
          <label for="street1" class="block font-semibold">Street Address</label>
          <input type="text" id="street1" name="street1" class="w-full p-2 border rounded" required />
          <p class="text-xs text-gray-500 mt-1">Include a street number and name (e.g., 111 N Main St).</p>
        </div>
        <div>
          <label for="street2" class="block font-semibold">Unit/Suite (optional)</label>
          <input type="text" id="street2" name="street2" class="w-full p-2 border rounded" />
        </div>
        <div>
          <label for="city" class="block font-semibold">City</label>
          <input type="text" id="city" name="city" class="w-full p-2 border rounded" required />
        </div>
        <div>
          <label for="state" class="block font-semibold">State (2-letter)</label>
          <input type="text" id="state" name="state" class="w-full p-2 border rounded" required maxlength="2" />
        </div>
        <div>
          <label for="zip" class="block font-semibold">ZIP Code</label>
          <input type="text" id="zip" name="zip" class="w-full p-2 border rounded" required />
        </div>
        <div>
          <label for="country" class="block font-semibold">Country</label>
          <input type="text" id="country" name="country" class="w-full p-2 border rounded" required />
        </div>
      </div>
    </div>

    <div class="md:col-span-2">
      <label class="flex items-center space-x-2">
        <input type="checkbox" id="hide_email" name="hide_email" />
        <span class="text-sm">Hide my email from employers</span>
      </label>
    </div>

    <div class="md:col-span-2">
      <p id="profileError" class="text-sm text-red-600"></p>
      <button type="submit" class="text-purple px-4 py-2 rounded">Save</button>
    </div>
  </form>

    <div id="jobboard-links" class="mt-4"></div>
    <div id="companyOwnerSection" class="mt-8 hidden"></div>
    <div id="savedJobsSection" class="mt-6"></div>
    <div id="jobAlertsSection" class="mt-6"></div>

    <p class="mt-4"><a href="/#update-password" class="text-purple-600">Update Password</a></p>
  </div>
`;

  const jobboardLinks = container.querySelector('#jobboard-links');
  const roleLabel     = container.querySelector('#roleLabel');
  const previewImg    = container.querySelector('#avatarPreview');
  const profileStatus = container.querySelector('#profileStatus');
  const addressSection = container.querySelector('#addressSection');
  const hideEmailToggle = container.querySelector('#hide_email')?.closest('label');
  const savedJobsSection = container.querySelector('#savedJobsSection');
  const jobAlertsSection = container.querySelector('#jobAlertsSection');
  const companyOwnerSection = container.querySelector('#companyOwnerSection');

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
      if (addressSection) {
        addressSection.classList.add('hidden');
        ['street1', 'city', 'state', 'zip', 'country'].forEach((id) => {
          const el = container.querySelector(`#${id}`);
          if (el) el.required = false;
        });
      }
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

      const renderSavedJobs = async () => {
        if (!savedJobsSection) return;
        savedJobsSection.innerHTML = `<h3 class="text-lg font-semibold mb-2">Saved Jobs</h3><p class="text-sm text-gray-500">Loading...</p>`;
        try {
          const savedRes = await fetch('/wp-json/customapi/v1/saved-jobs', { credentials: 'include' });
          const savedIds = await savedRes.json();
          if (!savedRes.ok || !Array.isArray(savedIds) || !savedIds.length) {
            savedJobsSection.innerHTML = `<h3 class="text-lg font-semibold mb-2">Saved Jobs</h3><p class="text-sm text-gray-500">No saved jobs yet.</p>`;
            return;
          }
          const listRes = await fetch('/wp-json/customapi/v1/get-list');
          const list = await listRes.json();
          const savedSet = new Set(savedIds.map(Number));
          const matches = (Array.isArray(list) ? list : []).filter(j => savedSet.has(Number(j.id || j._id || j.slug)));
          savedJobsSection.innerHTML = `
            <h3 class="text-lg font-semibold mb-2">Saved Jobs</h3>
            <div class="space-y-2">
              ${matches.map(job => `
                <div class="border rounded-lg p-3 bg-white shadow-sm">
                  <div class="font-medium">${job.title || job.name || 'Job'}</div>
                  <div class="text-xs text-gray-500">${job.meta?.company || ''}</div>
                  <a class="text-sm text-indigo-600 hover:underline" href="/#list-detail?id=${job.id}">View job</a>
                </div>
              `).join('')}
            </div>
          `;
        } catch (err) {
          savedJobsSection.innerHTML = `<h3 class="text-lg font-semibold mb-2">Saved Jobs</h3><p class="text-sm text-gray-500">Unable to load saved jobs.</p>`;
        }
      };

      const renderAlerts = async () => {
        if (!jobAlertsSection) return;
        jobAlertsSection.innerHTML = `<h3 class="text-lg font-semibold mb-2">Job Alerts</h3><p class="text-sm text-gray-500">Loading...</p>`;
        try {
          const res = await fetch('/wp-json/customapi/v1/job-alerts', { credentials: 'include' });
          const data = await res.json();
          if (!res.ok || !Array.isArray(data) || !data.length) {
            jobAlertsSection.innerHTML = `<h3 class="text-lg font-semibold mb-2">Job Alerts</h3><p class="text-sm text-gray-500">No alerts yet.</p>`;
            return;
          }
          jobAlertsSection.innerHTML = `
            <h3 class="text-lg font-semibold mb-2">Job Alerts</h3>
            <div class="space-y-2">
              ${data.map(alert => `
                <div class="border rounded-lg p-3 bg-white shadow-sm">
                  <div class="font-medium">${alert.label || 'Alert'}</div>
                  <div class="text-xs text-gray-500">${alert.criteria?.query ? `Query: ${alert.criteria.query}` : 'Saved search'}</div>
                </div>
              `).join('')}
            </div>
          `;
        } catch (err) {
          jobAlertsSection.innerHTML = `<h3 class="text-lg font-semibold mb-2">Job Alerts</h3><p class="text-sm text-gray-500">Unable to load alerts.</p>`;
        }
      };

      renderSavedJobs();
      renderAlerts();
    }

  }

  async function loadCompanyOwner() {
    if (!companyOwnerSection) return;
    try {
      const res = await fetch('/api/company-owner', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data?.company) {
        companyOwnerSection.classList.add('hidden');
        return;
      }
      const company = data.company;
      const isVerified = Number(company.verified) === 1;
      companyOwnerSection.classList.remove('hidden');
      companyOwnerSection.innerHTML = `
        <div class="border rounded-lg p-4 bg-white">
          <h3 class="text-lg font-semibold mb-3">Company Page</h3>
          <p class="text-xs text-gray-500 mb-3">Update how your company appears publicly.</p>
          ${isVerified ? '' : '<p class="text-xs text-amber-700 mb-3">Company updates are locked until a site admin verifies your company.</p>'}
          <form id="companyOwnerForm" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input name="logo_url" class="p-2 border rounded" placeholder="Logo URL" value="${company.logo_url || ''}" />
            <input name="logo_file" type="file" accept="image/*" class="p-2 border rounded" />
            <input name="street1" class="p-2 border rounded" placeholder="Street Address" value="${company.street1 || ''}" />
            <input name="street2" class="p-2 border rounded" placeholder="Unit/Suite" value="${company.street2 || ''}" />
            <input name="city" class="p-2 border rounded" placeholder="City" value="${company.city || ''}" />
            <input name="state" class="p-2 border rounded" placeholder="State" value="${company.state || ''}" />
            <input name="zip" class="p-2 border rounded" placeholder="ZIP" value="${company.zip || ''}" />
            <input name="country" class="p-2 border rounded" placeholder="Country" value="${company.country || ''}" />
            <button type="submit" class="text-purple px-4 py-2 rounded md:col-span-2" ${isVerified ? '' : 'disabled'}>Save Company</button>
          </form>
          <p id="companyOwnerMsg" class="text-sm mt-2"></p>
        </div>
      `;
      const form = companyOwnerSection.querySelector('#companyOwnerForm');
      const msg = companyOwnerSection.querySelector('#companyOwnerMsg');
      const logoUrlInput = companyOwnerSection.querySelector('input[name="logo_url"]');
      const logoFileInput = companyOwnerSection.querySelector('input[name="logo_file"]');
      logoFileInput?.addEventListener('change', () => {
        const file = logoFileInput.files && logoFileInput.files[0];
        if (!file || !logoUrlInput) return;
        const reader = new FileReader();
        reader.onload = () => {
          logoUrlInput.value = typeof reader.result === 'string' ? reader.result : '';
        };
        reader.readAsDataURL(file);
      });

      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isVerified) {
          msg.textContent = 'Company is not verified yet.';
          msg.className = 'text-sm text-amber-700 mt-2';
          return;
        }
        msg.textContent = 'Saving...';
        const payload = Object.fromEntries(new FormData(form).entries());
        delete payload.logo_file;
        const saveRes = await fetch('/api/company-owner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) {
          msg.textContent = saveData.error || 'Save failed.';
          msg.className = 'text-sm text-red-600 mt-2';
          return;
        }
        msg.textContent = 'Company updated.';
        msg.className = 'text-sm text-green-700 mt-2';
      });
    } catch (err) {
      companyOwnerSection.classList.add('hidden');
    }
  }

  async function getProfileInfo() {
    try {
      // Stale-while-revalidate: show cached data immediately if available
      const cached = getUserProfileCachedAny({ light: false });
      if (cached) {
        applyProfileData(cached);
        loadCompanyOwner();
      }

      const data = await getUserProfileCached({ maxAgeMs: 30000, light: false });
      if (data) {
        applyProfileData(data);
        loadCompanyOwner();
      } else {
        alert('❌ Error fetching profile: Unable to load profile.');
        window.location.hash = '#/login';
      }
    } catch (err) {
      alert('❌ Network error: ' + err.message);
    }
  }

  getProfileInfo();

  if (addressSection) {
    addressSection.classList.remove('hidden');
  }
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
    const response = await fetch('/api/user-profile-update', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    let data = {};
    try {
      data = await response.json();
    } catch (err) {
      data = {};
    }

    if (response.ok && (data.success || Object.keys(data).length === 0)) {
      if (errorEl) {
        errorEl.textContent = 'Profile updated successfully.';
        errorEl.className = 'text-sm text-green-700';
      }
    } else {
      if (errorEl) {
        errorEl.textContent = 'Failed to update profile: ' + (data.message || 'Unknown error');
        errorEl.className = 'text-sm text-red-600';
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Network error: ' + err.message;
      errorEl.className = 'text-sm text-red-600';
    }
  }
}

window.handleProfileUpdate = handleProfileUpdate; // 👈 make it globally callable from form
