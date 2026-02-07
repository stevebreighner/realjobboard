import { escapeHtml, safeImageUrl } from '../utils/sanitize.js';
import { CONFIG } from '../config.js';

export async function renderCompany(container, slug) {
  if (!slug) {
    container.innerHTML = '<p class="text-sm text-gray-600">Missing company.</p>';
    return;
  }

  container.innerHTML = '<p class="text-sm text-gray-600">Loading company...</p>';
  try {
    const res = await fetch(`/api/company?slug=${encodeURIComponent(slug)}`);
    const data = await res.json();
    if (!res.ok) {
      container.innerHTML = `<p class="text-sm text-red-600">${data.error || 'Company not found'}</p>`;
      return;
    }
    const company = data.company || {};
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    const logo = safeImageUrl(company.logo_url || '');
    const address = [company.street1, company.street2, company.city, company.state, company.zip, company.country]
      .filter(Boolean)
      .map(escapeHtml)
      .join(', ');
    const label = CONFIG.COMPANY_ENTITY_LABEL || 'Company page';

    container.innerHTML = `
      <div class="max-w-5xl mx-auto px-4">
        <div class="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          ${logo ? `<img src="${logo}" alt="${escapeHtml(company.name || '')} logo" class="h-16 w-16 rounded-lg object-contain border bg-white" />` : ''}
          <div>
            <div class="text-xs uppercase tracking-wide text-slate-500">${escapeHtml(label)}</div>
            <h1 class="text-2xl font-bold">${escapeHtml(company.name || 'Company')}</h1>
            ${address ? `<p class="text-sm text-gray-600 mt-1">${address}</p>` : ''}
            ${Number(company.verified) === 1 ? `<span class="inline-flex items-center mt-2 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Verified</span>` : ''}
          </div>
        </div>

        <h2 class="text-lg font-semibold mb-3">Open Roles</h2>
        <div class="grid gap-4 md:grid-cols-2">
          ${jobs.length ? jobs.map(job => `
            <a href="/#list-detail?id=${job.id}" class="border rounded-lg p-4 bg-white hover:shadow transition block">
              <div class="text-lg font-medium text-slate-900">${escapeHtml(job.title || '')}</div>
              ${job.meta?.field ? `<div class="text-sm text-slate-600 mt-1">${escapeHtml(job.meta.field)}</div>` : ''}
              ${job.meta?.city || job.meta?.state ? `<div class="text-xs text-slate-500 mt-2">${escapeHtml([job.meta?.city, job.meta?.state].filter(Boolean).join(', '))}</div>` : ''}
            </a>
          `).join('') : '<p class="text-sm text-gray-600">No open roles yet.</p>'}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = '<p class="text-sm text-red-600">Failed to load company.</p>';
  }
}
