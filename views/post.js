import { CONFIG, US_STATES } from '../config.js';

export function renderPost(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Post a ${CONFIG.COMPANY_BUSINESS_THING}</h1>
    <form id="postForm" class="space-y-4">
      ${CONFIG.fields.map(f => {
        if (f.type === 'textarea') {
          return `<textarea name="${f.name}" class="w-full p-2 border rounded" placeholder="${f.label}" ${f.required ? 'required' : ''}></textarea>`;
        }
        if (f.type === 'select') {
          const options = (f.options || []).map(opt => {
            const value = typeof opt === 'string' ? opt : (opt.code || opt.value);
            const label = typeof opt === 'string' ? opt : (opt.name || opt.label);
            return `<option value="${value}">${label}</option>`;
          }).join('');
          return `
            <select name="${f.name}" class="w-full p-2 border rounded" ${f.required ? 'required' : ''}>
              <option value="" disabled selected>${f.label}</option>
              ${options}
            </select>
          `;
        }
        return `<input type="${f.type}" name="${f.name}" class="w-full p-2 border rounded" placeholder="${f.label}" ${f.required ? 'required' : ''} />`;
      }).join('')}
      <p id="postError" class="text-sm text-red-600"></p>
      <button type="submit" class="text-purple px-4 py-2 rounded">Submit</button>
    </form>
    <p class="mt-4"><a href="/#list" class="text-blue-600 hover:underline">Back to ${CONFIG.COMPANY_BUSINESS_THING_PLURAL}</a></p>
  `;

  const form = container.querySelector('#postForm');
  const postError = container.querySelector('#postError');
  const countryInput = form.querySelector('input[name="country"]');
  if (countryInput && !countryInput.value) {
    countryInput.value = 'United States';
  }

  const zipInput = form.querySelector('input[name="zip"]');
  const cityInput = form.querySelector('input[name="city"]');
  const stateSelect = form.querySelector('select[name="state"]');
  const setupZipLookup = () => {
    if (!zipInput || !cityInput || !stateSelect) return;
    const lookup = async () => {
      const zip = (zipInput.value || '').trim();
      if (!/^\d{5}$/.test(zip)) return;
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
        if (!res.ok) return;
        const data = await res.json();
        const place = data.places && data.places[0];
        if (!place) return;
        if (!cityInput.value) cityInput.value = place['place name'] || '';
        const stateCode = place['state abbreviation'];
        if (stateCode) {
          stateSelect.value = stateCode;
        }
      } catch (err) {
        // silent fail
      }
    };
    zipInput.addEventListener('blur', lookup);
    zipInput.addEventListener('change', lookup);
  };
  setupZipLookup();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());

    postError.textContent = '';
    const country = (formData.country || '').trim();
    const state = (formData.state || '').trim();
    const zip = (formData.zip || '').trim();
    const usaValues = ['usa', 'us', 'united states', 'united states of america'];
    if (!usaValues.includes(country.toLowerCase())) {
      postError.textContent = 'USA only: please enter United States.';
      return;
    }
    if (!state || !US_STATES.some(s => s.code === state)) {
      postError.textContent = 'Please select a valid state.';
      return;
    }
    if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) {
      postError.textContent = 'ZIP must be 5 digits (or 5+4).';
      return;
    }

    const rateMin = (formData.rate_min || '').toString().replace(/[^0-9.]/g, '');
    const rateMax = (formData.rate_max || '').toString().replace(/[^0-9.]/g, '');
    if (!rateMin || !rateMax || isNaN(rateMin) || isNaN(rateMax)) {
      postError.textContent = 'Please enter a valid rate range.';
      return;
    }
    if (Number(rateMin) > Number(rateMax)) {
      postError.textContent = 'Rate min must be less than or equal to rate max.';
      return;
    }

    const response = await fetch('/wp-json/customapi/v1/create-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, rate_min: rateMin, rate_max: rateMax })
    });

    if (response.ok) {
      alert(`${CONFIG.COMPANY_BUSINESS_THING} posted successfully!`);
      window.location.hash = '/#list';
    } else {
      const data = await response.json();
      alert('❌ Failed to post: ' + (data.message || 'Unknown error'));
    }
  });
}
