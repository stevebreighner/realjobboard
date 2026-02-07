import { getUserProfileCached, getUserProfileCachedAny } from '../utils/session.js';
import { CONFIG } from '../config.js';
import { escapeHtml, safeUrl } from '../utils/sanitize.js';

export function renderList(container) {
 

  container.innerHTML = `
    <div class="max-w-5xl mx-auto px-4">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-3">
        <div>
          <h1 class="text-3xl font-bold">${CONFIG.JOB_COPY?.LIST_TITLE || 'Open Roles'}</h1>
          <p class="text-sm text-gray-600">${CONFIG.JOB_COPY?.LIST_SUBTITLE || 'Curated listings with privacy-first applications.'}</p>
        </div>
        <div class="text-[11px] text-gray-400">Sorted by featured + most recent</div>
      </div>

      <div class="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          id="searchInput"
          class="w-full p-2 border rounded"
          placeholder="Search (e.g. nurse in Des Moines or react, node, aws)"
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
      <details class="mb-4 border border-slate-200 rounded-xl p-4 bg-white">
        <summary class="cursor-pointer text-sm text-slate-700 font-medium">Advanced search filters</summary>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
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
          <select id="filterEmploymentType" class="w-full p-2 border rounded">
            <option value="">Employment type</option>
            ${(CONFIG.EMPLOYMENT_TYPES || []).map(opt => `
              <option value="${opt.value}">${opt.label}</option>
            `).join('')}
          </select>
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
      </details>
      <details class="mb-3 text-xs text-gray-500">
        <summary class="cursor-pointer">Search tips</summary>
        <div class="mt-2">
          Tip: use comma-separated terms to rank results (e.g. “react, node, aws”). You can also type “nurse in des moines”.
        </div>
      </details>
      <p id="distanceHint" class="text-[11px] text-gray-400 mb-3 hidden">
        Add your ZIP in Profile to enable distance filtering.
      </p>
      <p id="searchStatus" class="text-xs text-slate-500 mb-3 hidden">Searching...</p>

      <div id="itemsContainer" class="grid gap-6 md:grid-cols-2"></div>
      <div id="pagination" class="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm"></div>

      <div class="mt-6 border rounded-2xl p-4 bg-white shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-lg font-semibold">${CONFIG.JOB_COPY?.ALERTS_TITLE || 'Job Alerts'}</h2>
            <p class="text-xs text-gray-500">Save this search to get notified about new matches.</p>
          </div>
          <button id="saveAlertBtn" class="text-sm text-indigo-600 hover:underline">Save this search</button>
        </div>
        <div id="alertsContainer" class="space-y-2"></div>
      </div>
    </div>
  `;

  const itemsContainer = container.querySelector('#itemsContainer');
  const paginationEl = container.querySelector('#pagination');
  const searchInput = container.querySelector('#searchInput');
  const filterField = container.querySelector('#filterField');
  const filterCity = container.querySelector('#filterCity');
  const filterState = container.querySelector('#filterState');
  const filterZip = container.querySelector('#filterZip');
  const filterEmploymentType = container.querySelector('#filterEmploymentType');
  const filterRateType = container.querySelector('#filterRateType');
  const filterRateMin = container.querySelector('#filterRateMin');
  const filterRateMax = container.querySelector('#filterRateMax');
  const sortSelect = container.querySelector('#sortSelect');
  const distanceSelect = container.querySelector('#distanceSelect');
  const distanceHint = container.querySelector('#distanceHint');
  const searchStatus = container.querySelector('#searchStatus');
  const saveAlertBtn = container.querySelector('#saveAlertBtn');
  const alertsContainer = container.querySelector('#alertsContainer');
  const savedJobIds = new Set();
  let alerts = [];
  let currentPage = 1;
  let pageSize = 12;
  const storedState = (() => {
    const raw = sessionStorage.getItem('listState');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  })();
  if (storedState) {
    if (searchInput) searchInput.value = storedState.search || '';
    if (filterField) filterField.value = storedState.field || '';
    if (filterCity) filterCity.value = storedState.city || '';
    if (filterState) filterState.value = storedState.state || '';
    if (filterZip) filterZip.value = storedState.zip || '';
    if (filterEmploymentType) filterEmploymentType.value = storedState.employment_type || '';
    if (filterRateType) filterRateType.value = storedState.rate_type || '';
    if (filterRateMin) filterRateMin.value = storedState.rate_min || '';
    if (filterRateMax) filterRateMax.value = storedState.rate_max || '';
    if (distanceSelect) distanceSelect.value = storedState.radius || '';
    if (storedState.page) currentPage = Math.max(1, Number(storedState.page) || 1);
  }

  const normalize = (val) => (val || '').toString().toLowerCase();
  const tokenize = (val) => normalize(val).split(/[^a-z0-9]+/).filter(Boolean);
  const synonymMap = {
    nurse: ['rn', 'registered nurse', 'lpn', 'lvn'],
    developer: ['software engineer', 'engineer', 'programmer'],
    'software engineer': ['developer', 'programmer', 'engineer'],
    server: ['waiter', 'waitress'],
    cashier: ['retail associate', 'sales associate'],
    barista: ['coffee'],
    caregiver: ['cna', 'home health', 'aide'],
  };
  const soundex = (word) => {
    const w = (word || '').toString().toUpperCase().replace(/[^A-Z]/g, '');
    if (!w) return '';
    const first = w[0];
    const map = {
      B: '1', F: '1', P: '1', V: '1',
      C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
      D: '3', T: '3',
      L: '4',
      M: '5', N: '5',
      R: '6',
    };
    let result = first;
    let prev = map[first] || '';
    for (let i = 1; i < w.length; i++) {
      const ch = w[i];
      const code = map[ch] || '';
      if (code && code !== prev) result += code;
      if (result.length === 4) break;
      prev = code;
    }
    return (result + '000').slice(0, 4);
  };
  const levenshtein = (a, b) => {
    if (a === b) return 0;
    const alen = a.length;
    const blen = b.length;
    if (!alen) return blen;
    if (!blen) return alen;
    const dp = Array.from({ length: alen + 1 }, () => new Array(blen + 1).fill(0));
    for (let i = 0; i <= alen; i++) dp[i][0] = i;
    for (let j = 0; j <= blen; j++) dp[0][j] = j;
    for (let i = 1; i <= alen; i++) {
      for (let j = 1; j <= blen; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[alen][blen];
  };
  const fuzzyIncludes = (term, text) => {
    if (!term) return true;
    if (text.includes(term)) return true;
    const compactText = text.replace(/\s+/g, '');
    const compactTerm = term.replace(/\s+/g, '');
    if (compactText.includes(compactTerm)) return true;
    const tokens = tokenize(text);
    const limit = term.length <= 4 ? 1 : term.length <= 7 ? 2 : 3;
    if (tokens.some(tok => tok.length >= 3 && levenshtein(term, tok) <= limit)) return true;
    const termSound = soundex(term);
    if (termSound && tokens.some(tok => soundex(tok) === termSound)) return true;
    const syns = synonymMap[term] || [];
    if (syns.length) {
      return syns.some(syn => text.includes(normalize(syn)));
    }
    return false;
  };
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
  const formatMoney = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    const decimals = Number.isInteger(num) ? 0 : 2;
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(num);
  };
  const formatRate = (min, max, typeLabel) => {
    if (!min && !max && !typeLabel) return '';
    const minLabel = min ? `$${formatMoney(min)}` : '';
    const maxLabel = max ? `$${formatMoney(max)}` : '';
    const range = minLabel && maxLabel ? `${minLabel}–${maxLabel}` : (minLabel || maxLabel);
    return `${range}${typeLabel ? ` ${typeLabel}` : ''}`.trim();
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
    const employmentType = getMetaValue(item, 'employment_type');
    const company = getMetaValue(item, 'company');
    const location = buildLocation(item);
    return normalize([title, summary, field, employmentType, company, location].join(' '));
  };

  let items = [];
  let userZip = '';
  let userCoords = null;
  let lastDistanceZip = '';

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
    if (searchStatus) {
      searchStatus.classList.remove('hidden');
      searchStatus.textContent = 'Searching...';
    }
    const rawQuery = searchInput.value || '';
    const query = normalize(rawQuery);
    const cityMatch = rawQuery.match(/\bin\s+([a-z\s]+)$/i);
    const inferredCity = cityMatch ? cityMatch[1].trim() : '';
    const queryWithoutCity = inferredCity
      ? rawQuery.replace(/\bin\s+[a-z\s]+$/i, '').trim()
      : rawQuery;
    const terms = queryWithoutCity
      .split(',')
      .map(t => normalize(t))
      .filter(t => t.length);
    const useMulti = terms.length >= 2;
    const wordTerms = queryWithoutCity
      .trim()
      .split(/\s+/)
      .map(t => normalize(t))
      .filter(t => t.length);
    const fieldQuery = normalize(filterField.value);
    const cityQuery = normalize(filterCity.value || inferredCity);
    const stateQuery = normalize(filterState.value);
    const zipQuery = normalize(filterZip.value);
    const employmentTypeQuery = normalize(filterEmploymentType?.value);
    const rateTypeQuery = normalize(filterRateType.value);
    const minRateQuery = normalize(filterRateMin.value);
    const maxRateQuery = normalize(filterRateMax.value);
    const radiusMiles = parseFloat(distanceSelect?.value || '');
    const distanceZip = (userZip || zipQuery).trim();
    const listState = {
      search: rawQuery || '',
      field: filterField.value || '',
      city: filterCity.value || '',
      state: filterState.value || '',
      zip: filterZip.value || '',
      employment_type: filterEmploymentType?.value || '',
      rate_type: filterRateType.value || '',
      rate_min: filterRateMin.value || '',
      rate_max: filterRateMax.value || '',
      radius: distanceSelect?.value || '',
      page: currentPage || 1,
    };
    sessionStorage.setItem('listState', JSON.stringify(listState));
    const params = new URLSearchParams(listState);
    sessionStorage.setItem('listHash', `#list?${params.toString()}`);

    const filtered = items.filter(item => {
      const searchText = getSearchText(item);
      if (useMulti) {
        const matchCount = terms.reduce((acc, term) => acc + (fuzzyIncludes(term, searchText) ? 1 : 0), 0);
        if (matchCount === 0) return false;
        item.__matchCount = matchCount;
      } else if (query) {
        if (wordTerms.length > 1) {
          if (!wordTerms.every(term => fuzzyIncludes(term, searchText))) return false;
        } else if (!searchText.includes(query)) {
          if (!fuzzyIncludes(query, searchText)) return false;
        }
      }
      if (fieldQuery && !normalize(getMetaValue(item, 'field')).includes(fieldQuery)) return false;
      if (cityQuery && !normalize(getMetaValue(item, 'city')).includes(cityQuery)) return false;
      if (stateQuery && !normalize(getMetaValue(item, 'state')).includes(stateQuery)) return false;
      if (zipQuery && !normalize(getMetaValue(item, 'zip')).includes(zipQuery)) return false;
      if (employmentTypeQuery && !normalize(getMetaValue(item, 'employment_type')).includes(employmentTypeQuery)) return false;
      if (rateTypeQuery && !normalize(getMetaValue(item, 'rate_type')).includes(rateTypeQuery)) return false;
      const rateMinVal = parseFloat(getMetaValue(item, 'rate_min') || '');
      const rateMaxVal = parseFloat(getMetaValue(item, 'rate_max') || '');
      const minQueryVal = parseFloat(minRateQuery || '');
      const maxQueryVal = parseFloat(maxRateQuery || '');
      if (!isNaN(minQueryVal) && !isNaN(rateMaxVal) && rateMaxVal < minQueryVal) return false;
      if (!isNaN(maxQueryVal) && !isNaN(rateMinVal) && rateMinVal > maxQueryVal) return false;
      return true;
    });

    if (!isNaN(radiusMiles) && radiusMiles > 0 && distanceZip) {
      if (!userCoords || lastDistanceZip !== distanceZip) {
        userCoords = await getZipCoords(distanceZip);
        lastDistanceZip = distanceZip;
      }
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

    const filteredWithRadius = (!isNaN(radiusMiles) && radiusMiles > 0 && distanceZip && userCoords)
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

    const totalItems = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const pageItems = sorted.slice(start, start + pageSize);
    renderItems(pageItems);
    renderPagination(totalItems, totalPages);
    if (searchStatus) {
      searchStatus.textContent = `Showing ${Math.min(totalItems, (currentPage - 1) * pageSize + 1)}–${Math.min(totalItems, currentPage * pageSize)} of ${totalItems}`;
      if (totalItems === 0) {
        searchStatus.textContent = 'No matches found.';
      }
      searchStatus.classList.remove('hidden');
    }
  };

  function renderPagination(totalItems, totalPages) {
    if (!paginationEl) return;
    if (totalItems <= pageSize) {
      paginationEl.innerHTML = '';
      return;
    }
    const prevDisabled = currentPage <= 1 ? 'opacity-50 pointer-events-none' : '';
    const nextDisabled = currentPage >= totalPages ? 'opacity-50 pointer-events-none' : '';
    paginationEl.innerHTML = `
      <div class="text-xs text-slate-500">
        Showing ${Math.min(totalItems, (currentPage - 1) * pageSize + 1)}–${Math.min(totalItems, currentPage * pageSize)} of ${totalItems}
      </div>
      <div class="flex items-center gap-2">
        <button data-page="prev" class="px-3 py-1.5 border border-slate-200 rounded ${prevDisabled}">Prev</button>
        <span class="text-xs text-slate-600">Page ${currentPage} of ${totalPages}</span>
        <button data-page="next" class="px-3 py-1.5 border border-slate-200 rounded ${nextDisabled}">Next</button>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-slate-500" for="pageSizeSelect">Per page</label>
        <select id="pageSizeSelect" class="border rounded px-2 py-1 text-xs">
          ${[8, 12, 16, 24].map(size => `<option value="${size}" ${size === pageSize ? 'selected' : ''}>${size}</option>`).join('')}
        </select>
      </div>
    `;
    paginationEl.querySelector('button[data-page="prev"]')?.addEventListener('click', () => {
      currentPage = Math.max(1, currentPage - 1);
      applyFilters();
    });
    paginationEl.querySelector('button[data-page="next"]')?.addEventListener('click', () => {
      currentPage = Math.min(totalPages, currentPage + 1);
      applyFilters();
    });
    paginationEl.querySelector('#pageSizeSelect')?.addEventListener('change', (e) => {
      const nextSize = parseInt(e.target.value, 10);
      if (!isNaN(nextSize)) {
        pageSize = nextSize;
        currentPage = 1;
        applyFilters();
      }
    });
  }

  [searchInput, filterField, filterCity, filterState, filterZip, filterEmploymentType, filterRateType, filterRateMin, filterRateMax].forEach(input => {
    input.addEventListener('input', () => {
      currentPage = 1;
      applyFilters();
    });
  });
  sortSelect?.addEventListener('change', () => {
    currentPage = 1;
    applyFilters();
  });
  distanceSelect?.addEventListener('change', () => {
    currentPage = 1;
    applyFilters();
  });

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
        employment_type: filterEmploymentType?.value || '',
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
              const employmentType = getMetaValue(item, 'employment_type');
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
              const safeEmploymentType = escapeHtml(employmentType || '');
              const safeRate = escapeHtml(formatRate(rateMin, rateMax, rateType));
              const safeLocation = escapeHtml(location);
              const safeDistance = escapeHtml(distanceLabel);
              return `
                <div class="group relative border border-slate-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-lg transition">
                  <div class="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-indigo-500 via-pink-500 to-amber-400 opacity-70"></div>
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <h2 class="text-lg font-medium text-slate-900 font-serif">${title}</h2>
                      ${company ? `<div class="text-sm text-slate-600 mt-1">${safeCompanySlug ? `<a class="hover:underline" href="/#company/${safeCompanySlug}">${safeCompany}</a>` : safeCompany}</div>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                      ${isNew ? `<span class="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">New</span>` : ''}
                      ${featured ? `<span class="text-[11px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Featured</span>` : ''}
                    </div>
                  </div>
                  <p class="text-sm text-slate-600 mt-3 line-clamp-3">${summary}</p>
                  <div class="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                    ${field ? `<span class="px-3 py-1.5 rounded-full bg-slate-100 inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 7h16M4 12h16M4 17h16"></path>
                      </svg>
                      ${safeField}
                    </span>` : ''}
                    ${employmentType ? `<span class="px-3 py-1.5 rounded-full bg-slate-100 inline-flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="7" width="18" height="12" rx="2"></rect>
                        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      ${safeEmploymentType}
                    </span>` : ''}
                    ${(rateType || rateMin || rateMax) ? `<span class="px-3 py-1.5 rounded-full bg-slate-100 inline-flex items-center gap-2">
                      <span class="inline-flex items-center justify-center h-4 w-4 text-slate-500 font-semibold">$</span>
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
                  <div class="mt-5 flex items-center justify-end text-sm">
                    <div class="flex items-center gap-3">
                      <button data-save-id="${id}" class="text-sm ${isSaved ? 'text-amber-700' : 'text-indigo-600'} hover:underline">
                        ${isSaved ? 'Saved' : 'Save'}
                      </button>
                      <a href="/#list-detail?id=${id}" data-detail-id="${id}" class="js-view-detail inline-flex items-center gap-2 text-indigo-700 border border-indigo-300 px-2.5 py-1 rounded-full hover:border-indigo-500 hover:bg-indigo-50 transition">
                        View
                        <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              `;
            })
            .join('')
        : `<p>No items found.</p>`;
      attachDetailLinks();
    }

    function attachDetailLinks() {
      const links = itemsContainer.querySelectorAll('.js-view-detail');
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const id = link.getAttribute('data-detail-id');
          const app = document.getElementById('app');
          if (app) {
            app.style.opacity = '0';
            app.style.visibility = 'hidden';
          }
          window.location.hash = `#list-detail?id=${id}`;
        }, { once: true });
      });
    }
    
}
