import { getSessionCached } from '../utils/session.js';

export async function renderAdmin(container) {
  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4">Admin</h1>

      <div id="adminNotice" class="mb-4 text-sm text-gray-600"></div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Create User</h2>
        <form id="adminCreateUser" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input name="username" class="p-2 border rounded" placeholder="Username" required />
          <input name="email" type="email" class="p-2 border rounded" placeholder="Email" required />
          <input name="password" type="text" class="p-2 border rounded" placeholder="Temp Password" required />
          <select name="role" class="p-2 border rounded">
            <option value="employee">Employee</option>
            <option value="employer">Employer</option>
            <option value="site_admin">Site Admin</option>
          </select>
          <div class="flex items-center space-x-2 md:col-span-2">
            <button type="button" id="generateTestUser" class="text-sm text-indigo-600 hover:underline">Generate Test User</button>
            <button type="button" id="generatePassword" class="text-sm text-indigo-600 hover:underline">Generate Password</button>
          </div>
          <button type="submit" class="text-purple px-4 py-2 rounded md:col-span-2">Create User</button>
        </form>
        <p id="createUserMsg" class="text-sm mt-2"></p>
      </div>

      <div class="mb-10">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-semibold">Users</h2>
          <div class="flex items-center space-x-3">
            <button id="exportUsers" class="text-sm text-indigo-600 hover:underline">Export CSV</button>
            <button id="refreshUsers" class="text-sm text-indigo-600 hover:underline">Refresh</button>
          </div>
        </div>
        <div id="usersContainer" class="space-y-3"></div>
      </div>

      <div class="mb-10">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-semibold">Jobs</h2>
          <div class="flex items-center space-x-3">
            <button id="exportJobs" class="text-sm text-indigo-600 hover:underline">Export CSV</button>
            <button id="refreshJobs" class="text-sm text-indigo-600 hover:underline">Refresh</button>
          </div>
        </div>
        <div id="jobsContainer" class="space-y-3"></div>
      </div>

      <div class="mb-10">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-semibold">Audit Log</h2>
          <button id="refreshAudit" class="text-sm text-indigo-600 hover:underline">Refresh</button>
        </div>
        <div id="auditContainer" class="space-y-2 text-sm"></div>
      </div>
    </div>
  `;

  const noticeEl = container.querySelector('#adminNotice');
  const usersContainer = container.querySelector('#usersContainer');
  const jobsContainer = container.querySelector('#jobsContainer');
  const refreshUsersBtn = container.querySelector('#refreshUsers');
  const refreshJobsBtn = container.querySelector('#refreshJobs');
  const exportUsersBtn = container.querySelector('#exportUsers');
  const exportJobsBtn = container.querySelector('#exportJobs');
  const refreshAuditBtn = container.querySelector('#refreshAudit');
  const auditContainer = container.querySelector('#auditContainer');
  const createForm = container.querySelector('#adminCreateUser');
  const createMsg = container.querySelector('#createUserMsg');
  const generateTestUserBtn = container.querySelector('#generateTestUser');
  const generatePasswordBtn = container.querySelector('#generatePassword');

  const session = await getSessionCached({ maxAgeMs: 30000 });
  const roles = Array.isArray(session?.roles) ? session.roles : [];
  if (!roles.includes('site_admin') && !roles.includes('administrator')) {
    noticeEl.textContent = 'Access denied.';
    return;
  }

  async function fetchUsers() {
    usersContainer.innerHTML = '<p class="text-sm text-gray-500">Loading users...</p>';
    const res = await fetch('/wp-json/customapi/v1/admin/users', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      usersContainer.innerHTML = `<p class="text-sm text-red-600">${data.message || 'Failed to load users.'}</p>`;
      return;
    }

    usersContainer.innerHTML = data.map(u => `
      <div class="border rounded p-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">${u.username}</div>
            <div class="text-xs text-gray-500">Role: ${u.roles?.join(', ') || ''}</div>
          </div>
          <div class="flex items-center space-x-2">
            <button class="text-sm text-indigo-600 hover:underline" data-action="toggle" data-id="${u.id}">Show details</button>
            <button class="text-sm text-red-600 hover:underline" data-action="delete" data-id="${u.id}">Delete</button>
          </div>
        </div>
        <div class="hidden mt-3 border-t pt-3" id="details-${u.id}">
          <div class="text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    `).join('');
  }

  async function fetchJobs() {
    jobsContainer.innerHTML = '<p class="text-sm text-gray-500">Loading jobs...</p>';
    const res = await fetch('/wp-json/customapi/v1/admin/jobs', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      jobsContainer.innerHTML = `<p class="text-sm text-red-600">${data.message || 'Failed to load jobs.'}</p>`;
      return;
    }

    jobsContainer.innerHTML = data.map(j => `
      <div class="border rounded p-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">${j.title}</div>
            <div class="text-xs text-gray-500">Status: ${j.status} • ID: ${j.id}</div>
          </div>
          <div class="flex items-center space-x-2">
            <button class="text-sm text-indigo-600 hover:underline" data-action="edit-job" data-id="${j.id}" data-title="${encodeURIComponent(j.title)}" data-status="${j.status}">Edit</button>
            <button class="text-sm text-red-600 hover:underline" data-action="delete-job" data-id="${j.id}">Delete</button>
          </div>
        </div>
        <div class="hidden mt-3 border-t pt-3" id="job-edit-${j.id}">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input class="p-2 border rounded text-sm" id="job-title-${j.id}" placeholder="Title" />
            <select class="p-2 border rounded text-sm" id="job-status-${j.id}">
              <option value="publish">Publish</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div class="mt-2 flex items-center space-x-2">
            <button class="text-sm text-purple px-3 py-1 rounded" data-action="save-job" data-id="${j.id}">Save</button>
            <span class="text-xs" id="job-msg-${j.id}"></span>
          </div>
        </div>
      </div>
    `).join('');
  }

  async function fetchAudit() {
    auditContainer.innerHTML = '<p class="text-gray-500">Loading audit log...</p>';
    const res = await fetch('/wp-json/customapi/v1/admin/audit', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      auditContainer.innerHTML = `<p class="text-red-600">${data.message || 'Failed to load audit log.'}</p>`;
      return;
    }
    auditContainer.innerHTML = data.length
      ? data.map(e => {
          const when = new Date(e.time * 1000).toLocaleString();
          const meta = e.meta ? JSON.stringify(e.meta) : '';
          return `<div class="border rounded p-2">
            <div><strong>${e.action}</strong> • ${when} • admin ${e.admin_id}</div>
            <div class="text-xs text-gray-600">${meta}</div>
          </div>`;
        }).join('')
      : '<p class="text-gray-500">No audit entries yet.</p>';
  }

  usersContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const userId = btn.dataset.id;
    if (action === 'toggle') {
      const detailEl = container.querySelector(`#details-${userId}`);
      if (!detailEl) return;
      if (!detailEl.classList.contains('hidden')) {
        detailEl.classList.add('hidden');
        btn.textContent = 'Show details';
        return;
      }
      btn.textContent = 'Hide details';
      detailEl.classList.remove('hidden');
      const res = await fetch(`/wp-json/customapi/v1/admin/user?userId=${userId}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        detailEl.innerHTML = `<p class="text-sm text-red-600">${data.message || 'Failed to load details.'}</p>`;
        return;
      }
      detailEl.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>First Name: ${data.first_name || ''}</div>
          <div>Last Name: ${data.last_name || ''}</div>
          <div>Company: ${data.company || ''}</div>
          <div>Verified: ${data.email_verified ? 'Yes' : 'No'}</div>
          <div>Email: ${data.email || ''}</div>
          <div>City: ${data.city || ''}</div>
          <div>State: ${data.state || ''}</div>
          <div>ZIP: ${data.zip || ''}</div>
        </div>
        <div class="mt-3 flex items-center space-x-2">
          <select class="p-2 border rounded text-sm" id="role-${userId}">
            <option value="employee">Employee</option>
            <option value="employer">Employer</option>
            <option value="site_admin">Site Admin</option>
          </select>
          <label class="text-sm flex items-center space-x-2">
            <input type="checkbox" id="verified-${userId}" ${data.email_verified ? 'checked' : ''} />
            <span>Verified</span>
          </label>
          <button class="text-sm text-purple px-3 py-1 rounded" data-action="save" data-id="${userId}">Save</button>
        </div>
        <p id="saveMsg-${userId}" class="text-xs mt-2"></p>
      `;
      const roleSel = detailEl.querySelector(`#role-${userId}`);
      if (roleSel && Array.isArray(data.roles)) {
        const current = data.roles.includes('site_admin')
          ? 'site_admin'
          : (data.roles.includes('employer') ? 'employer' : 'employee');
        roleSel.value = current;
      }
    }
    if (action === 'delete') {
      if (!confirm('Delete this user?')) return;
      const res = await fetch('/wp-json/customapi/v1/admin/user-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: Number(userId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Delete failed');
        return;
      }
      fetchUsers();
    }
    if (action === 'save') {
      const roleSel = container.querySelector(`#role-${userId}`);
      const verified = container.querySelector(`#verified-${userId}`);
      const msg = container.querySelector(`#saveMsg-${userId}`);
      const res = await fetch('/wp-json/customapi/v1/admin/user-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: Number(userId),
          role: roleSel?.value,
          email_verified: verified?.checked || false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        msg.textContent = data.message || 'Update failed';
        msg.className = 'text-xs mt-2 text-red-600';
        return;
      }
      msg.textContent = 'Saved.';
      msg.className = 'text-xs mt-2 text-green-700';
      fetchUsers();
    }
  });

  jobsContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const jobId = btn.dataset.id;
    if (action === 'edit-job') {
      const panel = container.querySelector(`#job-edit-${jobId}`);
      const titleInput = container.querySelector(`#job-title-${jobId}`);
      const statusSelect = container.querySelector(`#job-status-${jobId}`);
      if (!panel || !titleInput || !statusSelect) return;
      if (!panel.classList.contains('hidden')) {
        panel.classList.add('hidden');
        return;
      }
      panel.classList.remove('hidden');
      titleInput.value = decodeURIComponent(btn.dataset.title || '');
      statusSelect.value = btn.dataset.status || 'publish';
    }
    if (action === 'save-job') {
      const titleInput = container.querySelector(`#job-title-${jobId}`);
      const statusSelect = container.querySelector(`#job-status-${jobId}`);
      const msg = container.querySelector(`#job-msg-${jobId}`);
      const res = await fetch('/wp-json/customapi/v1/admin/job-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: Number(jobId),
          title: titleInput?.value || '',
          status: statusSelect?.value || 'publish',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        msg.textContent = data.message || 'Update failed';
        msg.className = 'text-xs text-red-600';
        return;
      }
      msg.textContent = 'Saved.';
      msg.className = 'text-xs text-green-700';
      fetchJobs();
      fetchAudit();
    }
    if (action === 'delete-job') {
      if (!confirm('Delete this job?')) return;
      const res = await fetch('/wp-json/customapi/v1/admin/job-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: Number(jobId) }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Delete failed');
        return;
      }
      fetchJobs();
      fetchAudit();
    }
  });

  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    createMsg.textContent = '';
    const formData = new FormData(createForm);
    const payload = Object.fromEntries(formData.entries());
    const res = await fetch('/wp-json/customapi/v1/admin/user-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      createMsg.textContent = data.message || 'Create failed';
      createMsg.className = 'text-sm text-red-600';
      return;
    }
    createMsg.textContent = 'User created.';
    createMsg.className = 'text-sm text-green-700';
    createForm.reset();
    fetchUsers();
    fetchAudit();
  });

  generatePasswordBtn.addEventListener('click', () => {
    const pwd = Math.random().toString(36).slice(2) + 'A1!';
    createForm.querySelector('input[name="password"]').value = pwd;
  });

  generateTestUserBtn.addEventListener('click', () => {
    const stamp = Date.now().toString().slice(-6);
    createForm.querySelector('input[name="username"]').value = `test_user_${stamp}`;
    createForm.querySelector('input[name="email"]').value = `test_${stamp}@example.com`;
    createForm.querySelector('select[name="role"]').value = 'employee';
    const pwd = Math.random().toString(36).slice(2) + 'A1!';
    createForm.querySelector('input[name="password"]').value = pwd;
  });

  refreshUsersBtn.addEventListener('click', fetchUsers);
  refreshJobsBtn.addEventListener('click', fetchJobs);
  refreshAuditBtn.addEventListener('click', fetchAudit);
  exportUsersBtn.addEventListener('click', () => {
    window.location.href = '/wp-json/customapi/v1/admin/export-users';
  });
  exportJobsBtn.addEventListener('click', () => {
    window.location.href = '/wp-json/customapi/v1/admin/export-jobs';
  });

  fetchUsers();
  fetchJobs();
  fetchAudit();
}
