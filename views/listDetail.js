import { CONFIG } from '../config.js';
import { getSessionCached, getUserProfileCached, getUserProfileCachedAny } from '../utils/session.js';
import { escapeHtml, safeUrl } from '../utils/sanitize.js';

export async function renderListDetail(container, id) {
  try {
    const response = await fetch(`/api/job?id=${id}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Failed to fetch post');

    const hiddenMetaKeys = new Set([
      'email',
      'user_email',
      'contact_email',
      'employer_email',
      'company_email',
      'job_applications',
    ]);

    const formatMetaValue = (key, val) => {
      if (hiddenMetaKeys.has(key)) return '';
      if (key === 'company' && typeof val === 'string' && val.includes('@')) return '';
      if (key === 'job_applications' && typeof val === 'string') {
        const apps = [];
        const entryRegex = /s:7:"user_id";i:(\d+);s:6:"resume";s:\d+:"([^"]*)";s:12:"cover_letter";s:\d+:"([^"]*)";s:4:"time";i:(\d+);/g;
        let match;
        while ((match = entryRegex.exec(val)) !== null) {
          apps.push({
            user_id: match[1],
            resume: match[2],
            cover_letter: match[3],
            time: match[4],
          });
        }
        if (!apps.length) {
          return '<em>Applications available.</em>';
        }
        return `
          <div class="space-y-2">
            ${apps
              .map(app => {
                const date = new Date(Number(app.time) * 1000);
                const dateLabel = isNaN(date.getTime()) ? '' : ` • ${date.toLocaleString()}`;
                return `
                  <div class="border rounded p-3">
                    <div class="text-sm text-gray-700">Applicant ID: ${escapeHtml(app.user_id)}${dateLabel}</div>
                    <div class="text-sm">
                      ${safeUrl(app.resume) ? `<a href="${safeUrl(app.resume)}" class="text-indigo-600 hover:underline" target="_blank" rel="noopener">Resume</a>` : ''}
                      ${app.cover_letter && safeUrl(app.cover_letter) ? ` • <a href="${safeUrl(app.cover_letter)}" class="text-indigo-600 hover:underline" target="_blank" rel="noopener">Cover Letter</a>` : ''}
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }
      return escapeHtml(val);
    };

    const rawCompany = data.meta?.company || '';
    const company = rawCompany && rawCompany.includes('@') ? '' : rawCompany;
    const companySite = data.meta?.company_site || '';
    const companySlug = data.meta?.company_slug || '';
    const companyLink = companySlug ? `/#company/${encodeURIComponent(companySlug)}` : '';
    const safeCompanySite = safeUrl(companySite);
    const safeTitle = escapeHtml(data.title || data.name || '');
    const safeCompany = escapeHtml(company || '');
    const safeCompanySlug = escapeHtml(companySlug || '');
    const dateObj = data.date ? new Date(data.date) : null;
    const safeDate = dateObj && !isNaN(dateObj.getTime())
      ? escapeHtml(dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }))
      : escapeHtml(data.date || '');
    const safeDesc = escapeHtml(data.description || '');
    const rawRateType = data.meta?.rate_type || '';
    const rateType = (() => {
      const t = rawRateType.toString().toLowerCase();
      if (t === 'hourly') return 'per hour';
      if (t === 'salary') return 'per year';
      if (t === 'contract') return 'contract';
      if (t === 'commission') return 'commission';
      return rawRateType;
    })();
    const rateMin = data.meta?.rate_min || '';
    const rateMax = data.meta?.rate_max || '';
    const isFeatured = ['1', 'true', 'yes'].includes(String(data.meta?.job_featured || '').toLowerCase());
    const city = data.meta?.city || '';
    const state = data.meta?.state || '';
    const zip = data.meta?.zip || '';
    const locationLine = [city, state].filter(Boolean).join(', ') + (zip ? ` ${zip}` : '');

    const formatMoney = (val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return val;
      const decimals = Number.isInteger(num) ? 0 : 2;
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(num);
    };
    const formatRate = () => {
      if (!rateType && !rateMin && !rateMax) return '';
      const min = rateMin ? `$${formatMoney(rateMin)}` : '';
      const max = rateMax ? `$${formatMoney(rateMax)}` : '';
      const range = min && max ? `${min}–${max}` : (min || max);
      const typeLabel = rateType ? rateType.charAt(0).toUpperCase() + rateType.slice(1) : '';
      return escapeHtml(`${range}${typeLabel ? ` ${typeLabel}` : ''}`.trim());
    };

    const session = await getSessionCached({ maxAgeMs: 30000 });
    const isLoggedIn = !!session;

    const getZipCoords = async (zipCode) => {
      if (!zipCode) return null;
      const key = `zip_coords_${zipCode}`;
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.lat && parsed.lng) return parsed;
        }
      } catch (err) {}
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
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

    const distanceMiles = (a, b) => {
      if (!a || !b) return null;
      const toRadians = (deg) => (deg * Math.PI) / 180;
      const R = 3958.8;
      const dLat = toRadians(b.lat - a.lat);
      const dLng = toRadians(b.lng - a.lng);
      const lat1 = toRadians(a.lat);
      const lat2 = toRadians(b.lat);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.asin(Math.sqrt(h));
      return R * c;
    };

    const applyDistance = async () => {
      if (!zip) return;
      const cached = getUserProfileCachedAny({ light: true });
      let userZip = String(cached?.zip || '').trim();
      if (!userZip) {
        const profile = await getUserProfileCached({ light: true });
        userZip = String(profile?.zip || '').trim();
      }
      if (!userZip) return;
      const [userCoords, jobCoords] = await Promise.all([getZipCoords(userZip), getZipCoords(zip)]);
      if (!userCoords || !jobCoords) return;
      const miles = distanceMiles(userCoords, jobCoords);
      if (typeof miles !== 'number') return;
      const locEl = document.getElementById('jobLocationLine');
      if (locEl) {
        locEl.innerHTML = `<strong>Location:</strong> ${escapeHtml(locationLine)} • ${miles.toFixed(1)} mi away`;
      }
    };

    container.innerHTML = `
      <div class="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">${CONFIG.JOB_COPY?.POSTED_BY || 'Posted by'} ${company ? (safeCompanySlug ? `<a class="text-indigo-600 hover:underline" href="/#company/${safeCompanySlug}">${safeCompany}</a>` : safeCompany) : (CONFIG.JOB_COPY?.POSTED_BY_FALLBACK || 'Employer')} • ${safeDate}</p>
            <h1 class="text-2xl font-semibold text-slate-900 mt-2">${safeTitle}</h1>
          </div>
          <div class="flex items-center gap-2">
            <button id="saveJobBtn" class="text-xs px-3 py-1.5 rounded border border-indigo-300 text-indigo-700 hover:border-indigo-500 hover:bg-indigo-50 transition">Save</button>
            ${isFeatured ? `<span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Featured</span>` : ''}
          </div>
        </div>
        <div class="flex flex-wrap gap-2 text-xs text-slate-600 mb-4">
          ${formatRate() ? `<span class="px-3 py-1.5 rounded-full bg-slate-100"><strong>Rate:</strong> ${formatRate()}</span>` : ''}
          ${company ? `<span class="px-3 py-1.5 rounded-full bg-slate-100"><strong>${CONFIG.JOB_COPY?.COMPANY_LABEL || 'Company'}</strong> ${safeCompanySlug ? `<a class="text-indigo-600 hover:underline" href="/#company/${safeCompanySlug}">${safeCompany}</a>` : safeCompany}</span>` : ''}
          ${locationLine.trim() ? `<span class="px-3 py-1.5 rounded-full bg-slate-100" id="jobLocationLine"><strong>Location:</strong> ${escapeHtml(locationLine)}</span>` : ''}
        </div>
        <div class="prose mb-4">${safeDesc}</div>
        <details class="mb-4 border border-slate-200 rounded-xl p-4 bg-slate-50" open>
          <summary class="cursor-pointer text-sm text-slate-700 font-medium">Details & privacy</summary>
          <div class="mt-3 text-sm text-slate-600">
            ${CONFIG.JOB_COPY?.PRIVACY_NOTE_APPLY || 'Privacy note: Employers may contact you using the details you provide. If you choose to hide your email, they will only see your resume link.'}
          </div>
          ${data.meta ? `
            <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              ${Object.entries(data.meta)
                .map(([key, val]) => {
                  const formatted = formatMetaValue(key, val);
                  if (!formatted) return '';
                  return `
                    <div class="border border-slate-200 rounded-lg px-3 py-2 bg-white">
                      <div class="text-xs uppercase tracking-wide text-slate-500">${escapeHtml(key)}</div>
                      <div class="text-slate-800">${formatted}</div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          ` : ''}
        </details>
        <div class="mt-4 flex flex-wrap gap-3">
          <button id="submitAction" class="text-indigo-700 border border-indigo-300 px-4 py-2 rounded hover:border-indigo-500 hover:bg-indigo-50 transition">
            ${CONFIG.SUBMIT_LABEL}
          </button>
        </div>
      </div>

      <div class="mt-6 space-y-4">
        <div class="border rounded-2xl p-5 bg-white shadow-sm">
          <h2 class="text-lg font-semibold mb-2">${CONFIG.JOB_COPY?.MESSAGE_EMPLOYER_TITLE || 'Message the Employer'}</h2>
          <p class="text-xs text-gray-500 mb-3">This sends an email to the employer. Your email will be included as the reply-to.</p>
          ${isLoggedIn ? `
            <button id="openMessageModal" class="text-sm border border-indigo-300 text-indigo-700 px-3 py-1.5 rounded hover:border-indigo-500 hover:bg-indigo-50 transition">${CONFIG.JOB_COPY?.OPEN_CONTACT_FORM || 'Open contact form'}</button>
            <div id="messageModal" class="fixed inset-0 bg-black/40 hidden items-center justify-center z-50">
              <div class="bg-white rounded-lg shadow-lg w-full max-w-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-lg font-semibold">${CONFIG.JOB_COPY?.CONTACT_EMPLOYER_TITLE || 'Contact Employer'}</h3>
                  <button id="closeMessageModal" class="text-sm border border-gray-300 text-gray-600 px-2 py-1 rounded hover:bg-gray-50">${CONFIG.JOB_COPY?.CLOSE_LABEL || 'Close'}</button>
                </div>
                <form id="employerMessageForm" class="space-y-3">
                  <input type="text" name="name" class="w-full p-2 border rounded" placeholder="Your name" required />
                  <input type="email" name="email" class="w-full p-2 border rounded" placeholder="Your email" required />
                  <select id="applicantTemplate" class="w-full p-2 border rounded">
                    <option value="" selected>Quick template (optional)</option>
                  </select>
                  <textarea name="message" class="w-full p-2 border rounded" rows="4" placeholder="Your message" required></textarea>
                  <div id="turnstile-container" class="mt-2"></div>
                  <button type="submit" class="text-indigo-700 border border-indigo-300 px-4 py-2 rounded hover:border-indigo-500 hover:bg-indigo-50 transition">${CONFIG.JOB_COPY?.SEND_MESSAGE || 'Send Message'}</button>
                  <p id="employerMessageStatus" class="text-sm"></p>
                </form>
              </div>
            </div>
          ` : `
            <p class="text-sm text-gray-600">Please <a href="/#login" class="text-indigo-600 hover:underline">log in</a> to message this employer.</p>
          `}
        </div>
      </div>

      <div class="mt-6 text-xs text-gray-500 flex items-center justify-between">
        <a href="/#list" class="text-blue-600 hover:underline">← Back to List</a>
        <a class="text-blue-600 hover:underline" href="/#support?subject=Report%20Abuse&context=job:${id}">${CONFIG.JOB_COPY?.REPORT_ABUSE || 'Report abuse'}</a>
      </div>
    `;

    document.getElementById('submitAction')?.addEventListener('click', () => {
      window.location.hash = `#apply?id=${id}`;
    });

    applyDistance();

    const saveBtn = document.getElementById('saveJobBtn');
    const openModalBtn = document.getElementById('openMessageModal');
    const modalEl = document.getElementById('messageModal');
    const closeModalBtn = document.getElementById('closeMessageModal');
    if (openModalBtn && modalEl) {
      openModalBtn.addEventListener('click', () => {
        modalEl.classList.remove('hidden');
        modalEl.classList.add('flex');
      });
    }
    if (closeModalBtn && modalEl) {
      closeModalBtn.addEventListener('click', () => {
        modalEl.classList.add('hidden');
        modalEl.classList.remove('flex');
      });
    }
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          modalEl.classList.add('hidden');
          modalEl.classList.remove('flex');
        }
      });
    }
    if (saveBtn && isLoggedIn) {
      fetch('/wp-json/customapi/v1/saved-jobs', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          const saved = Array.isArray(data) && data.includes(Number(id));
          saveBtn.textContent = saved ? 'Saved' : 'Save';
          saveBtn.classList.toggle('text-amber-700', saved);
        })
        .catch(() => {});

      saveBtn.addEventListener('click', async () => {
        const res = await fetch('/wp-json/customapi/v1/saved-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ job_id: id }),
        });
        const data = await res.json();
        if (res.ok) {
          const saved = !!data.saved;
          saveBtn.textContent = saved ? 'Saved' : 'Save';
          saveBtn.classList.toggle('text-amber-700', saved);
        }
      });
    } else if (saveBtn) {
      saveBtn.textContent = 'Login to save';
      saveBtn.disabled = true;
      saveBtn.classList.add('opacity-60', 'cursor-not-allowed');
    }

    const messageForm = document.getElementById('employerMessageForm');
    const statusEl = document.getElementById('employerMessageStatus');
    const templateSelect = document.getElementById('applicantTemplate');
    let turnstileWidgetId = null;
    if (messageForm) {
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
      const turnstileContainer = document.getElementById('turnstile-container');
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
                sitekey: CONFIG.TURNSTILE_SITE_KEY,
                theme: 'light',
              });
            }
          };
          document.body.appendChild(script);
        } else if (CONFIG.TURNSTILE_SITE_KEY && turnstileContainer) {
          turnstileWidgetId = window.turnstile.render(turnstileContainer, {
            sitekey: CONFIG.TURNSTILE_SITE_KEY,
            theme: 'light',
          });
        }
      })();

      if (templateSelect) {
        const vars = {
          job_title: data.title || '',
          company: company || 'Employer',
          site_name: document.title || '',
          site_url: window.location.origin,
        };
        const replaceVars = (text) => {
          let out = text || '';
          Object.entries(vars).forEach(([key, val]) => {
            out = out.replaceAll(`{${key}}`, val);
          });
          return out;
        };

        fetch('/wp-json/customapi/v1/email-templates', { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            const templates = Array.isArray(data) ? data.filter(t => t.scope === 'applicant') : [];
            if (!templates.length) return;
            const groups = {};
            templates.forEach(t => {
              const cat = t.category || 'General';
              if (!groups[cat]) groups[cat] = [];
              groups[cat].push(t);
            });
            templateSelect.innerHTML = `<option value="" selected>Quick template (optional)</option>` + Object.entries(groups)
              .map(([cat, list]) => {
                const opts = list.map(t => `<option value="${t.body.replace(/"/g, '&quot;')}">${t.title}</option>`).join('');
                return `<optgroup label="${cat}">${opts}</optgroup>`;
              })
              .join('');
          })
          .catch(() => {});

        templateSelect.addEventListener('change', () => {
          const val = templateSelect.value || '';
          if (val) {
            const textarea = messageForm.querySelector('textarea[name="message"]');
            if (textarea) textarea.value = replaceVars(val);
          }
        });
      }

      messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusEl.textContent = 'Sending...';
        statusEl.className = 'text-sm text-gray-600';
        const formData = new FormData(messageForm);
        const payload = Object.fromEntries(formData.entries());
        const devFlags = await getDevFlags();
        if (!devFlags.dev_mode) {
          if (window.turnstile && turnstileWidgetId !== null) {
            payload.turnstile_token = window.turnstile.getResponse(turnstileWidgetId);
          }
          if (!payload.turnstile_token) {
            statusEl.textContent = 'Please complete the captcha.';
            statusEl.className = 'text-sm text-red-600';
            return;
          }
        }
        try {
          const res = await fetch('/wp-json/customapi/v1/contact-employer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ...payload, job_id: id }),
          });
          const data = await res.json();
          if (!res.ok) {
            statusEl.textContent = data.message || 'Failed to send message.';
            statusEl.className = 'text-sm text-red-600';
            return;
          }
          statusEl.textContent = CONFIG.JOB_COPY?.MESSAGE_SENT || 'Message sent.';
          statusEl.className = 'text-sm text-green-700';
          messageForm.reset();
          if (window.turnstile && turnstileWidgetId !== null) {
            window.turnstile.reset(turnstileWidgetId);
          }
        } catch (err) {
          statusEl.textContent = 'Failed to send message.';
          statusEl.className = 'text-sm text-red-600';
        }
      });
    }
    
  } catch (error) {
    container.innerHTML = `<p class="text-red-600">❌ Error: ${error.message}</p>`;
  }
}
