import { CONFIG } from '../config.js';

function toText(val) {
  return (val ?? '').toString();
}

function safeHost(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.hostname;
  } catch {
    return '';
  }
}

function formatWhen(dtStr) {
  if (!dtStr) return '';
  const d = new Date(dtStr.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return dtStr;
  return d.toLocaleString();
}

export async function renderAnalytics(container) {
  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 class="text-2xl font-bold">Analytics</h1>
          <p class="text-xs text-gray-500 mt-1">
            Minimal, first‑party only. No third‑party trackers. Includes path, referrer, and timestamp.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a href="/#admin" class="text-sm text-indigo-600 hover:underline">Back to admin</a>
          <button id="refreshAnalytics" class="text-sm text-indigo-600 hover:underline">Refresh</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <input id="filterText" class="w-full p-2 border rounded" placeholder="Filter by path/referrer..." />
        <select id="eventFilter" class="w-full p-2 border rounded">
          <option value="all" selected>All events</option>
          <option value="pageview">Page views</option>
        </select>
        <select id="limitSelect" class="w-full p-2 border rounded">
          <option value="200" selected>Last 200</option>
          <option value="500">Last 500</option>
          <option value="1000">Last 1000</option>
        </select>
      </div>

      <div id="analyticsMsg" class="text-sm mb-2"></div>
      <div id="analyticsSummary" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"></div>
      <div id="analyticsEvents" class="space-y-2 text-sm"></div>
    </div>
  `;

  const msgEl = container.querySelector('#analyticsMsg');
  const summaryEl = container.querySelector('#analyticsSummary');
  const eventsEl = container.querySelector('#analyticsEvents');
  const refreshBtn = container.querySelector('#refreshAnalytics');
  const filterText = container.querySelector('#filterText');
  const eventFilter = container.querySelector('#eventFilter');
  const limitSelect = container.querySelector('#limitSelect');

  let rows = [];

  const render = () => {
    const q = toText(filterText.value).trim().toLowerCase();
    const ev = eventFilter.value || 'all';
    const filtered = rows.filter((r) => {
      const hay = `${toText(r.path)} ${toText(r.referrer)}`.toLowerCase();
      const okQ = !q || hay.includes(q);
      const okEv = ev === 'all' || toText(r.event).toLowerCase() === ev;
      return okQ && okEv;
    });

    const byPath = new Map();
    const byRef = new Map();
    let loggedInCount = 0;

    for (const r of filtered) {
      const p = toText(r.path) || '(unknown)';
      byPath.set(p, (byPath.get(p) || 0) + 1);

      const rawRef = toText(r.referrer || '');
      const host = rawRef ? (safeHost(rawRef) || rawRef) : 'Direct';
      byRef.set(host, (byRef.get(host) || 0) + 1);

      if (r.user_id) loggedInCount += 1;
    }

    const topPaths = [...byPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topRefs = [...byRef.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    summaryEl.innerHTML = `
      <div class="border rounded-xl bg-white shadow-sm p-4">
        <div class="text-xs uppercase tracking-widest text-slate-500 mb-2">Overview</div>
        <div class="text-sm text-slate-700">Events loaded: <span class="font-semibold">${rows.length}</span></div>
        <div class="text-sm text-slate-700">Events shown: <span class="font-semibold">${filtered.length}</span></div>
        <div class="text-sm text-slate-700">Logged-in events: <span class="font-semibold">${loggedInCount}</span></div>
        <div class="text-xs text-slate-500 mt-2">Source: self-hosted analytics</div>
      </div>

      <div class="border rounded-xl bg-white shadow-sm p-4">
        <div class="text-xs uppercase tracking-widest text-slate-500 mb-2">Top Pages</div>
        <div class="space-y-1">
          ${
            topPaths.length
              ? topPaths.map(([p, c]) => `
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-slate-700 truncate">${p}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">${c}</span>
                  </div>
                `).join('')
              : `<div class="text-sm text-slate-500">No data yet.</div>`
          }
        </div>
        <div class="text-xs uppercase tracking-widest text-slate-500 mt-4 mb-2">Top Referrers</div>
        <div class="space-y-1">
          ${
            topRefs.length
              ? topRefs.map(([h, c]) => `
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-slate-700 truncate">${h}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">${c}</span>
                  </div>
                `).join('')
              : `<div class="text-sm text-slate-500">No data yet.</div>`
          }
        </div>
      </div>
    `;

    eventsEl.innerHTML = filtered.length
      ? filtered.map((r) => `
          <div class="border rounded-xl bg-white shadow-sm p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-slate-900">${toText(r.event) || 'event'}</div>
                <div class="text-sm text-slate-700">${toText(r.path)}</div>
                <div class="text-xs text-slate-500 mt-1">Referrer: ${toText(r.referrer) || 'Direct'}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-slate-500">${formatWhen(toText(r.created_at))}</div>
                ${r.user_id ? `<div class="text-xs text-slate-500">User: ${toText(r.user_id)}</div>` : ''}
              </div>
            </div>
          </div>
        `).join('')
      : `<div class="text-sm text-slate-500">No analytics yet.</div>`;
  };

  const load = async () => {
    msgEl.textContent = '';
    eventsEl.innerHTML = `<div class="text-sm text-gray-500">Loading analytics...</div>`;
    summaryEl.innerHTML = '';
    try {
      const limit = Number(limitSelect.value || 200) || 200;
      const res = await fetch(`/api/admin/analytics?limit=${encodeURIComponent(String(limit))}&_=${Date.now()}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        msgEl.className = 'text-sm text-rose-600 mb-2';
        msgEl.textContent = data?.error || data?.message || 'Failed to load analytics.';
        rows = [];
        render();
        return;
      }
      rows = Array.isArray(data) ? data : [];
      render();
    } catch (err) {
      msgEl.className = 'text-sm text-rose-600 mb-2';
      msgEl.textContent = 'Unable to load analytics.';
      rows = [];
      render();
    }
  };

  refreshBtn?.addEventListener('click', load);
  filterText?.addEventListener('input', render);
  eventFilter?.addEventListener('change', render);
  limitSelect?.addEventListener('change', load);

  // Small hint for admins in beta/dev environments
  if (CONFIG.SITE_STAGE_LABEL) {
    msgEl.className = 'text-xs text-slate-500 mb-2';
    msgEl.textContent = `Stage: ${CONFIG.SITE_STAGE_LABEL}`;
  }

  await load();
}

