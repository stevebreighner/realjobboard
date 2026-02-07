import { getSessionCached } from '../utils/session.js';

export async function renderAdmin(container) {
  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4">Admin</h1>

      <div id="adminNotice" class="mb-4 text-sm text-gray-600"></div>

      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-2">Dev Mode</h2>
        <p class="text-sm text-gray-600 mb-3">Use this for local/dev environments to bypass human verification.</p>
        <div class="flex items-center gap-3">
          <label class="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" id="devModeToggle" class="h-4 w-4" />
            <span>Disable Turnstile/Captcha checks</span>
          </label>
          <span id="devModeStatus" class="text-xs text-gray-500"></span>
        </div>
      </div>

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
          <h2 class="text-xl font-semibold">Company Groups</h2>
          <span class="text-xs text-gray-500">Grouped by Company Team Key</span>
        </div>
        <div id="companyGroups" class="space-y-2 text-sm"></div>
      </div>

      <div class="mb-10">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-semibold">Companies</h2>
          <button id="refreshCompanies" class="text-sm text-indigo-600 hover:underline">Refresh</button>
        </div>
        <div id="companiesContainer" class="space-y-3 text-sm"></div>
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

      <div class="mb-10">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-semibold">Email Templates</h2>
          <div class="flex items-center space-x-3">
            <button id="addTemplate" class="text-sm text-indigo-600 hover:underline">Add template</button>
            <button id="saveTemplates" class="text-sm text-indigo-600 hover:underline">Save</button>
          </div>
        </div>
        <p class="text-xs text-gray-500 mb-2">These templates appear in employer/applicant message dropdowns.</p>
        <div id="templatesMsg" class="text-sm mb-2"></div>
        <div class="flex items-center gap-3 text-xs text-gray-500 mb-2">
          <span>Variables: {job_title}, {company}, {site_name}, {site_url}, {applicant_name}, {employer_name}</span>
        </div>
        <div id="historyRow" class="flex items-center gap-2 text-xs text-gray-500 mb-2 hidden">
          <label for="historySelect">Restore previous:</label>
          <select id="historySelect" class="border rounded p-1 text-xs"></select>
          <button id="restoreHistory" class="text-xs text-indigo-600 hover:underline">Restore</button>
        </div>
        <div id="templatesContainer" class="space-y-3"></div>
      </div>

      <div class="mb-10">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-semibold">Promo Codes</h2>
          <button id="refreshPromos" class="text-sm text-indigo-600 hover:underline">Refresh</button>
        </div>
        <form id="promoForm" class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <select name="discount" class="p-2 border rounded">
            <option value="20">20% off</option>
            <option value="50">50% off</option>
            <option value="100">Free</option>
          </select>
          <input name="max_uses" class="p-2 border rounded" placeholder="Max uses (optional)" />
          <button type="submit" class="text-purple px-4 py-2 rounded">Generate</button>
        </form>
        <div id="promoMsg" class="text-sm mb-2"></div>
        <div id="promoList" class="space-y-2 text-sm"></div>
      </div>

      <div class="mb-10">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-xl font-semibold">System Log</h2>
          <div class="flex items-center gap-3">
            <button id="downloadLog" class="text-sm text-indigo-600 hover:underline">Download</button>
            <button id="refreshLog" class="text-sm text-indigo-600 hover:underline">Refresh</button>
          </div>
        </div>
        <div id="logContainer" class="text-xs bg-slate-50 border rounded p-3 whitespace-pre-wrap"></div>
      </div>
    </div>
  `;

  const noticeEl = container.querySelector('#adminNotice');
  const usersContainer = container.querySelector('#usersContainer');
  const jobsContainer = container.querySelector('#jobsContainer');
  const companyGroups = container.querySelector('#companyGroups');
  const companiesContainer = container.querySelector('#companiesContainer');
  const refreshCompaniesBtn = container.querySelector('#refreshCompanies');
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
  const addTemplateBtn = container.querySelector('#addTemplate');
  const saveTemplatesBtn = container.querySelector('#saveTemplates');
  const templatesContainer = container.querySelector('#templatesContainer');
  const templatesMsg = container.querySelector('#templatesMsg');
  const historyRow = container.querySelector('#historyRow');
  const historySelect = container.querySelector('#historySelect');
  const restoreHistoryBtn = container.querySelector('#restoreHistory');
  const devModeToggle = container.querySelector('#devModeToggle');
  const devModeStatus = container.querySelector('#devModeStatus');
  const promoForm = container.querySelector('#promoForm');
  const promoList = container.querySelector('#promoList');
  const promoMsg = container.querySelector('#promoMsg');
  const refreshPromosBtn = container.querySelector('#refreshPromos');
  const refreshLogBtn = container.querySelector('#refreshLog');
  const downloadLogBtn = container.querySelector('#downloadLog');
  const logContainer = container.querySelector('#logContainer');

  const session = await getSessionCached({ maxAgeMs: 30000 });
  const roles = Array.isArray(session?.roles) ? session.roles : [];
  if (!roles.includes('site_admin') && !roles.includes('administrator')) {
    noticeEl.textContent = 'Access denied.';
    return;
  }
  noticeEl.innerHTML = `
    <div class="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
      <strong>Stripe note:</strong> If you change the site URL/domain, remember to update your Stripe webhook
      endpoint URL and any Stripe env vars in <code>.env</code> (or hosting settings).
    </div>
  `;

  async function loadDevFlags() {
    if (!devModeToggle) return;
    try {
      const res = await fetch('/wp-json/customapi/v1/admin/flags?_=' + Date.now(), { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        devModeToggle.checked = !!data.dev_mode;
        devModeStatus.textContent = data.dev_mode ? 'Dev mode ON' : 'Dev mode OFF';
      }
    } catch (err) {
      devModeStatus.textContent = 'Unable to load dev mode';
    }
  }

  devModeToggle?.addEventListener('change', async () => {
    devModeStatus.textContent = 'Saving...';
    try {
      const res = await fetch('/wp-json/customapi/v1/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dev_mode: devModeToggle.checked ? 1 : 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        devModeStatus.textContent = data.message || 'Failed to save';
        return;
      }
      devModeStatus.textContent = data.dev_mode ? 'Dev mode ON' : 'Dev mode OFF';
    } catch (err) {
      devModeStatus.textContent = 'Failed to save';
    }
  });

  await loadDevFlags();

  async function loadPromos() {
    if (!promoList) return;
    promoList.innerHTML = '<p class="text-xs text-gray-500">Loading promos...</p>';
    try {
      const res = await fetch('/api/admin/promos', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        promoList.innerHTML = `<p class="text-xs text-red-600">${data.error || 'Failed to load promos.'}</p>`;
        return;
      }
      promoList.innerHTML = data.length ? data.map(p => `
        <div class="border rounded p-2 flex items-center justify-between">
          <div>
            <div class="font-medium">${p.code}</div>
            <div class="text-xs text-gray-500">${p.is_free ? 'Free' : `${p.percent_off}% off`} • Uses: ${p.uses}/${p.max_uses || '∞'}</div>
          </div>
          <div class="text-xs text-gray-400">${p.expires_at ? `Expires ${new Date(p.expires_at).toLocaleDateString()}` : 'No expiry'}</div>
        </div>
      `).join('') : '<p class="text-xs text-gray-500">No promo codes yet.</p>';
    } catch (err) {
      promoList.innerHTML = '<p class="text-xs text-red-600">Failed to load promos.</p>';
    }
  }

  refreshPromosBtn?.addEventListener('click', loadPromos);
  promoForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!promoMsg) return;
    promoMsg.textContent = 'Creating...';
    const formData = Object.fromEntries(new FormData(promoForm).entries());
    const payload = {
      discount: parseInt(formData.discount || '0', 10),
      max_uses: formData.max_uses ? parseInt(formData.max_uses, 10) : null,
    };
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        promoMsg.textContent = data.error || 'Failed to create promo.';
        return;
      }
      promoMsg.textContent = `Created: ${data.promo?.code || ''}`;
      await loadPromos();
    } catch (err) {
      promoMsg.textContent = 'Failed to create promo.';
    }
  });

  await loadPromos();

  async function loadLog() {
    if (!logContainer) return;
    logContainer.textContent = 'Loading...';
    try {
      const res = await fetch('/api/admin/error-log', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        logContainer.textContent = data.error || 'Failed to load log.';
        return;
      }
      logContainer.textContent = (data.lines || []).join('\n') || 'Log is empty.';
    } catch (err) {
      logContainer.textContent = 'Failed to load log.';
    }
  }

  refreshLogBtn?.addEventListener('click', loadLog);
  downloadLogBtn?.addEventListener('click', () => {
    window.location.href = '/api/admin/error-log-download';
  });
  await loadLog();

  async function fetchUsers() {
    usersContainer.innerHTML = '<p class="text-sm text-gray-500">Loading users...</p>';
    const res = await fetch(`/wp-json/customapi/v1/admin/users?_=${Date.now()}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      usersContainer.innerHTML = `<p class="text-sm text-red-600">${data.message || 'Failed to load users.'}</p>`;
      return;
    }

    const groups = {};
    data.forEach(u => {
      const key = (u.company_key || '').trim();
      const groupKey = key || '(No Team Key)';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(u);
    });
    const groupEntries = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    companyGroups.innerHTML = groupEntries.length
      ? groupEntries.map(([key, members]) => `
          <div class="border rounded p-3">
            <div class="font-semibold">${key}</div>
            <div class="text-xs text-gray-600">Members: ${members.length}</div>
            <div class="text-xs text-gray-600 mt-1">
              ${members.map(m => m.username).join(', ')}
            </div>
          </div>
        `).join('')
      : '<p class="text-gray-500">No groups yet.</p>';

    usersContainer.innerHTML = data.map(u => `
      <div class="border rounded p-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">${u.username}</div>
            <div class="text-xs text-gray-500">Role: ${u.roles?.join(', ') || ''}</div>
            ${u.roles?.includes('employer') ? `<div class="text-xs ${u.employer_verified ? 'text-green-700' : 'text-amber-700'}">Employer ${u.employer_verified ? 'Verified' : 'Pending'}</div>` : ''}
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

  async function fetchCompanies() {
    if (!companiesContainer) return;
    companiesContainer.innerHTML = '<p class="text-sm text-gray-500">Loading companies...</p>';
    const res = await fetch(`/api/admin/companies?_=${Date.now()}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      companiesContainer.innerHTML = `<p class="text-sm text-red-600">${data.error || 'Failed to load companies.'}</p>`;
      return;
    }
    companiesContainer.innerHTML = data.length
      ? data.map(c => {
          const verified = Number(c.verified) === 1;
          return `
            <div class="border rounded p-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="font-semibold">${c.name}</div>
                  <div class="text-xs text-gray-500">Slug: ${c.slug} • Code: ${c.code || ''}</div>
                  <div class="text-xs text-gray-500">Members: ${c.member_count || 0}</div>
                  <div class="text-xs ${verified ? 'text-green-700' : 'text-amber-700'}">${verified ? 'Verified' : 'Not verified'}</div>
                </div>
                <div class="flex items-center space-x-2">
                  <button class="text-sm text-indigo-600 hover:underline" data-action="toggle-company" data-id="${c.id}" data-verified="${verified ? 1 : 0}">
                    ${verified ? 'Unverify' : 'Verify'}
                  </button>
                  <button class="text-sm text-indigo-600 hover:underline" data-action="members" data-id="${c.id}">
                    Members
                  </button>
                </div>
              </div>
              <div class="hidden mt-3 border-t pt-3" id="company-detail-${c.id}">
                <div class="text-sm text-gray-600">Loading...</div>
              </div>
            </div>
          `;
        }).join('')
      : '<p class="text-sm text-gray-500">No companies yet.</p>';
  }

  async function fetchJobs() {
    jobsContainer.innerHTML = '<p class="text-sm text-gray-500">Loading jobs...</p>';
    const res = await fetch(`/api/admin/jobs?_=${Date.now()}`, { credentials: 'include' });
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

  refreshCompaniesBtn?.addEventListener('click', fetchCompanies);

  async function fetchAudit() {
    auditContainer.innerHTML = '<p class="text-gray-500">Loading audit log...</p>';
    const res = await fetch(`/wp-json/customapi/v1/admin/audit?_=${Date.now()}`, { credentials: 'include' });
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

  let emailTemplates = [];
  let templateHistory = [];
  let autosaveTimer = null;

  const renderTemplates = () => {
    templatesContainer.innerHTML = emailTemplates.length
      ? emailTemplates.map((tpl, idx) => `
          <div class="border rounded p-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input class="p-2 border rounded text-sm" data-role="tpl-title" data-idx="${idx}" placeholder="Title" value="${tpl.title || ''}" />
            <select class="p-2 border rounded text-sm" data-role="tpl-scope" data-idx="${idx}">
              <option value="employer" ${tpl.scope === 'employer' ? 'selected' : ''}>Employer</option>
              <option value="applicant" ${tpl.scope === 'applicant' ? 'selected' : ''}>Applicant</option>
            </select>
            <input class="p-2 border rounded text-sm" data-role="tpl-category" data-idx="${idx}" placeholder="Category" value="${tpl.category || ''}" />
            <button class="text-sm text-red-600 hover:underline justify-self-start md:justify-self-end" data-action="delete-template" data-idx="${idx}">Delete</button>
          </div>
            <textarea class="mt-2 w-full p-2 border rounded text-sm" rows="3" data-role="tpl-body" data-idx="${idx}" placeholder="Template body">${tpl.body || ''}</textarea>
          </div>
        `).join('')
      : '<p class="text-gray-500">No templates yet.</p>';
  };

  const fetchTemplates = async () => {
    templatesMsg.textContent = 'Loading templates...';
    templatesMsg.className = 'text-sm text-gray-500';
    const res = await fetch(`/wp-json/customapi/v1/admin/email-templates?_=${Date.now()}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) {
      templatesMsg.textContent = data.message || 'Failed to load templates.';
      templatesMsg.className = 'text-sm text-red-600';
      return;
    }
    emailTemplates = Array.isArray(data) ? data : (data.templates || []);
    templateHistory = Array.isArray(data?.history) ? data.history : [];
    templatesMsg.textContent = '';
    renderTemplates();

    if (historyRow && historySelect) {
      if (templateHistory.length) {
        historyRow.classList.remove('hidden');
        historySelect.innerHTML = templateHistory.map((h, idx) => {
          const label = new Date((h.time || 0) * 1000).toLocaleString();
          return `<option value="${idx}">${label}</option>`;
        }).join('');
      } else {
        historyRow.classList.add('hidden');
      }
    }
  };

  templatesContainer.addEventListener('input', (e) => {
    const target = e.target;
    const idx = Number(target.dataset.idx || -1);
    if (idx < 0 || !emailTemplates[idx]) return;
    if (target.dataset.role === 'tpl-title') emailTemplates[idx].title = target.value;
    if (target.dataset.role === 'tpl-body') emailTemplates[idx].body = target.value;
    if (target.dataset.role === 'tpl-category') emailTemplates[idx].category = target.value;
    scheduleAutosave();
  });

  templatesContainer.addEventListener('change', (e) => {
    const target = e.target;
    const idx = Number(target.dataset.idx || -1);
    if (idx < 0 || !emailTemplates[idx]) return;
    if (target.dataset.role === 'tpl-scope') emailTemplates[idx].scope = target.value;
    scheduleAutosave();
  });

  templatesContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="delete-template"]');
    if (!btn) return;
    const idx = Number(btn.dataset.idx || -1);
    if (idx < 0) return;
    emailTemplates.splice(idx, 1);
    renderTemplates();
  });

  addTemplateBtn?.addEventListener('click', () => {
    emailTemplates.push({ title: '', body: '', scope: 'employer', category: 'General', id: `tpl_${Date.now()}` });
    renderTemplates();
  });

  const saveTemplates = async () => {
    templatesMsg.textContent = 'Saving...';
    templatesMsg.className = 'text-sm text-gray-500';
    const res = await fetch('/wp-json/customapi/v1/admin/email-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ templates: emailTemplates }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      templatesMsg.textContent = data.message || 'Save failed.';
      templatesMsg.className = 'text-sm text-red-600';
      return;
    }
    templatesMsg.textContent = 'Templates saved.';
    templatesMsg.className = 'text-sm text-green-700';
    emailTemplates = data.templates || emailTemplates;
    templateHistory = data.history || templateHistory;
    renderTemplates();
  };

  const scheduleAutosave = () => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      saveTemplates();
    }, 1200);
  };

  saveTemplatesBtn?.addEventListener('click', saveTemplates);

  restoreHistoryBtn?.addEventListener('click', () => {
    const idx = Number(historySelect?.value || -1);
    if (idx < 0 || !templateHistory[idx]) return;
    if (!confirm('Restore this previous version?')) return;
    emailTemplates = templateHistory[idx].templates || [];
    renderTemplates();
    saveTemplates();
  });

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
          <div>Company Site: ${data.company_site || ''}</div>
          <div>Verified: ${data.email_verified ? 'Yes' : 'No'}</div>
          <div>Email: ${data.email || ''}</div>
          <div>City: ${data.city || ''}</div>
          <div>State: ${data.state || ''}</div>
          <div>ZIP: ${data.zip || ''}</div>
        </div>
        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <input class="p-2 border rounded text-sm" id="company-${userId}" placeholder="Company" value="${data.company || ''}" />
          <input class="p-2 border rounded text-sm" id="company-site-${userId}" placeholder="Company Website" value="${data.company_site || ''}" />
          <input class="p-2 border rounded text-sm md:col-span-2" id="company-key-${userId}" placeholder="Company Team Key" value="${data.company_key || ''}" />
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
          <label class="text-sm flex items-center space-x-2">
            <input type="checkbox" id="employer-verified-${userId}" ${data.employer_verified ? 'checked' : ''} />
            <span>Employer Verified</span>
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
      const employerVerified = container.querySelector(`#employer-verified-${userId}`);
      const company = container.querySelector(`#company-${userId}`);
      const companySite = container.querySelector(`#company-site-${userId}`);
      const companyKey = container.querySelector(`#company-key-${userId}`);
      const msg = container.querySelector(`#saveMsg-${userId}`);
      const res = await fetch('/wp-json/customapi/v1/admin/user-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: Number(userId),
          role: roleSel?.value,
          email_verified: verified?.checked || false,
          employer_verified: employerVerified?.checked || false,
          company: company?.value || '',
          company_site: companySite?.value || '',
          company_key: companyKey?.value || '',
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
      const res = await fetch('/api/admin/job-update', {
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
      const res = await fetch('/api/admin/job-delete', {
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

  companiesContainer?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const companyId = Number(btn.dataset.id || 0);
    if (!companyId) return;

    if (action === 'toggle-company') {
      const currentlyVerified = btn.dataset.verified === '1';
      const res = await fetch('/api/admin/company-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ company_id: companyId, verified: currentlyVerified ? 0 : 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Update failed');
        return;
      }
      fetchCompanies();
      return;
    }

    if (action === 'members') {
      const panel = container.querySelector(`#company-detail-${companyId}`);
      if (!panel) return;
      if (!panel.classList.contains('hidden')) {
        panel.classList.add('hidden');
        return;
      }
      panel.classList.remove('hidden');
      panel.innerHTML = '<div class="text-sm text-gray-600">Loading...</div>';
      try {
        const res = await fetch(`/api/admin/company?id=${companyId}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) {
          panel.innerHTML = `<div class="text-sm text-red-600">${data.error || 'Failed to load company.'}</div>`;
          return;
        }
        const members = Array.isArray(data.members) ? data.members : [];
        panel.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm font-semibold">Members</div>
            <button class="text-xs text-indigo-600 hover:underline" data-action="add-member" data-id="${companyId}">Add member</button>
          </div>
          <div class="space-y-2">
            ${members.length ? members.map(m => `
              <div class="flex items-center justify-between border rounded px-2 py-1 text-xs">
                <div>${m.username} • ${m.email} • <strong>${m.role}</strong></div>
                <button class="text-xs text-red-600 hover:underline" data-action="remove-member" data-id="${companyId}" data-user="${m.user_id}">Remove</button>
              </div>
            `).join('') : '<div class="text-xs text-gray-500">No members yet.</div>'}
          </div>
        `;
      } catch (err) {
        panel.innerHTML = '<div class="text-sm text-red-600">Failed to load company.</div>';
      }
      return;
    }

    if (action === 'add-member') {
      const userId = Number(prompt('Enter user ID to add:'));
      if (!userId) return;
      const role = prompt('Role (owner/editor/member):', 'member') || 'member';
      const res = await fetch('/api/admin/company-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ company_id: companyId, user_id: userId, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Add member failed');
        return;
      }
      fetchCompanies();
      const panel = container.querySelector(`#company-detail-${companyId}`);
      panel?.classList.add('hidden');
      return;
    }

    if (action === 'remove-member') {
      const userId = Number(btn.dataset.user || 0);
      if (!userId) return;
      if (!confirm('Remove this member?')) return;
      const res = await fetch('/api/admin/company-member-remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ company_id: companyId, user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Remove failed');
        return;
      }
      fetchCompanies();
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
    createMsg.textContent = `User created (ID ${data.id || ''}). Refreshing list...`;
    createMsg.className = 'text-sm text-green-700';
    createForm.reset();
    setTimeout(fetchUsers, 300);
    setTimeout(fetchAudit, 300);
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
  fetchCompanies();
  fetchJobs();
  fetchAudit();
  fetchTemplates();
}
