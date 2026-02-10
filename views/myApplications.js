import { CONFIG } from '../config.js';

export function renderMyApplications(container) {
  try {
    container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4">${CONFIG.JOB_COPY?.MY_APPLICATIONS_TITLE || 'My Applications'}</h1>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          type="text"
          id="searchInput"
          class="w-full p-2 border rounded"
          placeholder="${CONFIG.JOB_COPY?.APPLICATION_SEARCH_PLACEHOLDER || 'Search jobs or company...'}"
        />
        <select id="statusFilter" class="w-full p-2 border rounded">
          <option value="all" selected>${CONFIG.JOB_COPY?.STATUS_ALL || 'All statuses'}</option>
          <option value="submitted">${CONFIG.JOB_COPY?.STATUS_SUBMITTED || 'Submitted'}</option>
          <option value="new">${CONFIG.JOB_COPY?.STATUS_NEW || 'New'}</option>
          <option value="reviewing">${CONFIG.JOB_COPY?.STATUS_REVIEWING || 'Received'}</option>
          <option value="shortlisted">${CONFIG.JOB_COPY?.STATUS_SHORTLISTED || 'Reviewing'}</option>
          <option value="rejected">${CONFIG.JOB_COPY?.STATUS_REJECTED || 'Rejected'}</option>
          <option value="withdrawn">${CONFIG.JOB_COPY?.STATUS_WITHDRAWN || 'Withdrawn'}</option>
        </select>
        <select id="sortSelect" class="w-full p-2 border rounded">
          <option value="newest" selected>${CONFIG.JOB_COPY?.SORT_NEWEST || 'Newest first'}</option>
          <option value="oldest">${CONFIG.JOB_COPY?.SORT_OLDEST || 'Oldest first'}</option>
          <option value="company">${CONFIG.JOB_COPY?.SORT_COMPANY || 'Company A–Z'}</option>
          <option value="title">${CONFIG.JOB_COPY?.SORT_TITLE_LABEL || 'Job Title A–Z'}</option>
        </select>
      </div>

      <div id="appsContainer" class="space-y-4"></div>
    </div>
  `;

  const appsContainer = container.querySelector('#appsContainer');
  const searchInput = container.querySelector('#searchInput');
  const statusFilter = container.querySelector('#statusFilter');
  const sortSelect = container.querySelector('#sortSelect');

  let applications = [];

  const normalize = (val) => (val || '').toString().toLowerCase();

  const formatRateType = (val) => {
    const t = (val || '').toString().toLowerCase();
    if (t === 'undisclosed') return 'Undisclosed';
    if (t === 'hourly') return 'per hour';
    if (t === 'salary') return 'per year';
    if (t === 'contract') return 'contract';
    if (t === 'commission') return 'commission';
    return val || '';
  };

  const statusSteps = ['submitted', 'new', 'reviewing', 'shortlisted', 'rejected'];
  const statusLabelMap = {
    submitted: 'Submitted',
    new: 'New',
    reviewing: 'Received',
    shortlisted: 'Reviewing',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };
  const getStatusIndex = (status) => {
    const norm = normalize(status);
    const mapped = norm === 'submitted' ? 'submitted' : norm;
    const idx = statusSteps.indexOf(mapped);
    return idx === -1 ? 0 : idx;
  };

  const renderTimeline = (status) => {
    const current = getStatusIndex(status);
    return `
      <div class="flex items-center gap-2 mt-3 text-xs">
        ${statusSteps.map((step, i) => `
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full ${i <= current ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
            <span class="${i <= current ? 'text-slate-700' : 'text-slate-400'}">${statusLabelMap[step] || step}</span>
            ${i < statusSteps.length - 1 ? `<span class="h-px w-6 ${i < current ? 'bg-emerald-400' : 'bg-slate-300'}"></span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  };

  const renderApps = (list) => {
    appsContainer.innerHTML = list.length
      ? list.map(app => {
          const appliedDate = app.applied_time ? new Date(app.applied_time * 1000) : null;
          const appliedLabel = appliedDate && !isNaN(appliedDate) ? appliedDate.toLocaleDateString() : 'Unknown date';
          const statusRaw = (app.status || 'submitted').toString();
          const statusNormalized = normalize(statusRaw) || 'submitted';
          const statusLabel = statusLabelMap[statusNormalized] || statusRaw;
          const rateTypeLabel = formatRateType(app.rate_type || '');
          const rate = app.rate_min || app.rate_max || rateTypeLabel
            ? `${app.rate_min || ''}${app.rate_max ? `–${app.rate_max}` : ''} ${rateTypeLabel}`.trim()
            : '';
          return `
            <div class="border rounded-xl p-5 bg-white shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">${app.job_title || 'Job'}</h2>
                  <div class="text-sm text-slate-600">${app.company || 'Employer'}${app.location ? ` • ${app.location}` : ''}</div>
                  ${rate ? `<div class="text-sm text-slate-600 mt-1">Rate: ${rate}</div>` : ''}
                  <div class="text-xs text-slate-500 mt-1">Applied: ${appliedLabel}</div>
                </div>
                <span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">${statusLabel}</span>
              </div>
              ${renderTimeline(statusNormalized)}
              <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <a href="/#list-detail?id=${app.job_id}" class="text-indigo-600 hover:underline">${CONFIG.JOB_COPY?.VIEW_JOB || 'View job'}</a>
                ${app.resume ? `<a href="${app.resume}" target="_blank" rel="noopener" class="text-indigo-600 hover:underline">Resume</a>` : ''}
                ${app.cover_letter ? `<a href="${app.cover_letter}" target="_blank" rel="noopener" class="text-indigo-600 hover:underline">Cover</a>` : ''}
                ${statusNormalized !== 'withdrawn' && statusNormalized !== 'rejected' ? `
                  <button data-action="withdraw" data-job-id="${app.job_id}" class="text-xs px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:border-red-400 transition">${CONFIG.JOB_COPY?.WITHDRAW_ACTION || 'Withdraw'}</button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')
      : `<p class="text-gray-500">${CONFIG.JOB_COPY?.APPLICATIONS_EMPTY || 'No applications found.'}</p>`;
  };

  const renderBasic = (list) => {
    appsContainer.innerHTML = list.length
      ? list.map(app => `
          <div class="border rounded-xl p-4 bg-white shadow-sm">
            <div class="font-semibold text-slate-900">${app.job_title || 'Job'}</div>
            <div class="text-xs text-slate-600">${[app.company, app.location].filter(Boolean).join(' • ')}</div>
            <div class="text-xs text-slate-500 mt-1">Status: ${statusLabelMap[normalize(app.status) || 'submitted'] || app.status || 'submitted'}</div>
            <a href="/#list-detail?id=${app.job_id}" class="text-sm text-indigo-600 hover:underline mt-2 inline-block">View job</a>
          </div>
        `).join('')
      : `<p class="text-gray-500">${CONFIG.JOB_COPY?.APPLICATIONS_EMPTY || 'No applications found.'}</p>`;
  };

  const applyFilters = () => {
    const query = normalize(searchInput.value);
    const status = statusFilter.value || 'all';
    const sortMode = sortSelect.value || 'newest';

    const filtered = applications.filter(app => {
      const haystack = normalize(`${app.job_title} ${app.company} ${app.location}`);
      const matchesQuery = !query || haystack.includes(query);
      const appStatus = normalize(app.status) || 'submitted';
      const matchesStatus = status === 'all' || appStatus === status;
      return matchesQuery && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      const timeA = a.applied_time || 0;
      const timeB = b.applied_time || 0;
      if (sortMode === 'oldest') return timeA - timeB;
      if (sortMode === 'company') return normalize(a.company).localeCompare(normalize(b.company));
      if (sortMode === 'title') return normalize(a.job_title).localeCompare(normalize(b.job_title));
      return timeB - timeA;
    });

    renderApps(sorted);
  };

  [searchInput].forEach(el => el.addEventListener('input', applyFilters));
  statusFilter.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applyFilters);

  appsContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="withdraw"]');
    if (!btn) return;
    const jobId = Number(btn.dataset.jobId || 0);
    if (!jobId) return;
    if (!confirm('Withdraw this application?')) return;
    try {
      const res = await fetch('/api/withdraw-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ job_id: jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Unable to withdraw.');
        return;
      }
      applications = applications.map(app =>
        app.job_id === jobId ? { ...app, status: 'withdrawn' } : app
      );
      applyFilters();
    } catch (err) {
      alert('Unable to withdraw.');
    }
  });

  appsContainer.innerHTML = '<p class="text-sm text-gray-500">Loading applications...</p>';
  fetch('/api/user-applications', { credentials: 'include' })
    .then(async res => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || 'Please log in to view your applications.';
        appsContainer.innerHTML = `
          <div class="text-sm text-rose-600">${msg}</div>
          <a href="/#login" class="text-sm text-indigo-600 hover:underline">Go to login</a>
        `;
        return null;
      }
      return data;
    })
    .then(data => {
      if (!data) return;
      if (!Array.isArray(data)) {
        appsContainer.innerHTML = `<p class="text-sm text-rose-600">Unexpected response from server.</p>`;
        console.warn('Unexpected applications payload', data);
        return;
      }
      applications = data;
      try {
        applyFilters();
      } catch (err) {
        console.error('Render applications failed', err);
        renderBasic(applications);
      }
    })
    .catch(err => {
      appsContainer.innerHTML = `<p class="text-red-600">Failed to load applications.</p>`;
      console.error(err);
    });
  } catch (err) {
    console.error('renderMyApplications failed', err);
    container.innerHTML = `<div class="max-w-3xl mx-auto px-4 py-8 text-sm text-rose-600">Unable to render applications.</div>`;
  }
}
