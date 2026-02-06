export function renderMyApplications(container) {
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4">My Applications</h1>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input
          type="text"
          id="searchInput"
          class="w-full p-2 border rounded"
          placeholder="Search jobs or company..."
        />
        <select id="statusFilter" class="w-full p-2 border rounded">
          <option value="all" selected>All statuses</option>
          <option value="new">New</option>
          <option value="reviewing">Reviewing</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
        <select id="sortSelect" class="w-full p-2 border rounded">
          <option value="newest" selected>Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="company">Company A–Z</option>
          <option value="title">Job Title A–Z</option>
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
    if (t === 'hourly') return 'per hour';
    if (t === 'salary') return 'per year';
    if (t === 'contract') return 'contract';
    if (t === 'commission') return 'commission';
    return val || '';
  };

  const statusSteps = ['new', 'reviewing', 'shortlisted', 'rejected'];
  const getStatusIndex = (status) => {
    const idx = statusSteps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const renderTimeline = (status) => {
    const current = getStatusIndex(status);
    return `
      <div class="flex items-center gap-2 mt-3 text-xs">
        ${statusSteps.map((step, i) => `
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full ${i <= current ? 'bg-emerald-500' : 'bg-slate-300'}"></span>
            <span class="${i <= current ? 'text-slate-700' : 'text-slate-400'}">${step}</span>
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
          const statusLabel = (app.status || 'new').toString();
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
              ${renderTimeline(statusLabel)}
              <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <a href="/#list-detail?id=${app.job_id}" class="text-indigo-600 hover:underline">View job</a>
                ${app.resume ? `<a href="${app.resume}" target="_blank" rel="noopener" class="text-indigo-600 hover:underline">Resume</a>` : ''}
                ${app.cover_letter ? `<a href="${app.cover_letter}" target="_blank" rel="noopener" class="text-indigo-600 hover:underline">Cover</a>` : ''}
                ${statusLabel !== 'withdrawn' && statusLabel !== 'rejected' ? `
                  <button data-action="withdraw" data-job-id="${app.job_id}" class="text-red-600 hover:underline">Withdraw</button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')
      : `<p class="text-gray-500">No applications found.</p>`;
  };

  const applyFilters = () => {
    const query = normalize(searchInput.value);
    const status = statusFilter.value || 'all';
    const sortMode = sortSelect.value || 'newest';

    const filtered = applications.filter(app => {
      const haystack = normalize(`${app.job_title} ${app.company} ${app.location}`);
      const matchesQuery = !query || haystack.includes(query);
      const matchesStatus = status === 'all' || normalize(app.status) === status;
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
      const res = await fetch('/wp-json/customapi/v1/withdraw-application', {
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

  fetch('/wp-json/customapi/v1/user-applications', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      applications = Array.isArray(data) ? data : [];
      applyFilters();
    })
    .catch(err => {
      appsContainer.innerHTML = `<p class="text-red-600">Failed to load applications.</p>`;
      console.error(err);
    });
}
