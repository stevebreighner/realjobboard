import { CONFIG, US_STATES } from '../config.js'; // optional if you want to use config constants

export function renderRegister(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Register</h1>
    <div id="googleRegisterWrap" class="mb-4">
      <button type="button" id="googleRegisterBtn" class="w-full border border-slate-300 rounded px-4 py-2 flex items-center justify-center gap-2 hover:bg-slate-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="h-5 w-5">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.77 1.22 9.29 3.22l6.94-6.94C35.87 2.2 30.23 0 24 0 14.62 0 6.53 5.38 2.56 13.22l8.09 6.29C12.6 13.24 17.82 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24c0-1.59-.16-3.12-.46-4.59H24v9.19h12.71c-.55 2.97-2.22 5.49-4.71 7.19l7.22 5.6C43.5 37.36 46.5 31.1 46.5 24z"/>
          <path fill="#FBBC05" d="M10.65 28.51c-.53-1.58-.83-3.27-.83-5.01s.3-3.43.83-5.01l-8.09-6.29C.9 15.08 0 19.45 0 24s.9 8.92 2.56 12.8l8.09-6.29z"/>
          <path fill="#34A853" d="M24 48c6.23 0 11.46-2.05 15.28-5.61l-7.22-5.6c-2.01 1.35-4.6 2.15-8.06 2.15-6.18 0-11.4-3.74-13.35-9.01l-8.09 6.29C6.53 42.62 14.62 48 24 48z"/>
        </svg>
        Continue with Google
      </button>
    </div>
    <form id="registerForm" class="space-y-4">
      <input type="text" name="website" autocomplete="off" tabindex="-1" style="display:none" />
      <input type="hidden" name="ts" value="${Math.floor(Date.now() / 1000)}" />
      <input type="text" name="username" placeholder="Username" class="w-full p-2 border rounded" required />
      <input type="email" name="email" placeholder="Email" class="w-full p-2 border rounded" required />
      <div class="relative w-full">
        <input type="password" id="registerPassword" name="password" placeholder="Password" class="w-full p-2 border rounded pr-10" required />
        <button type="button" id="toggleRegisterPassword" class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 bg-transparent border-0 p-0 m-0" style="width:2rem;height:2rem;">
          <svg id="registerEyeIcon" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
      
      <select name="role" class="w-full p-2 border rounded" required>
        <option value="" disabled selected>Select Role</option>
        <option value="employee">Employee</option>
        <option value="employer">Employer</option>
      </select>

      <div id="employerFields" class="hidden border rounded p-3 bg-white">
        <h3 class="text-base font-semibold mb-2">Employer Details</h3>
        <input type="text" name="company" placeholder="Company Name" class="w-full p-2 border rounded mb-2" list="companySuggestions" />
        <datalist id="companySuggestions"></datalist>
        <div id="companySuggestionHint" class="text-xs text-gray-500 mb-2 hidden"></div>
        <input type="url" name="company_site" placeholder="Company Website (https://...)" class="w-full p-2 border rounded mb-2" />
        <input type="email" name="company_email" placeholder="Company Email (name@company.com)" class="w-full p-2 border rounded" />
        <p class="text-xs text-gray-500 mt-2">Employer accounts require a company email that matches your website domain.</p>
      </div>

      <h3 class="text-lg font-semibold mt-2">Address (USA Only)</h3>
      <div>
        <input type="text" name="street1" placeholder="Street Address" class="w-full p-2 border rounded" required />
        <p class="text-xs text-gray-500 mt-1">Include a street number and name (e.g., 111 N Main St).</p>
      </div>
      <input type="text" name="street2" placeholder="Unit/Suite (optional)" class="w-full p-2 border rounded" />
      <input type="text" name="city" placeholder="City" class="w-full p-2 border rounded" required />
      <select name="state" class="w-full p-2 border rounded" required>
        <option value="" disabled selected>State</option>
        ${US_STATES.map(s => `<option value="${s.code}">${s.name}</option>`).join('')}
      </select>
      <input type="text" name="zip" placeholder="ZIP Code" class="w-full p-2 border rounded" required />
      <input type="text" name="country" placeholder="Country" class="w-full p-2 border rounded" value="United States" required />

      <div id="turnstile-container"></div>

      <button type="submit" class="text-purple px-4 py-2 rounded">Register</button>
    </form>
    <p class="mt-4">
      Have an account? <a href="#/login" class="text-blue-600">Login here</a>
    </p>
  `;

  const form = container.querySelector('#registerForm');
  const googleBtn = container.querySelector('#googleRegisterBtn');
  const turnstileContainer = container.querySelector('#turnstile-container');
  const passwordInput = container.querySelector('#registerPassword');
  const togglePasswordBtn = container.querySelector('#toggleRegisterPassword');
  const roleSelect = container.querySelector('select[name="role"]');
  const employerFields = container.querySelector('#employerFields');
  const companyInput = container.querySelector('input[name="company"]');
  const companySuggestions = container.querySelector('#companySuggestions');
  const companySuggestionHint = container.querySelector('#companySuggestionHint');
  const zipInput = container.querySelector('input[name="zip"]');
  const cityInput = container.querySelector('input[name="city"]');
  const stateSelect = container.querySelector('select[name="state"]');
  let turnstileWidgetId = null;

  const getDevFlags = async () => {
    if (window.__dev_flags) return window.__dev_flags;
    try {
      const res = await fetch('/wp-json/customapi/v1/dev-flags?_=' + Date.now(), { credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        window.__dev_flags = data;
        return data;
      }
    } catch (err) {}
    window.__dev_flags = { dev_mode: 0 };
    return window.__dev_flags;
  };

  (async () => {
    const devFlags = await getDevFlags();
    if (devFlags.dev_mode) {
      if (turnstileContainer) turnstileContainer.innerHTML = '<div class="text-xs text-gray-500">Dev mode: captcha disabled</div>';
      return;
    }
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (CONFIG.TURNSTILE_SITE_KEY && turnstileContainer) {
          turnstileWidgetId = window.turnstile.render(turnstileContainer, {
            sitekey: CONFIG.TURNSTILE_SITE_KEY
          });
        }
      };
      document.head.appendChild(script);
    } else if (CONFIG.TURNSTILE_SITE_KEY && turnstileContainer) {
      turnstileWidgetId = window.turnstile.render(turnstileContainer, {
        sitekey: CONFIG.TURNSTILE_SITE_KEY
      });
    }
  })();

  togglePasswordBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    const eyeIcon = container.querySelector('#registerEyeIcon');
    if (eyeIcon) {
      eyeIcon.innerHTML = isHidden
        ? '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.72 21.72 0 0 1 5.17-6.11M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a21.76 21.76 0 0 1-3.17 4.11"/><path d="M1 1l22 22"/><path d="M9.9 9.9a3 3 0 0 0 4.24 4.24"/>'
        : '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>';
    }
  });

  googleBtn?.addEventListener('click', () => {
    window.location.href = '/api/oauth/google/start';
  });

  const updateEmployerFields = () => {
    if (!roleSelect || !employerFields) return;
    const isEmployer = roleSelect.value === 'employer';
    employerFields.classList.toggle('hidden', !isEmployer);
  };
  roleSelect?.addEventListener('change', updateEmployerFields);
  updateEmployerFields();

  let companyLookupTimer = null;
  companyInput?.addEventListener('input', () => {
    const query = companyInput.value.trim();
    if (companyLookupTimer) clearTimeout(companyLookupTimer);
    companyLookupTimer = setTimeout(async () => {
      if (!query || query.length < 2) {
        if (companySuggestions) companySuggestions.innerHTML = '';
        if (companySuggestionHint) companySuggestionHint.classList.add('hidden');
        return;
      }
      try {
        const res = await fetch(`/api/companies?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) return;
        if (companySuggestions) {
          companySuggestions.innerHTML = data.map(c => `<option value="${c.name}"></option>`).join('');
        }
        const top = data[0];
        if (companySuggestionHint && top && top.name && top.name.toLowerCase() !== query.toLowerCase()) {
          companySuggestionHint.textContent = `Did you mean "${top.name}"?`;
          companySuggestionHint.classList.remove('hidden');
        } else if (companySuggestionHint) {
          companySuggestionHint.classList.add('hidden');
        }
      } catch (err) {
        // ignore
      }
    }, 250);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());
    const devFlags = await getDevFlags();
    const password = (formData.password || '').toString();
    if (!devFlags.dev_mode) {
      const strongEnough =
        password.length >= 10 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9]/.test(password);
      if (!strongEnough) {
        alert('Password must be at least 10 characters and include uppercase, lowercase, number, and symbol.');
        return;
      }
    }
    const country = (formData.country || '').trim();
    const state = (formData.state || '').trim();
    const zip = (formData.zip || '').trim();
    const usaValues = ['usa', 'us', 'united states', 'united states of america'];
    if (!usaValues.includes(country.toLowerCase())) {
      alert('USA only: please enter United States.');
      return;
    }
    if (!state || !US_STATES.some(s => s.code === state)) {
      alert('Please select a valid state.');
      return;
    }
    if (zip && !/^\d{5}(-\d{4})?$/.test(zip)) {
      alert('ZIP must be 5 digits (or 5+4).');
      return;
    }
    const street1 = (formData.street1 || '').trim();
    if (!street1 || !/\d+/.test(street1) || !/[a-zA-Z]{2,}/.test(street1)) {
      alert('Street address must include a number and street name.');
      return;
    }
    try {
      const zipRes = await fetch(`https://api.zippopotam.us/us/${zip.substring(0, 5)}`);
      if (!zipRes.ok) {
        alert('ZIP code not found.');
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
        alert('City and state do not match the ZIP code.');
        return;
      }
    } catch (err) {
      alert('Unable to verify ZIP code. Please try again.');
      return;
    }
    if (!devFlags.dev_mode) {
      if (window.turnstile && turnstileWidgetId !== null) {
        formData.turnstile_token = window.turnstile.getResponse(turnstileWidgetId);
      }
      if (!formData.turnstile_token) {
        alert('Please complete the captcha.');
        return;
      }
    }

    if (formData.role === 'employer') {
      const companySite = (formData.company_site || '').trim();
      const companyEmail = (formData.company_email || '').trim().toLowerCase();
      if (!companySite || !companyEmail) {
        alert('Employer accounts require a company website and company email.');
        return;
      }
      const freeDomains = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','aol.com','proton.me','protonmail.com'];
      const emailDomain = companyEmail.split('@')[1] || '';
      if (!emailDomain || freeDomains.includes(emailDomain)) {
        alert('Please use a company email address (not Gmail/Yahoo/etc).');
        return;
      }
      try {
        const url = new URL(companySite.startsWith('http') ? companySite : `https://${companySite}`);
        const host = url.hostname.replace(/^www\./, '');
        if (!host || !emailDomain.endsWith(host)) {
          alert('Company email must match your website domain.');
          return;
        }
      } catch (err) {
        alert('Please enter a valid company website URL.');
        return;
      }
    }

    try {
      const requestOpts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      };

      let response = await fetch('/wp-json/customapi/v1/register', requestOpts);
      let data = await response.json().catch(() => ({}));

      const needsFallback = !response.ok || !data || (!data.user && !data.message && !data.error);
      if (needsFallback) {
        response = await fetch('/api/register', requestOpts);
        data = await response.json().catch(() => ({}));
      }

      if (response.ok) {
        alert('✅ Registered! Check your email to verify your account before logging in.');
        window.location.hash = '#/login';
      } else {
        alert('❌ Registration failed: ' + (data.message || data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ Registration error. Check console.');
    }
  });

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
}
