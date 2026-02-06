//home.js

import { CONFIG } from '../config.js';
import { getSessionCached } from '../utils/session.js';
export function renderHome(container) {
  const heroes = [
    {
      key: 'employers',
      title: 'Fewer distractions. Better hires.',
      lines: [
        'Built to reduce noise and improve applicant quality without penalizing great candidates.',
        'Smart matching that’s transparent — no black‑box AI.',
        'Privacy‑first: resumes and files are encrypted by default.',
      ],
      primary: { label: 'Post a job', href: '/#post', id: 'postCta' },
      secondary: { label: 'Browse listings', href: '/#list' },
    },
    {
      key: 'employees',
      title: 'Find real work faster.',
      lines: [
        `Search ${CONFIG.COMPANY_BUSINESS_THING_PLURAL} without spam or tracking.`,
        'Apply once, reuse your resume, and control what employers see.',
        'Encrypted by default for safer, cleaner hiring.',
      ],
      primary: { label: 'Search openings', href: '/#list' },
      secondary: { label: 'How privacy works', href: '/#employees' },
    },
    {
      key: 'speed',
      title: 'Encrypted. Still lightning‑fast.',
      lines: [
        'Decryption happens only when needed, then we cache for speed.',
        'Lightweight front end keeps load times low.',
        'Security without the slowdown.',
      ],
      primary: { label: 'See speed details', href: '/#speed' },
      secondary: { label: 'Browse listings', href: '/#list' },
    },
    {
      key: 'multisearch',
      title: 'Multi‑search that actually helps.',
      lines: [
        'Search by multiple terms at once to surface better matches.',
        'Results are ranked by how many terms they match.',
        'Find the right fit without endless scrolling.',
      ],
      primary: { label: 'Try multi‑search', href: '/#list' },
      secondary: { label: 'Employer tools', href: '/#employers' },
    },
  ];

  const hero = heroes[Math.floor(Math.random() * heroes.length)];
  const heroLines = hero.lines.map(line => `<p class="text-white/90 text-sm mt-2">${line}</p>`).join('');

  container.innerHTML = `
    <style>
      .home-hero {
        position: relative;
        overflow: hidden;
      }
      .bg-hero-fun {
        background: linear-gradient(135deg, #ff4d8d 0%, #ffb347 35%, #5cffd1 70%, #5b7cff 100%);
        background-size: 200% 200%;
        animation: heroShift 12s ease infinite;
      }
      .home-blob {
        position: absolute;
        border-radius: 999px;
        filter: blur(20px);
        opacity: 0.35;
        mix-blend-mode: screen;
      }

      .home-blob.one {
        width: 320px;
        height: 320px;
        background: #ff7ab6;
        top: -120px;
        left: -80px;
      }

      .home-blob.two {
        width: 360px;
        height: 360px;
        background: #60a5fa;
        bottom: -160px;
        right: -120px;
      }
      @keyframes heroShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .text-shadow {
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
      }
    </style>
    <!-- Hero Section -->
    <div class="max-w-5xl mx-auto px-4 py-10">
      <div class="home-hero bg-hero-fun relative overflow-hidden text-white rounded-2xl p-6 md:p-8 shadow">
        <div class="home-blob one"></div>
        <div class="home-blob two"></div>
        <div class="absolute inset-0 bg-black/35 pointer-events-none"></div>
        <div class="relative z-10 text-shadow text-center">
          <h1 class="text-3xl md:text-4xl font-bold mb-3">${hero.title}</h1>
          ${heroLines}
          <div class="mt-5 flex gap-3 justify-center">
            <a ${hero.primary.id ? `id="${hero.primary.id}"` : ''} href="${hero.primary.href}" class="bg-white text-slate-900 font-semibold px-4 py-2 rounded-lg">${hero.primary.label}</a>
            <a href="${hero.secondary.href}" class="border border-white/70 text-white px-4 py-2 rounded-lg hover:bg-white/10">${hero.secondary.label}</a>
          </div>
        </div>
      </div>
    </div>

    <!-- What We Do Section -->
    <section class="bg-white text-gray-800 py-16 px-6 md:px-12">
      <h2 class="text-4xl font-bold text-center mb-12">What We Do</h2>
      <div class="max-w-6xl mx-auto grid gap-12 md:grid-cols-3 text-center">
        <div class="p-6 shadow-md rounded-2xl hover:shadow-xl transition flex flex-col h-full">
          <div class="mx-auto h-8 w-8 text-indigo-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M6 7V3h12v4M6 7h12M6 7l-1 14h14l-1-14M6 7h12M9 11h6m-6 4h6" />
            </svg>
          </div>
          <h3 class="text-2xl font-semibold mb-2">For Employers</h3>
          <p class="text-gray-600 mb-3">Post ${CONFIG.COMPANY_BUSINESS_THING_PLURAL} quickly, track applicants, and surface stronger matches with smart resume scanning.</p>
          <a href="/#employers" class="text-indigo-600 text-sm hover:underline mt-auto">See employer tools →</a>
        </div>
        <div class="p-6 shadow-md rounded-2xl hover:shadow-xl transition flex flex-col h-full">
          <div class="mx-auto h-8 w-8 text-indigo-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h3 class="text-2xl font-semibold mb-2">For Job Seekers</h3>
          <p class="text-gray-600 mb-3">Search and apply to ${CONFIG.COMPANY_BUSINESS_THING} easily. No ads, no spam. Just real opportunities.</p>
          <a href="/#employees" class="text-indigo-600 text-sm hover:underline mt-auto">See privacy & safety →</a>
        </div>
        <div class="p-6 shadow-md rounded-2xl hover:shadow-xl transition flex flex-col h-full">
          <div class="mx-auto h-8 w-8 text-indigo-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 class="text-2xl font-semibold mb-2">Built for Speed</h3>
          <p class="text-gray-600 mb-3">Lightning‑fast pages with smart caching and a lightweight front end.</p>
          <a href="/#speed" class="text-indigo-600 text-sm hover:underline mt-auto">See how it stays fast →</a>
        </div>
      </div>
    </section>

    <section class="bg-white text-gray-900 py-12 px-6 md:px-12">
      <div class="max-w-4xl mx-auto border rounded-2xl p-6 md:p-8 shadow-sm bg-gradient-to-r from-pink-50 via-white to-amber-50">
        <div class="text-xs uppercase tracking-widest text-pink-600 mb-2">Founding Employer</div>
        <h3 class="text-2xl md:text-3xl font-bold mb-2">Lock in founder pricing</h3>
        <p class="text-gray-700 mb-4">
          We’re opening early access to the first 10 companies. Founding employers lock in a discounted rate forever and
          get priority placement, verified badges, and direct founder support.
        </p>
        <div class="flex flex-wrap gap-3">
          <a href="/#support?subject=Founding%20Employer&context=home" class="bg-pink-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-pink-700">
            Apply for founding access
          </a>
          <span class="text-sm text-gray-600 self-center">Early access: $49/month (regular $99)</span>
        </div>
      </div>
    </section>
  `;

  const postCta = container.querySelector('#postCta');
  getSessionCached({ maxAgeMs: 30000 })
    .then(session => {
      const roles = Array.isArray(session?.roles) ? session.roles : [];
      if (postCta && roles.includes('employer')) {
        postCta.style.display = 'inline-block';
      } else if (postCta) {
        postCta.style.display = 'none';
      }
    })
    .catch(() => {});

  
}
