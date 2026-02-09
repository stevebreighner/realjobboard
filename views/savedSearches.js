import { CONFIG } from '../config.js';

const normalize = (val) => (val || '').toString().toLowerCase();

function buildHaystack(job) {
  return normalize([
    job.title,
    job.description,
    job.meta?.company,
    job.meta?.field,
    job.meta?.location,
    job.meta?.city,
    job.meta?.state,
    job.meta?.zip,
    job.meta?.employment_type,
  ].filter(Boolean).join(' '));
}

function splitTerms(query) {
  return query
    .split(',')
    .map(q => q.trim())
    .filter(Boolean)
    .flatMap(q => q.split(/\s+/).filter(Boolean));
}

function formatLabel(label) {
  const raw = (label || '').toString().trim();
  if (!raw) return 'Saved search';
  return raw.replace(/^alert\s*[:\-]\s*/i, '').trim() || 'Saved search';
}

function matchesCriteria(job, criteria = {}) {
  const haystack = buildHaystack(job);
  const query = normalize(criteria.query || criteria.label || criteria.search || criteria.term || criteria.keywords || '');
  if (query) {
    const terms = splitTerms(query);
    const termMatches = (term) => {
      if (!term) return true;
      if (haystack.includes(term)) return true;
      if (term.endsWith('es') && haystack.includes(term.slice(0, -2))) return true;
      if (term.endsWith('s') && haystack.includes(term.slice(0, -1))) return true;
      if (!term.endsWith('s') && haystack.includes(`${term}s`)) return true;
      return false;
    };
    if (terms.length && !terms.every(termMatches)) return false;
  }
  if (criteria.field && normalize(job.meta?.field) !== normalize(criteria.field)) return false;
  if (criteria.city && !normalize(job.meta?.city).includes(normalize(criteria.city))) return false;
  if (criteria.state && normalize(job.meta?.state) !== normalize(criteria.state)) return false;
  if (criteria.zip && normalize(job.meta?.zip) !== normalize(criteria.zip)) return false;
  if (criteria.employment_type && normalize(job.meta?.employment_type) !== normalize(criteria.employment_type)) return false;
  if (criteria.rate_type && normalize(job.meta?.rate_type) !== normalize(criteria.rate_type)) return false;
  return true;
}

