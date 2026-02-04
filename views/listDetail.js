import { CONFIG } from '../config.js';

export async function renderListDetail(container, id) {
  try {
    const response = await fetch(`/wp-json/customapi/v1/get-list-detail?id=${id}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Failed to fetch post');

    const formatMetaValue = (key, val) => {
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

    const company = data.meta?.company || '';
    const companySite = data.meta?.company_site || '';
    const rateType = data.meta?.rate_type || '';
    const rateMin = data.meta?.rate_min || '';
    const rateMax = data.meta?.rate_max || '';

    container.innerHTML = `
      <h1 class="text-2xl font-bold mb-4">${data.title}</h1>
      <p class="text-gray-600 text-sm mb-2">Posted by ${data.author} on ${data.date}</p>
      ${(rateType || rateMin || rateMax) ? `
        <p class="text-sm text-gray-700 mb-2"><strong>Rate:</strong> ${rateMin || ''}${rateMax ? `–${rateMax}` : ''} ${rateType || ''}</p>
      ` : ''}
      ${company || companySite ? `
        <p class="text-sm text-gray-700 mb-2">
          <strong>Company:</strong> ${company || ' '}
          ${companySite ? `<a href="${companySite}" class="text-indigo-600 hover:underline ml-1" target="_blank" rel="noopener">Website</a>` : ''}
        </p>
      ` : ''}
      <div class="prose mb-4">${data.description}</div>
      <div class="mb-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
        Privacy note: Employers may contact you using the details you provide. If you choose to hide your email, they will only see your resume link.
        <a class="text-blue-600 hover:underline ml-2" href="/#support?subject=Report%20Abuse&context=job:${id}">Report abuse</a>
      </div>

      ${data.meta ? Object.entries(data.meta).map(([key, val]) =>
        `<div class="mb-1"><strong>${key}:</strong> ${formatMetaValue(key, val)}</div>`
      ).join('') : ''}

      <button id="submitAction" class="mt-6 text-purple px-4 py-2 rounded hover:bg-indigo-700 transition">
        ${CONFIG.SUBMIT_LABEL}
      </button>

      <p class="mt-4"><a href="/#list" class="text-blue-600 hover:underline">← Back to List</a></p>
    `;

    document.getElementById('submitAction')?.addEventListener('click', () => {
      window.location.hash = `#apply?id=${id}`;
    });
    
  } catch (error) {
    container.innerHTML = `<p class="text-red-600">❌ Error: ${error.message}</p>`;
  }
}
