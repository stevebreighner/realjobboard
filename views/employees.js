import { CONFIG } from '../config.js';

export function renderEmployees(container) {
  const copy = CONFIG.EMPLOYEES_PAGE || {};
  const cards = Array.isArray(copy.cards) ? copy.cards : [];
  container.innerHTML = `
    <style>
      .hero-blue {
        background: linear-gradient(135deg, #0b5fa5 0%, #1e78d9 60%, #3aa0ff 100%);
      }
      .text-shadow {
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
      }
    </style>
    <div class="max-w-5xl mx-auto px-4 py-10">
      <div class="relative overflow-hidden text-white rounded-2xl p-6 md:p-8 mb-8 shadow hero-blue">
        <div class="absolute inset-0 bg-black/20 pointer-events-none"></div>
        <div class="relative z-10 text-shadow">
          <div class="text-xs uppercase tracking-widest text-white/80 mb-2">${copy.heroEyebrow || 'Job Seekers'}</div>
          <h1 class="text-3xl md:text-4xl font-bold mb-3">${copy.heroTitle || 'Privacy that feels human.'}</h1>
          <p class="text-white/95">
            ${copy.heroSubtitle || 'Apply with confidence knowing your data stays protected.'}
          </p>
          ${copy.heroSubline ? `<p class="text-white/85 text-sm mt-2">${copy.heroSubline}</p>` : ''}
          <div class="mt-5 flex gap-3">
            <a href="/#list" class="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-lg">${copy.ctaPrimary || 'Browse jobs'}</a>
            <a href="/#profile" class="border border-white/70 text-white px-4 py-2 rounded-lg hover:bg-white/10">${copy.ctaSecondary || 'Manage profile'}</a>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${cards.map(card => `
          <div class="border rounded-xl p-5 bg-white shadow-sm">
            <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">${card.eyebrow || ''}</div>
            <h2 class="text-xl font-semibold mb-2">${card.title || ''}</h2>
            <p class="text-gray-700">${card.body || ''}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
