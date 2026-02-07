import { getUserProfileCached, getUserProfileCachedAny } from '../utils/session.js';
import { CONFIG } from '../config.js';
import { escapeHtml, safeUrl } from '../utils/sanitize.js';

export function renderList(container) {
 

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
        <div>
          <h1 class="text-3xl font-bold">${CONFIG.JOB_COPY?.LIST_TITLE || 'Open Roles'}</h1>
          <p class="text-sm text-gray-600">${CONFIG.JOB_COPY?.LIST_SUBTITLE || 'Curated listings with privacy-first applications.'}</p>
        </div>
        <div class="text-xs text-gray-500">Sorted by featured + most recent</div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input
          type="text"
          id="filterField"
          class="w-full p-2 border rounded"
          placeholder="Filter by field (e.g. Tech)"
        />
        <input
          type="text"
          id="filterCity"
          class="w-full p-2 border rounded"
          placeholder="Filter by city"
        />
        <input
          type="text"
          id="filterState"
          class="w-full p-2 border rounded"
          placeholder="Filter by state"
        />
        <input
          type="text"
          id="filterZip"
          class="w-full p-2 border rounded"
          placeholder="Filter by ZIP"
        />
        <input
          type="text"
          id="filterRateType"
          class="w-full p-2 border rounded"
          placeholder="Filter by rate type"
        />
        <input
          type="text"
          id="filterRateMin"
          class="w-full p-2 border rounded"
          placeholder="Min rate"
        />
        <input
          type="text"
          id="filterRateMax"
          class="w-full p-2 border rounded"
          placeholder="Max rate"
        />
      </div>

      <div class="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          id="searchInput"
          class="w-full p-2 border rounded"
          placeholder="Search (comma-separated: react, node, aws)"
        />
        <select id="sortSelect" class="w-full md:w-56 p-2 border rounded">
          <option value="featured" selected>Featured + Recent</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="payHigh">Highest Pay</option>
          <option value="payLow">Lowest Pay</option>
          <option value="company">Company A–Z</option>
          <option value="title">${CONFIG.JOB_COPY?.SORT_TITLE_LABEL || 'Job Title A–Z'}</option>
        </select>
        <select id="distanceSelect" class="w-full md:w-52 p-2 border rounded">
          <option value="">Distance: Any</option>
          <option value="5">Within 5 miles</option>
          <option value="10">Within 10 miles</option>
          <option value="25">Within 25 miles</option>
          <option value="50">Within 50 miles</option>
          <option value="100">Within 100 miles</option>
        </select>
      </div>
      <p class="text-xs text-gray-500 mb-4">
        Tip: use comma-separated search terms to rank results by match count (e.g. "react, node, aws").
      </p>
      <p id="distanceHint" class="text-xs text-gray-500 mb-4 hidden">
        Add your ZIP in Profile to enable distance filtering.
      </p>

      <div class="mb-6 border rounded-2xl p-4 bg-white shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-lg font-semibold">${CONFIG.JOB_COPY?.ALERTS_TITLE || 'Job Alerts'}</h2>
            <p class="text-xs text-gray-500">Save this search to get notified about new matches.</p>
          </div>
          <button id="saveAlertBtn" class="text-sm text-indigo-600 hover:underline">Save this search</button>
        </div>
        <div id="alertsContainer" class="space-y-2"></div>
      </div>

      <div id="itemsContainer" class="grid gap-6 md:grid-cols-2"></div>
    </div>
  `;

  const itemsContainer = container.querySelector('#itemsContainer');
  const searchInput = container.querySelector('#searchInput');
  const filterField = container.querySelector('#filterField');
  const filterCity = container.querySelector('#filterCity');
  const filterState = container.querySelector('#filterState');
  const filterZip = container.querySelector('#filterZip');
  const filterRateType = container.querySelector('#filterRateType');
  const filterRateMin = container.querySelector('#filterRateMin');
  const filterRateMax = container.querySelector('#filterRateMax');
  const sortSelect = container.querySelector('#sortSelect');
  const distanceSelect = container.querySelector('#distanceSelect');
  const distanceHint = container.querySelector('#distanceHint');
  const saveAlertBtn = container.querySelector('#saveAlertBtn');
  const alertsContainer = container.querySelector('#alertsContainer');
  const savedJobIds = new Set();
  let alerts = [];

  const normalize = (val) => (val || '').toString().toLowerCase();
  const getMetaValue = (item, key) =>
    (item?.meta && item.meta[key] != null ? item.meta[key] : item?.[key]) ?? '';
  const formatRateType = (val) => {
    const t = (val || '').toString().toLowerCase();
    if (t === 'hourly') return 'per hour';
    if (t === 'salary') return 'per year';
    if (t === 'contract') return 'contract';
    if (t === 'commission') return 'commission';
    return val || '';
  };
  const isFeatured = (item) => {
    const raw = getMetaValue(item, 'job_featured');
    return ['1', 'true', 'yes'].includes(String(raw).toLowerCase());
  };
  const buildLocation = (item) => {
    const street1 = getMetaValue(item, 'street1');
    const street2 = getMetaValue(item, 'street2');
    const city = getMetaValue(item, 'city');
    const state = getMetaValue(item, 'state');
    const zip = getMetaValue(item, 'zip');
    const country = getMetaValue(item, 'country');
    const addressLine = [street1, street2].filter(Boolean).join(' ');
    const cityState = [city, state].filter(Boolean).join(', ');
    const locationLine = [cityState, zip].filter(Boolean).join(' ');
    return [addressLine, locationLine, country].filter(Boolean).join(' • ');
  };
  const getSearchText = (item) => {
    const title = item.title || item.name || '';
    const summary = item.summary || item.description || '';
    const field = getMetaValue(item, 'field');
    const company = getMetaValue(item, 'company');
    const location = buildLocation(item);
    return normalize([title, summary, field, company, location].join(' '));
  };

  let items = [];
  let userZip = '';
  let userCoords = null;

  const isNewListing = (item) => {
    const ts = new Date(item.date || 0).getTime();
    if (!ts) return false;
    const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return days <= 7;
  };

  const zipCacheKey = (zip) => `zip_coords_${zip}`;
  const getZipCoords = async (zip) => {
    const key = zipCacheKey(zip);
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.lat && parsed.lng) return parsed;
      }
    } catch (err) {}
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) return null;
      const data = await res.json();
      const place = data?.places?.[0];
      if (!place) return null;
      const coords = { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) };
      localStorage.setItem(key, JSON.stringify(coords));
      return coords;
    } catch (err) {
      return null;
    }
  };

  const toRadians = (deg) => (deg * Math.PI) / 180;
  const distanceMiles = (a, b) => {
    if (!a || !b) return null;
    const R = 3958.8;
    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.asin(Math.sqrt(h));
    return R * c;
  };

  const applyFilters = async () => {
    const rawQuery = searchInput.value || '';
    const query = normalize(rawQuery);
    const terms = rawQuery
      .split(',')
      .map(t => normalize(t))
      .filter(t => t.length);
    const useMulti = terms.length >= 2;
    const fieldQuery = normalize(filterField.value);
    const cityQuery = normalize(filterCity.value);
    const stateQuery = normalize(filterState.value);
    const zipQuery = normalize(filterZip.value);
    const rateTypeQuery = normalize(filterRateType.value);
    const minRateQuery = normalize(filterRateMin.value);
    const maxRateQuery = normalize(filterRateMax.value);
    const radiusMiles = parseFloat(distanceSelect?.value || '');

    const filtered = items.filter(item => {
      const searchText = getSearchText(item);
      if (useMulti) {
        const matchCount = terms.reduce((acc, term) => acc + (searchText.includes(term) ? 1 : 0), 0);
        if (matchCount === 0) return false;
        item.__matchCount = matchCount;
      } else if (query && !searchText.includes(query)) {
        return false;
      }
      if (fieldQuery && !normalize(getMetaValue(item, 'field')).includes(fieldQuery)) return false;
      if (cityQuery && !normalize(getMetaValue(item, 'city')).includes(cityQuery)) return false;
      if (stateQuery && !normalize(getMetaValue(item, 'state')).includes(stateQuery)) return false;
      if (zipQuery && !normalize(getMetaValue(item, 'zip')).includes(zipQuery)) return false;
      if (rateTypeQuery && !normalize(getMetaValue(item, 'rate_type')).includes(rateTypeQuery)) return false;
      const rateMinVal = parseFloat(getMetaValue(item, 'rate_min') || '');
      const rateMaxVal = parseFloat(getMetaValue(item, 'rate_max') || '');
      const minQueryVal = parseFloat(minRateQuery || '');
      const maxQueryVal = parseFloat(maxRateQuery || '');
      if (!isNaN(minQueryVal) && !isNaN(rateMaxVal) && rateMaxVal < minQueryVal) return false;
      if (!isNaN(maxQueryVal) && !isNaN(rateMinVal) && rateMinVal > maxQueryVal) return false;
      return true;
    });

    if (!isNaN(radiusMiles) && radiusMiles > 0 && userZip && userCoords) {
      const distancePromises = filtered.map(async (item) => {
        const jobZip = (getMetaValue(item, 'zip') || '').toString().trim();
        if (!jobZip) {
          item.__distanceMiles = null;
          return item;
        }
        const jobCoords = await getZipCoords(jobZip);
        if (!jobCoords) {
          item.__distanceMiles = null;
          return item;
        }
        const miles = distanceMiles(userCoords, jobCoords);
        item.__distanceMiles = miles;
        return item;
      });
      const withDistances = await Promise.all(distancePromises);
      items = items.map(item => {
        const match = withDistances.find(x => (x.id || x._id || x.slug) === (item.id || item._id || item.slug));
        return match || item;
      });
    }

    const filteredWithRadius = (!isNaN(radiusMiles) && radiusMiles > 0 && userZip && userCoords)
      ? filtered.filter(item => typeof item.__distanceMiles === 'number' && item.__distanceMiles <= radiusMiles)
      : filtered;

    const sortMode = sortSelect?.value || 'featured';
    const sorted = [...filteredWithRadius].sort((a, b) => {
      if (useMulti) {
        const countDiff = (b.__matchCount || 0) - (a.__matchCount || 0);
        if (countDiff !== 0) return countDiff;
      }
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      const companyA = normalize(getMetaValue(a, 'company'));
      const companyB = normalize(getMetaValue(b, 'company'));
      const titleA = normalize(a.title || a.name || '');
      const titleB = normalize(b.title || b.name || '');
      const rateMinA = parseFloat(getMetaValue(a, 'rate_min') || '');
      const rateMinB = parseFloat(getMetaValue(b, 'rate_min') || '');
      const rateMaxA = parseFloat(getMetaValue(a, 'rate_max') || '');
      const rateMaxB = parseFloat(getMetaValue(b, 'rate_max') || '');
      const payA = !isNaN(rateMaxA) ? rateMaxA : (!isNaN(rateMinA) ? rateMinA : 0);
      const payB = !isNaN(rateMaxB) ? rateMaxB : (!isNaN(rateMinB) ? rateMinB : 0);

      if (sortMode === 'newest') return dateB - dateA;
      if (sortMode === 'oldest') return dateA - dateB;
      if (sortMode === 'payHigh') return payB - payA;
      if (sortMode === 'payLow') return payA - payB;
      if (sortMode === 'company') return companyA.localeCompare(companyB);
      if (sortMode === 'title') return titleA.localeCompare(titleB);

      const featureDiff = (isFeatured(b) ? 1 : 0) - (isFeatured(a) ? 1 : 0);
      if (featureDiff !== 0) return featureDiff;
      return dateB - dateA;
    });

    renderItems(sorted);
  };

  [searchInput, filterField, filterCity, filterState, filterZip, filterRateType, filterRateMin, filterRateMax].forEach(input => {
    input.addEventListener('input', () => applyFilters());
  });
  sortSelect?.addEventListener('change', () => applyFilters());
  distanceSelect?.addEventListener('change', () => applyFilters());

  const cached = window.__preload?.list;
  const cacheFresh = cached && (Date.now() - cached.ts) < 60000;
  if (cacheFresh) {
    items = cached.data;
    applyFilters();
  }

  fetch('/api/jobs')
    .then(res => res.json())
    .then(data => {
      window.__preload = window.__preload || {};
      window.__preload.list = { data, ts: Date.now() };
      items = data;
      applyFilters();
    })
    .catch(err => {
      if (!cacheFresh) {
        itemsContainer.innerHTML = `<p class="text-red-600">Failed to load data.</p>`;
      }
      console.error(err);
    });

    async function loadUserZip() {
      const cached = getUserProfileCachedAny({ light: true });
      if (cached?.zip) {
        userZip = String(cached.zip || '').trim();
      } else {
        const profile = await getUserProfileCached({ light: true });
        userZip = String(profile?.zip || '').trim();
      }
      if (userZip) {
        userCoords = await getZipCoords(userZip);
        if (distanceSelect) distanceSelect.disabled = false;
        if (distanceHint) distanceHint.classList.add('hidden');
      } else {
        if (distanceSelect) distanceSelect.disabled = true;
        if (distanceHint) distanceHint.classList.remove('hidden');
      }
      applyFilters();
    }

    loadUserZip();

    async function loadSavedJobs() {
      try {
        const res = await fetch('/wp-json/customapi/v1/saved-jobs', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          data.forEach(id => savedJobIds.add(Number(id)));
          applyFilters();
        }
      } catch (err) {}
    }

    async function loadAlerts() {
      try {
        const res = await fetch('/wp-json/customapi/v1/job-alerts', { credentials: 'include' });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          alerts = data;
          renderAlerts();
        }
      } catch (err) {}
    }

    function renderAlerts() {
      const host = container.querySelector('#alertsContainer');
      if (!host) return;
      host.innerHTML = alerts.length ? alerts.map(a => `
        <div class="flex items-center justify-between border rounded-lg px-3 py-2 text-sm bg-white">
          <div>
            <div class="font-medium">${a.label || 'Alert'}</div>
            <div class="text-xs text-gray-500">${a.criteria?.query ? `Query: ${a.criteria.query}` : 'Saved search'}</div>
          </div>
          <button class="text-red-600 hover:underline text-xs" data-alert-id="${a.id}">Delete</button>
        </div>
      `).join('') : '<div class="text-sm text-gray-500">No alerts yet.</div>';
    }

    async function handlePendingAlertSave() {
      const pendingRaw = sessionStorage.getItem('pendingJobAlert');
      if (!pendingRaw) return;
      const session = await getSessionCached({ maxAgeMs: 0, force: true });
      if (!session) return;
      let pending = null;
      try {
        pending = JSON.parse(pendingRaw);
      } catch (err) {
        sessionStorage.removeItem('pendingJobAlert');
        return;
      }
      try {
        const res = await fetch('/wp-json/customapi/v1/job-alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ label: pending.label, criteria: pending.criteria }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.alerts)) {
          alerts = data.alerts;
          renderAlerts();
        }
      } catch (err) {
        // ignore
      } finally {
        sessionStorage.removeItem('pendingJobAlert');
      }
    }

    loadSavedJobs();
    loadAlerts().finally(handlePendingAlertSave);

    saveAlertBtn?.addEventListener('click', async () => {
      const criteria = {
        query: searchInput.value || '',
        field: filterField.value || '',
        city: filterCity.value || '',
        state: filterState.value || '',
        zip: filterZip.value || '',
        rate_type: filterRateType.value || '',
        rate_min: filterRateMin.value || '',
        rate_max: filterRateMax.value || '',
        radius: distanceSelect?.value || '',
      };
      const label = criteria.query ? `Alert: ${criteria.query}` : 'Alert: Current filters';
      const session = await getSessionCached({ maxAgeMs: 0, force: true });
      if (!session) {
        sessionStorage.setItem('pendingJobAlert', JSON.stringify({ label, criteria }));
        sessionStorage.setItem('postLoginRedirect', '#list');
        window.location.hash = '#login';
        return;
      }
      try {
        const res = await fetch('/wp-json/customapi/v1/job-alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ label, criteria }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.alerts)) {
          alerts = data.alerts;
          renderAlerts();
        }
      } catch (err) {}
    });

    alertsContainer?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-alert-id]');
      if (!btn) return;
      const alertId = btn.getAttribute('data-alert-id');
      try {
        const res = await fetch('/wp-json/customapi/v1/job-alerts-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ alert_id: alertId }),
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.alerts)) {
          alerts = data.alerts;
          renderAlerts();
        }
      } catch (err) {}
    });

    itemsContainer?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-save-id]');
      if (!btn) return;
      const jobId = Number(btn.getAttribute('data-save-id'));
      if (!jobId) return;
      try {
        const res = await fetch('/wp-json/customapi/v1/saved-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ job_id: jobId }),
        });
        const data = await res.json();
        if (res.ok) {
          if (data.saved) savedJobIds.add(jobId);
          else savedJobIds.delete(jobId);
          applyFilters();
        }
      } catch (err) {}
    });

    function renderItems(items) {
      itemsContainer.innerHTML = items.length
        ? items
            .map(item => {
              const id = item.id || item._id || item.slug;
              const field = getMetaValue(item, 'field');
              const rawCompany = getMetaValue(item, 'company');
              const company = rawCompany && rawCompany.includes('@') ? '' : rawCompany;
              const companySlug = getMetaValue(item, 'company_slug');
              const companySite = getMetaValue(item, 'company_site');
              const rateType = formatRateType(getMetaValue(item, 'rate_type'));
              const rateMin = getMetaValue(item, 'rate_min');
              const rateMax = getMetaValue(item, 'rate_max');
              const location = buildLocation(item);
              const distanceLabel = (typeof item.__distanceMiles === 'number')
                ? `${item.__distanceMiles.toFixed(1)} mi away`
                : '';
              const featured = isFeatured(item);
              const isNew = isNewListing(item);
              const isSaved = savedJobIds.has(Number(id));
              const title = escapeHtml(item.title || item.name || '');
              const safeCompany = escapeHtml(company);
              const safeCompanySlug = escapeHtml(companySlug || '');
              const summary = escapeHtml(item.summary || '');
              const safeField = escapeHtml(field);
              const safeRate = escapeHtml(`${rateMin || ''}${rateMax ? `–${rateMax}` : ''} ${rateType || ''}`.trim());
              const safeLocation = escapeHtml(location);
              const safeDistance = escapeHtml(distanceLabel);
              const safeCompanySite = safeUrl(companySite);
              const companyLink = companySlug ? `/#company/${encodeURIComponent(companySlug)}` : '';
              return `
                <div class="group relative border border-slate-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-lg transition">
                  <div class="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-indigo-500 via-pink-500 to-amber-400 opacity-70"></div>
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <h2 class="text-xl font-medium text-slate-900 font-serif">${title}</h2>
                      ${company ? `<div class="text-base text-slate-600 mt-1">${safeCompanySlug ? `<a class="hover:underline" href="/#company/${safeCompanySlug}">${safeCompany}</a>` : safeCompany}</div>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                      ${isNew ? `<span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">New</span>` : ''}
                      ${featured ? `<span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Featured</span>` : ''}
                    </div>
                  </div>
                  <p class="text-base text-slate-600 mt-3 line-clamp-3">${summary}</p>
                  <div class="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                    ${field ? `<span class="px-3 py-1.5 rounded-full bg-slate-100 inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 7h16M4 12h16M4 17h16"></path>
                      </svg>
                      ${safeField}
                    </span>` : ''}
                    ${(rateType || rateMin || rateMax) ? `<span class="px-3 py-1.5 rounded-full bg-slate-100 inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v20M5 7h14M5 17h14"></path>
                      </svg>
                      ${safeRate}
                    </span>` : ''}
                    ${location ? `<span class="px-3 py-1.5 rounded-full bg-slate-100 inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"></path>
                        <circle cx="12" cy="11" r="2"></circle>
                      </svg>
                      ${safeLocation}
                    </span>` : ''}
                    ${distanceLabel ? `<span class="px-3 py-1.5 rounded-full bg-slate-100 inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.36-6.36-2.83 2.83M9.47 14.53l-2.83 2.83m0-11.32 2.83 2.83m8.06 8.06 2.83 2.83" />
                      </svg>
                      ${safeDistance}
                    </span>` : ''}
                  </div>
                  <div class="mt-5 flex items-center justify-between text-base">
                    <div class="flex items-center gap-3 text-sm">
                      ${companyLink ? `<a href="${companyLink}" class="text-indigo-600 hover:underline">${escapeHtml(CONFIG.COMPANY_ENTITY_LABEL || 'Company page')}</a>` : ''}
                      ${safeCompanySite ? `<a href="${safeCompanySite}" class="text-indigo-600 hover:underline" target="_blank" rel="noopener">Company site</a>` : ''}
                    </div>
                    <div class="flex items-center gap-3">
                      <button data-save-id="${id}" class="text-sm ${isSaved ? 'text-amber-700' : 'text-indigo-600'} hover:underline">
                        ${isSaved ? 'Saved' : 'Save'}
                      </button>
                      <a href="/#list-detail?id=${id}" class="text-indigo-600 font-semibold hover:underline">
                        View Details →
                      </a>
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')
        : `<p>No items found.</p>`;
    }
    
}
