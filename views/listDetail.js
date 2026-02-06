import { CONFIG } from '../config.js';
import { getSessionCached } from '../utils/session.js';

export async function renderListDetail(container, id) {
  try {
    const response = await fetch(`/wp-json/customapi/v1/get-list-detail?id=${id}`);
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
                    <div class="text-sm text-gray-700">Applicant ID: ${app.user_id}${dateLabel}</div>
                    <div class="text-sm">
                      <a href="${app.resume}" class="text-indigo-600 hover:underline" target="_blank" rel="noopener">Resume</a>
                      ${app.cover_letter ? ` • <a href="${app.cover_letter}" class="text-indigo-600 hover:underline" target="_blank" rel="noopener">Cover Letter</a>` : ''}
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        `;
      }
      return val;
    };

    const rawCompany = data.meta?.company || '';
    const company = rawCompany && rawCompany.includes('@') ? '' : rawCompany;
    const companySite = data.meta?.company_site || '';
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

    const formatRate = () => {
      if (!rateType && !rateMin && !rateMax) return '';
      const range = `${rateMin || ''}${rateMax ? `–${rateMax}` : ''}`.trim();
      const typeLabel = rateType ? rateType.charAt(0).toUpperCase() + rateType.slice(1) : '';
      return `${range}${typeLabel ? ` ${typeLabel}` : ''}`.trim();
    };

    const session = await getSessionCached({ maxAgeMs: 30000 });
    const isLoggedIn = !!session;

    container.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-2xl font-bold">${data.title}</h1>
        ${isFeatured ? `<span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Featured</span>` : ''}
      </div>
      <p class="text-gray-600 text-sm mb-2">
        ${company ? `Posted by ${company}` : 'Posted by Employer'} on ${data.date}
      </p>
      ${formatRate() ? `
        <p class="text-sm text-gray-700 mb-2"><strong>Rate:</strong> ${formatRate()}</p>
      ` : ''}
      ${company || companySite ? `
        <p class="text-sm text-gray-700 mb-2">
          <strong>Company:</strong> ${company || ' '}
          ${companySite ? `<a href="${companySite}" class="text-indigo-600 hover:underline ml-1" target="_blank" rel="noopener">Website</a>` : ''}
        </p>
      ` : ''}
      ${locationLine.trim() ? `
        <p class="text-sm text-gray-700 mb-2"><strong>Location:</strong> ${locationLine}</p>
      ` : ''}
      <div class="prose mb-4">${data.description}</div>
      <div class="mb-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
        Privacy note: Employers may contact you using the details you provide. If you choose to hide your email, they will only see your resume link.
        <a class="text-blue-600 hover:underline ml-2" href="/#support?subject=Report%20Abuse&context=job:${id}">Report abuse</a>
      </div>

      ${data.meta ? Object.entries(data.meta)
        .map(([key, val]) => {
          const formatted = formatMetaValue(key, val);
          if (!formatted) return '';
          return `<div class="mb-1"><strong>${key}:</strong> ${formatted}</div>`;
        })
        .join('') : ''}

      <div class="mt-6 space-y-4">
        <button id="submitAction" class="text-purple px-4 py-2 rounded hover:bg-indigo-700 transition">
          ${CONFIG.SUBMIT_LABEL}
        </button>
        <div class="border rounded p-4 bg-white">
          <h2 class="text-lg font-semibold mb-2">Message the Employer</h2>
          <p class="text-xs text-gray-500 mb-3">This sends an email to the employer. Your email will be included as the reply-to.</p>
          ${isLoggedIn ? `
            <form id="employerMessageForm" class="space-y-3">
              <input type="text" name="name" class="w-full p-2 border rounded" placeholder="Your name" required />
              <input type="email" name="email" class="w-full p-2 border rounded" placeholder="Your email" required />
              <select id="applicantTemplate" class="w-full p-2 border rounded">
                <option value="" selected>Quick template (optional)</option>
              </select>
              <textarea name="message" class="w-full p-2 border rounded" rows="4" placeholder="Your message" required></textarea>
              <div id="turnstile-container" class="mt-2"></div>
              <button type="submit" class="text-purple px-4 py-2 rounded">Send Message</button>
              <p id="employerMessageStatus" class="text-sm"></p>
            </form>
          ` : `
            <p class="text-sm text-gray-600">Please <a href="/#login" class="text-indigo-600 hover:underline">log in</a> to message this employer.</p>
          `}
        </div>
      </div>

      <p class="mt-4"><a href="/#list" class="text-blue-600 hover:underline">← Back to List</a></p>
    `;

    document.getElementById('submitAction')?.addEventListener('click', () => {
      window.location.hash = `#apply?id=${id}`;
    });

    const messageForm = document.getElementById('employerMessageForm');
    const statusEl = document.getElementById('employerMessageStatus');
    const templateSelect = document.getElementById('applicantTemplate');
    let turnstileWidgetId = null;
    if (messageForm) {
      const turnstileContainer = document.getElementById('turnstile-container');
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

      messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        statusEl.textContent = 'Sending...';
        statusEl.className = 'text-sm text-gray-600';
        const formData = new FormData(messageForm);
        const payload = Object.fromEntries(formData.entries());
        if (window.turnstile && turnstileWidgetId !== null) {
          payload.turnstile_token = window.turnstile.getResponse(turnstileWidgetId);
        }
        if (!payload.turnstile_token) {
          statusEl.textContent = 'Please complete the captcha.';
          statusEl.className = 'text-sm text-red-600';
          return;
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
          statusEl.textContent = 'Message sent.';
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
