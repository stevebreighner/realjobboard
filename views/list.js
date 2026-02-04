export function renderList(container) {
 

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4">Results</h1>

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

      <input
        type="text"
        id="searchInput"
        class="w-full p-2 border rounded mb-4"
        placeholder="Search..."
      />

      <div id="itemsContainer" class="space-y-4"></div>
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

  const normalize = (val) => (val || '').toString().toLowerCase();
  const getMetaValue = (item, key) =>
    (item?.meta && item.meta[key] != null ? item.meta[key] : item?.[key]) ?? '';
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

  const applyFilters = () => {
    const query = normalize(searchInput.value);
    const fieldQuery = normalize(filterField.value);
    const cityQuery = normalize(filterCity.value);
    const stateQuery = normalize(filterState.value);
    const zipQuery = normalize(filterZip.value);
    const rateTypeQuery = normalize(filterRateType.value);
    const minRateQuery = normalize(filterRateMin.value);
    const maxRateQuery = normalize(filterRateMax.value);

    const filtered = items.filter(item => {
      if (query && !getSearchText(item).includes(query)) return false;
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

    const sorted = [...filtered].sort((a, b) => {
      const featureDiff = (isFeatured(b) ? 1 : 0) - (isFeatured(a) ? 1 : 0);
      if (featureDiff !== 0) return featureDiff;
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });

    renderItems(sorted);
  };

  [searchInput, filterField, filterCity, filterState, filterZip, filterRateType, filterRateMin, filterRateMax].forEach(input => {
    input.addEventListener('input', applyFilters);
  });

  const cached = window.__preload?.list;
  const cacheFresh = cached && (Date.now() - cached.ts) < 60000;
  if (cacheFresh) {
    items = cached.data;
    applyFilters();
  }

  fetch('/wp-json/customapi/v1/get-list')
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

    function renderItems(items) {
      itemsContainer.innerHTML = items.length
        ? items
            .map(item => {
              const id = item.id || item._id || item.slug;
              const field = getMetaValue(item, 'field');
              const company = getMetaValue(item, 'company');
              const companySite = getMetaValue(item, 'company_site');
              const rateType = getMetaValue(item, 'rate_type');
              const rateMin = getMetaValue(item, 'rate_min');
              const rateMax = getMetaValue(item, 'rate_max');
              const location = buildLocation(item);
              const featured = isFeatured(item);
              return `
                <div class="border rounded p-4 shadow">
                  <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold">${item.title || item.name}</h2>
                    ${featured ? `<span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Featured</span>` : ''}
                  </div>
                  <p class="text-sm text-gray-600">${item.summary || ''}</p>
                  ${field ? `<p class="text-sm text-gray-600">Field: ${field}</p>` : ''}
                  ${(rateType || rateMin || rateMax) ? `<p class="text-sm text-gray-600">Rate: ${rateMin || ''}${rateMax ? `–${rateMax}` : ''} ${rateType || ''}</p>` : ''}
                  ${company ? `<p class="text-sm text-gray-600">Company: ${company}${companySite ? ` • <a href="${companySite}" class="text-indigo-600 hover:underline" target="_blank" rel="noopener">Website</a>` : ''}</p>` : (companySite ? `<p class="text-sm text-gray-600">Company: <a href="${companySite}" class="text-indigo-600 hover:underline" target="_blank" rel="noopener">Website</a></p>` : '')}
                  ${location ? `<p class="text-sm text-gray-600">${location}</p>` : ''}
                  <a href="/#list-detail?id=${id}" class="text-indigo-600 text-sm mt-2 inline-block hover:underline">
                    View Details
                  </a>
                </div>
              `;
            })
            .join('')
        : `<p>No items found.</p>`;
    }
    
}
