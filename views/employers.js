import { CONFIG } from '../config.js';

export function renderEmployers(container) {
  const copy = CONFIG.EMPLOYERS_PAGE || {};
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
          <h1 class="text-3xl md:text-4xl font-bold mb-3">${copy.heroTitle || 'Employer control, without the noise.'}</h1>
          <p class="text-white/95">
            ${copy.heroSubtitle || 'Verify your company, filter applicants fast, and keep listings focused.'}
          </p>
          <p class="text-white/85 text-sm mt-2">
            ${copy.heroSubline || 'Priority placement and transparent matching — no black‑box promises.'}
          </p>
          <div class="mt-5 flex gap-3">
            <a href="/#post" class="bg-white text-slate-900 font-semibold px-4 py-2 rounded-lg">${copy.ctaPrimary || 'Post a job'}</a>
            <a href="/#my-job-posts" class="border border-white/70 text-white px-4 py-2 rounded-lg hover:bg-white/10">${copy.ctaSecondary || 'Manage openings'}</a>
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

      <div class="mt-10 border rounded-2xl p-6 md:p-8 shadow-sm bg-gradient-to-r from-pink-50 via-white to-amber-50">
        <div class="text-xs uppercase tracking-widest text-pink-600 mb-2">${copy.founder?.eyebrow || 'Founding Employer'}</div>
        <h2 class="text-2xl font-bold mb-2">${copy.founder?.title || 'Lock in founder pricing'}</h2>
        <p class="text-gray-700 mb-4">${copy.founder?.body || ''}</p>
        <div class="flex flex-wrap gap-3">
          <a href="/#support?subject=Founding%20Employer&context=employers" class="bg-pink-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-pink-700">
            ${copy.founder?.ctaLabel || 'Apply for founding access'}
          </a>
          <span class="text-sm text-gray-600 self-center">${copy.founder?.ctaNote || 'Early access: $49/month (regular $99)'}</span>
        </div>
      </div>
    </div>
  `;
}
