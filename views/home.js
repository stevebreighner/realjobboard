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

  const loggedOutHtml = `
    <style>
      .home-hero {
        position: relative;
        overflow: hidden;
      }
      .bg-hero-fun {
        background: linear-gradient(135deg, #f472b6 0%, #fb7185 30%, #f9a8d4 60%, #fbcfe8 100%);
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

  function renderLoggedInHome(session) {
    const roles = Array.isArray(session?.roles) ? session.roles : [];
    const username = session?.username || 'there';
    const isEmployer = roles.includes('employer');
    const isAdmin = roles.includes('site_admin') || roles.includes('administrator');

    let actions = [];
    let listTitle = 'Recent activity';
    let listEmpty = 'No recent activity yet.';
    let listEndpoint = null;

    if (isAdmin) {
      actions = [
        { label: 'Admin panel', href: '/#admin' },
        { label: 'View jobs', href: '/#admin' },
        { label: 'Update profile', href: '/#profile' },
      ];
      listTitle = 'Admin overview';
      listEmpty = 'Use the Admin panel to manage users, jobs, and templates.';
    } else if (isEmployer) {
      actions = [
        { label: 'Post a job', href: '/#post' },
        { label: 'Manage openings', href: '/#myJobPosts' },
        { label: 'Browse listings', href: '/#list' },
      ];
      listTitle = 'Your latest openings';
      listEmpty = 'No openings yet. Post your first job to get started.';
      listEndpoint = '/wp-json/customapi/v1/user-jobs';
    } else {
      actions = [
        { label: 'Search openings', href: '/#list' },
        { label: 'My applications', href: '/#myApplications' },
        { label: 'Update profile', href: '/#profile' },
      ];
      listTitle = 'Your latest applications';
      listEmpty = 'No applications yet. Start browsing to apply.';
      listEndpoint = '/wp-json/customapi/v1/user-applications';
    }

    container.innerHTML = `
      <div class="max-w-5xl mx-auto px-4 py-10">
        <div class="rounded-2xl border shadow-sm bg-white p-6 md:p-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div class="text-xs uppercase tracking-widest text-gray-500">Welcome back</div>
              <h1 class="text-3xl font-semibold text-gray-900">Hi ${username}</h1>
              <p class="text-sm text-gray-600 mt-1">Your home base for everything ${CONFIG.COMPANY_BUSINESS_THING_PLURAL}.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              ${actions.map(a => `
                <a href="${a.href}" class="bg-purple text-white font-semibold px-4 py-2 rounded-lg">
                  ${a.label}
                </a>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="mt-8">
          <h2 class="text-xl font-semibold mb-3">${listTitle}</h2>
          <div id="homeRecentList" class="space-y-3"></div>
        </div>
      </div>
    `;

    const listEl = container.querySelector('#homeRecentList');
    if (!listEl) return;

    if (!listEndpoint) {
      listEl.innerHTML = `<div class="text-sm text-gray-600">${listEmpty}</div>`;
      return;
    }

    listEl.innerHTML = `<div class="text-sm text-gray-500">Loading...</div>`;
    fetch(`${listEndpoint}?_=${Date.now()}`, { credentials: 'include' })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !Array.isArray(data) || !data.length) {
          listEl.innerHTML = `<div class="text-sm text-gray-600">${listEmpty}</div>`;
          return;
        }
        const items = data.slice(0, 3);
        if (isEmployer) {
          listEl.innerHTML = items.map(job => `
            <div class="border rounded-lg p-4 bg-white shadow-sm">
              <div class="font-semibold text-gray-900">${job.title || 'Untitled role'}</div>
              <div class="text-xs text-gray-500 mt-1">${job.date || ''}</div>
              <a class="text-sm text-indigo-600 hover:underline mt-2 inline-block" href="/#myJobPosts">Manage openings →</a>
            </div>
          `).join('');
        } else {
          listEl.innerHTML = items.map(app => `
            <div class="border rounded-lg p-4 bg-white shadow-sm">
              <div class="font-semibold text-gray-900">${app.job_title || 'Untitled role'}</div>
              <div class="text-xs text-gray-500 mt-1">${[app.company, app.location].filter(Boolean).join(' • ')}</div>
              <div class="text-xs text-gray-600 mt-1">Status: ${app.status || 'new'}</div>
              <a class="text-sm text-indigo-600 hover:underline mt-2 inline-block" href="/#myApplications">View applications →</a>
            </div>
          `).join('');
        }
      })
      .catch(() => {
        listEl.innerHTML = `<div class="text-sm text-gray-600">${listEmpty}</div>`;
      });
  }

  container.innerHTML = loggedOutHtml;

  const postCta = container.querySelector('#postCta');
  getSessionCached({ maxAgeMs: 30000 })
    .then(session => {
      if (session) {
        renderLoggedInHome(session);
        return;
      }
      const roles = Array.isArray(session?.roles) ? session.roles : [];
      if (postCta && roles.includes('employer')) {
        postCta.style.display = 'inline-block';
      } else if (postCta) {
        postCta.style.display = 'none';
      }
    })
    .catch(() => {});

  
}