export async function renderSavedSearches(container) {
  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4">${CONFIG.JOB_COPY?.SAVED_SEARCHES_TITLE || 'Saved Searches'}</h1>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-1">
          <div class="rounded-xl border bg-white p-4 shadow-sm">
            <div class="font-semibold mb-2">${CONFIG.JOB_COPY?.SAVED_SEARCHES_LIST || 'Your searches'}</div>
            <div id="savedSearchList" class="space-y-3 text-sm text-gray-600">Loading…</div>
          </div>
        </div>
        <div class="lg:col-span-2">
          <div class="rounded-xl border bg-white p-4 shadow-sm">
            <div class="font-semibold mb-2">${CONFIG.JOB_COPY?.SAVED_SEARCH_RESULTS || 'Results'}</div>
            <div id="savedSearchResults" class="space-y-4 text-sm text-gray-600">Select a saved search to view results.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const listEl = container.querySelector('#savedSearchList');
  const resultsEl = container.querySelector('#savedSearchResults');

  let alerts = [];
  let jobs = [];
  let currentPage = 1;
  const pageSize = 10;
  let lastMatched = [];

  async function loadData() {
    const [alertsRes, jobsRes] = await Promise.all([
      fetch('/api/job-alerts', { credentials: 'include' }),
      fetch('/api/get-list'),
    ]);
    const alertData = await alertsRes.json().catch(() => []);
    const jobData = await jobsRes.json().catch(() => []);
    alerts = Array.isArray(alertData) ? alertData : [];
    jobs = Array.isArray(jobData) ? jobData : [];
  }

  function renderResults(alert) {
    if (!alert) {
      resultsEl.innerHTML = '<div class="text-sm text-gray-500">Select a saved search to view results.</div>';
      return;
    }
    const matched = jobs.filter(job => matchesCriteria(job, alert.criteria || {}));
    lastMatched = matched;
    if (!matched.length) {
      resultsEl.innerHTML = `
        <div class="text-sm text-slate-700 font-medium">${formatLabel(alert.label)}</div>
        <div class="text-xs text-slate-500 mb-3">${alert.criteria?.query ? alert.criteria.query : 'Saved search'}</div>
        <div class="text-sm text-gray-500">No matches yet for this search.</div>
      `;
      return;
    }
    const totalPages = Math.max(1, Math.ceil(matched.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const pageItems = matched.slice(start, start + pageSize);
    const pageLabel = `Page ${currentPage} of ${totalPages}`;
    resultsEl.innerHTML = `
      <div class="text-sm text-slate-700 font-medium">${formatLabel(alert.label)}</div>
      <div class="text-xs text-slate-500 mb-3">${alert.criteria?.query ? alert.criteria.query : 'Saved search'}</div>
      <div class="flex items-center justify-between text-xs text-slate-500 mb-3">
        <span>${pageLabel}</span>
        <div class="flex items-center gap-2">
          <button data-page="prev" class="px-2 py-1 border rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">Prev</button>
          <button data-page="next" class="px-2 py-1 border rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">Next</button>
        </div>
      </div>
    ` + pageItems.map(job => `
      <div class="border rounded-lg p-4 bg-white shadow-sm">
        <div class="font-semibold text-gray-900">${job.title || 'Job'}</div>
        <div class="text-xs text-gray-500 mt-1">${[job.meta?.company, job.meta?.location].filter(Boolean).join(' • ')}</div>
        <a class="mt-2 inline-flex items-center px-3 py-1.5 border rounded text-xs hover:border-slate-400 transition" href="/#list-detail?id=${job.id}">View</a>
      </div>
    `).join('');
  }

  function renderList() {
    if (!alerts.length) {
      listEl.innerHTML = '<div class="text-sm text-gray-500">No saved searches yet.</div>';
      resultsEl.innerHTML = '<div class="text-sm text-gray-500">Save a search from the job list to see results.</div>';
      return;
    }
    listEl.innerHTML = alerts.map(alert => `
      <div class="border rounded-lg p-2 flex items-center gap-2 bg-white">
        <button class="text-left px-3 py-2 rounded border border-slate-200 hover:border-slate-400 transition cursor-pointer" data-alert-id="${alert.id}" type="button">
          <div class="font-medium text-gray-900">${formatLabel(alert.label)}</div>
          <div class="text-xs text-gray-500">${alert.criteria?.query ? `Query: ${alert.criteria.query}` : 'Saved search'}</div>
        </button>
        <button class="px-3 py-1.5 rounded border border-rose-200 text-rose-600 text-xs hover:border-rose-400 transition shrink-0" data-delete-id="${alert.id}">Delete</button>
      </div>
    `).join('');

  }

  listEl.addEventListener('click', async (e) => {
    const viewBtn = e.target.closest('button[data-alert-id]');
    if (viewBtn) {
      const idStr = String(viewBtn.dataset.alertId || '');
      const alert = alerts.find(a => String(a.id) === idStr);
      if (!alert) {
        resultsEl.innerHTML = '<div class="text-sm text-gray-500">No saved search found.</div>';
        return;
      }
      currentPage = 1;
      listEl.querySelectorAll('button[data-alert-id]').forEach(b => b.classList.remove('ring-2', 'ring-indigo-200'));
      viewBtn.classList.add('ring-2', 'ring-indigo-200');
      resultsEl.innerHTML = '<div class="text-sm text-gray-500">Loading results...</div>';
      renderResults(alert);
      return;
    }
    const delBtn = e.target.closest('button[data-delete-id]');
    if (delBtn) {
      const idStr = String(delBtn.dataset.deleteId || '');
      const res = await fetch('/api/job-alerts-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ alert_id: idStr }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.alerts)) {
        alerts = data.alerts;
        renderList();
        renderResults(alerts[0]);
      }
    }
  });

  resultsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (!btn || !lastMatched.length) return;
    const totalPages = Math.max(1, Math.ceil(lastMatched.length / pageSize));
    if (btn.dataset.page === 'prev' && currentPage > 1) currentPage -= 1;
    if (btn.dataset.page === 'next' && currentPage < totalPages) currentPage += 1;
    const activeAlert = alerts.find(a => {
      const activeBtn = listEl.querySelector('button[data-alert-id].ring-2');
      if (!activeBtn) return false;
      return String(a.id) === String(activeBtn.dataset.alertId);
    }) || alerts[0];
    if (activeAlert) renderResults(activeAlert);
  });

  try {
    if (window.__dev_flags?.dev_mode) {
      console.log('[saved-searches] loading data');
    }
    await loadData();
    renderList();
    renderResults(alerts[0]);
  } catch (err) {
    listEl.innerHTML = '<div class="text-sm text-rose-600">Failed to load saved searches.</div>';
    resultsEl.innerHTML = '<div class="text-sm text-rose-600">Failed to load results.</div>';
  }
}
