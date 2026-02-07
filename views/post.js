import { CONFIG, US_STATES } from '../config.js';

export function renderPost(container) {
  const tiers = Array.isArray(CONFIG.JOB_POSTING_TIERS) ? CONFIG.JOB_POSTING_TIERS : [];
  const tierMarkup = tiers.length
    ? `
      <div class="border rounded p-4 bg-white">
        <h2 class="text-lg font-semibold mb-2">Choose a listing tier</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${tiers.map((tier, idx) => `
            <label class="border rounded p-3 cursor-pointer flex items-start space-x-3 ${idx === 0 ? 'border-purple-400' : 'border-gray-200'}">
              <input type="radio" name="job_tier" value="${tier.id}" class="mt-1" ${idx === 0 ? 'checked' : ''} />
              <div>
                <div class="font-semibold">${tier.label} • $${tier.price}</div>
                <div class="text-xs text-gray-600">${tier.durationDays} days • ${tier.featured ? 'Featured placement' : 'Standard placement'}</div>
                ${tier.blurb ? `<div class="text-xs text-gray-500 mt-1">${tier.blurb}</div>` : ''}
              </div>
            </label>
          `).join('')}
        </div>
        <div class="mt-3">
          <label class="text-xs text-gray-500 block mb-1">Promo code (optional)</label>
          <input type="text" name="promo_code" class="w-full p-2 border rounded" placeholder="Enter code" />
        </div>
      </div>
    `
    : '';

  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Post a ${CONFIG.COMPANY_BUSINESS_THING}</h1>
    <form id="postForm" class="space-y-4">
      ${tierMarkup}
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
        if (f.name === 'street1') {
          return `
            <div>
              <input type="${f.type}" name="${f.name}" class="w-full p-2 border rounded" placeholder="${f.label}" ${f.required ? 'required' : ''} />
              <p class="text-xs text-gray-500 mt-1">Include a street number and name (e.g., 111 N Main St).</p>
            </div>
          `;
        }
        return `<input type="${f.type}" name="${f.name}" class="w-full p-2 border rounded" placeholder="${f.label}" ${f.required ? 'required' : ''} />`;
      }).join('')}
      <p id="postError" class="text-sm text-red-600"></p>
      <button type="submit" class="text-purple px-4 py-2 rounded">Continue to Payment</button>
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
    const street1 = (formData.street1 || '').trim();
    if (street1) {
      if (!/\d+/.test(street1) || !/[a-zA-Z]{2,}/.test(street1)) {
        postError.textContent = 'Street address must include a number and street name.';
        return;
      }
    }
    try {
      const zipRes = await fetch(`https://api.zippopotam.us/us/${zip.substring(0, 5)}`);
      if (!zipRes.ok) {
        postError.textContent = 'ZIP code not found.';
        return;
      }
      const zipData = await zipRes.json();
      const places = zipData.places || [];
      const cityNorm = (formData.city || '').trim().toLowerCase();
      const stateNorm = (formData.state || '').trim().toUpperCase();
      const match = places.some(p =>
        (p['place name'] || '').toLowerCase() === cityNorm &&
        (p['state abbreviation'] || '').toUpperCase() === stateNorm
      );
      if (!match) {
        postError.textContent = 'City and state do not match the ZIP code.';
        return;
      }
    } catch (err) {
      postError.textContent = 'Unable to verify ZIP code. Please try again.';
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

    try {
      const configRes = await fetch('/api/stripe-config');
      const stripeConfig = await configRes.json();
      if (!stripeConfig?.publishableKey) {
        alert('Stripe is not configured yet. Please contact support.');
        return;
      }

      const tier = formData.job_tier || (tiers[0]?.id || 'standard');
      const promoCode = (formData.promo_code || '').trim();
      const payload = { ...formData, rate_min: rateMin, rate_max: rateMax, tier, promo_code: promoCode };

      const checkoutRes = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) {
        alert('❌ Payment setup failed: ' + (checkoutData.message || checkoutData.error || 'Unknown error'));
        return;
      }

      if (checkoutData.free && checkoutData.job_id) {
        alert('✅ Job draft created. You can publish it from your dashboard.');
        window.location.hash = '#my-job-posts';
        return;
      }

      if (!checkoutData.sessionId) {
        alert('❌ Payment setup failed: Missing Stripe session.');
        return;
      }

      const stripe = Stripe(stripeConfig.publishableKey);
      const { error } = await stripe.redirectToCheckout({ sessionId: checkoutData.sessionId });
      if (error) {
        alert(error.message || 'Stripe checkout failed.');
      }
    } catch (err) {
      alert('❌ Payment setup failed. Please try again.');
    }
  });
}
