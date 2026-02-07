//home.js

import { CONFIG } from '../config.js';
import { getSessionCached } from '../utils/session.js';
export function renderHome(container) {
  const heroes = Array.isArray(CONFIG.HOME_HEROES) && CONFIG.HOME_HEROES.length
    ? CONFIG.HOME_HEROES
    : [
        {
          key: 'employers',
          title: 'Fewer distractions. Better hires.',
          lines: [
            'Built to reduce noise and improve applicant quality without penalizing great candidates.',
            'Smart matching that’s transparent — no black‑box AI.',
            'Privacy‑first: resumes and files are encrypted by default.',
          ],
          primary: { label: CONFIG.JOB_COPY?.POST_CTA || 'Post a job', href: '/#post', id: 'postCta' },
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
          primary: { label: CONFIG.JOB_COPY?.SEARCH_CTA || 'Search openings', href: '/#list' },
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
        background: linear-gradient(135deg, #ff5f9e 0%, #ffcc5c 35%, #3be6d0 70%, #5b7cff 100%);
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
      .reveal {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.6s ease, transform 0.6s ease;
      }
      .reveal.reveal-in {
        opacity: 1;
        transform: translateY(0);
      }
      .floaty {
        animation: floaty 6s ease-in-out infinite;
      }
      @keyframes floaty {
        0% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
        100% { transform: translateY(0); }
      }
    </style>
    <!-- Hero Section -->
    <div class="w-full px-4 py-10">
      <div class="home-hero bg-hero-fun relative overflow-hidden text-white rounded-2xl p-6 md:p-10 shadow w-full">
        <div class="home-blob one"></div>
        <div class="home-blob two"></div>
        <div class="absolute inset-0 bg-black/35 pointer-events-none"></div>
        <div class="relative z-10 text-shadow text-center max-w-5xl mx-auto">
          <h1 class="text-3xl md:text-5xl font-bold mb-3">${hero.title}</h1>
          ${heroLines}
          <div class="mt-6 flex gap-3 justify-center flex-wrap">
            <a ${hero.primary.id ? `id="${hero.primary.id}"` : ''} href="${hero.primary.href}" class="bg-white text-slate-900 font-semibold px-4 py-2 rounded-lg">${hero.primary.label}</a>
            <a href="${hero.secondary.href}" class="border border-white/70 text-white px-4 py-2 rounded-lg hover:bg-white/10">${hero.secondary.label}</a>
          </div>
        </div>
      </div>
    </div>

    <!-- What We Do Section -->
    <section class="bg-white text-gray-800 py-10 md:py-14 px-6 md:px-12">
      <div class="max-w-6xl mx-auto space-y-10">
        <div class="grid gap-8 md:grid-cols-[1.1fr,0.9fr] items-center reveal">
          <div>
            <div class="text-xs uppercase tracking-widest text-slate-500 mb-2">Employers</div>
            <h2 class="text-3xl md:text-4xl font-bold mb-3">Post roles and manage applicants with clarity.</h2>
            <p class="text-gray-600 text-lg mb-4">
              Publish ${CONFIG.COMPANY_BUSINESS_THING_PLURAL} quickly, track candidates, and surface stronger matches without
              noisy ad clutter.
            </p>
            <a href="/#employers" class="text-indigo-600 font-semibold hover:underline">See employer tools →</a>
          </div>
          <div class="rounded-2xl border shadow-sm p-6 bg-gradient-to-br from-slate-50 via-white to-amber-50">
            <div class="text-sm font-semibold text-gray-700 mb-2">Employer dashboard</div>
            <ul class="text-sm text-gray-600 space-y-2">
              <li>• Post & manage openings</li>
              <li>• Applicant ranking & filtering</li>
              <li>• Verified company controls</li>
            </ul>
          </div>
        </div>

        <div class="grid gap-8 md:grid-cols-[0.9fr,1.1fr] items-center reveal">
          <div class="rounded-2xl border shadow-sm p-6 bg-gradient-to-br from-emerald-50 via-white to-slate-50">
            <div class="text-sm font-semibold text-gray-700 mb-2">Job seeker flow</div>
            <ul class="text-sm text-gray-600 space-y-2">
              <li>• Apply once, reuse resume</li>
              <li>• Save searches & jobs</li>
              <li>• Email privacy controls</li>
            </ul>
          </div>
          <div>
            <div class="text-xs uppercase tracking-widest text-slate-500 mb-2">Job seekers</div>
            <h2 class="text-3xl md:text-4xl font-bold mb-3">Find real work without the spam.</h2>
            <p class="text-gray-600 text-lg mb-4">
              Search and apply to ${CONFIG.COMPANY_BUSINESS_THING_PLURAL} fast. No ads, no tracking, and your privacy stays in your control.
            </p>
            <a href="/#employees" class="text-indigo-600 font-semibold hover:underline">See privacy & safety →</a>
          </div>
        </div>

        <div class="grid gap-8 md:grid-cols-[1.1fr,0.9fr] items-center reveal">
          <div>
            <div class="text-xs uppercase tracking-widest text-slate-500 mb-2">Speed</div>
            <h2 class="text-3xl md:text-4xl font-bold mb-3">Fast pages with secure data handling.</h2>
            <p class="text-gray-600 text-lg mb-4">
              Lightweight front‑end, smart caching, and encryption that only unlocks when needed.
            </p>
            <a href="/#speed" class="text-indigo-600 font-semibold hover:underline">See how it stays fast →</a>
          </div>
          <div class="rounded-2xl border shadow-sm p-6 bg-gradient-to-br from-indigo-50 via-white to-rose-50">
            <div class="text-sm font-semibold text-gray-700 mb-2">Performance stack</div>
            <ul class="text-sm text-gray-600 space-y-2">
              <li>• Decrypt on demand</li>
              <li>• Cache for speed</li>
              <li>• Vanilla JS front end</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-slate-50 text-gray-900 py-16 px-6 md:px-12">
      <div class="max-w-6xl mx-auto reveal">
        <div class="grid gap-8 md:grid-cols-[1.1fr,0.9fr] items-center">
          <div>
            <div class="text-xs uppercase tracking-widest text-pink-600 mb-2">Multi‑search</div>
            <h2 class="text-3xl md:text-4xl font-bold mb-3">Search by multiple terms at once.</h2>
            <p class="text-gray-600 text-lg mb-4">
              Combine terms like “React, API, Remote” and we rank results by how many terms match. Find the right fit faster
              without endless scrolling.
            </p>
            <a href="/#list" class="text-indigo-600 font-semibold hover:underline">Try multi‑search →</a>
          </div>
          <div class="rounded-2xl bg-white border shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div class="text-sm font-semibold text-gray-700">Match score</div>
              <span class="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">3/3 terms</span>
            </div>
            <div class="mt-4 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span>React</span>
                <div class="h-2 flex-1 mx-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-2 w-4/5 bg-pink-400"></div>
                </div>
                <span class="text-gray-500">80%</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span>API</span>
                <div class="h-2 flex-1 mx-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-2 w-3/4 bg-indigo-400"></div>
                </div>
                <span class="text-gray-500">75%</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span>Remote</span>
                <div class="h-2 flex-1 mx-3 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-2 w-2/3 bg-amber-400"></div>
                </div>
                <span class="text-gray-500">66%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white text-gray-900 py-12 md:py-16 px-6 md:px-12">
      <div class="max-w-6xl mx-auto reveal">
        <div class="grid gap-8 md:grid-cols-[0.9fr,1.1fr] items-center">
          <div class="rounded-2xl border shadow-sm p-6 bg-gradient-to-br from-amber-50 via-white to-rose-50">
            <div class="flex items-center gap-3 mb-4">
              <div class="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center floaty">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path d="M12 6v6l4 2"/>
                  <path d="M5 12a7 7 0 1 1 7 7"/>
                </svg>
              </div>
              <div class="text-sm text-gray-600">Smart matching engine</div>
            </div>
            <div class="text-sm text-gray-600">Resumes are scored against job descriptions with keyword relevance.</div>
            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="p-3 rounded-lg bg-white border">Top skills matched</div>
              <div class="p-3 rounded-lg bg-white border">Experience alignment</div>
              <div class="p-3 rounded-lg bg-white border">Keyword density</div>
              <div class="p-3 rounded-lg bg-white border">Role relevance</div>
            </div>
          </div>
          <div>
            <div class="text-xs uppercase tracking-widest text-amber-600 mb-2">Smart matching</div>
            <h2 class="text-3xl md:text-4xl font-bold mb-3">Surface stronger candidates faster.</h2>
            <p class="text-gray-600 text-lg mb-4">
              We compare resume text and job descriptions to rank applicants by relevance. Transparent scoring — no black‑box
              hype.
            </p>
            <a href="/#employers" class="text-indigo-600 font-semibold hover:underline">See matching tools →</a>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-slate-50 text-gray-900 py-16 px-6 md:px-12">
      <div class="max-w-6xl mx-auto reveal">
        <div class="grid gap-8 md:grid-cols-[1.1fr,0.9fr] items-center">
          <div>
            <div class="text-xs uppercase tracking-widest text-[rgb(0_64_110)] mb-2">Privacy controls</div>
            <h2 class="text-3xl md:text-4xl font-bold mb-3">Keep control of your data.</h2>
            <p class="text-gray-600 text-lg mb-4">
              Hide your email, share resume links only, and keep sensitive info encrypted by default. You decide what’s shared.
            </p>
            <a href="/#employees" class="text-indigo-600 font-semibold hover:underline">Privacy details →</a>
          </div>
          <div class="rounded-2xl border shadow-sm p-6 bg-white">
            <div class="flex items-center gap-3 mb-4">
            <div class="h-12 w-12 rounded-xl bg-emerald-100 text-[rgb(0_64_110)] flex items-center justify-center floaty">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"/>
                </svg>
              </div>
              <div class="text-sm text-gray-600">Privacy settings</div>
            </div>
            <div class="space-y-3 text-sm text-gray-600">
              <div class="flex items-center justify-between">
                <span>Show email to employers</span>
                <span class="text-[rgb(0_64_110)] font-semibold">Off</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Resume link access</span>
                <span class="text-[rgb(0_64_110)] font-semibold">On</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Encrypted profile data</span>
                <span class="text-[rgb(0_64_110)] font-semibold">On</span>
              </div>
            </div>
          </div>
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
        { label: CONFIG.JOB_COPY?.POST_CTA || 'Post a job', href: '/#post' },
        { label: 'Manage openings', href: '/#myJobPosts' },
        { label: 'Browse listings', href: '/#list' },
      ];
      listTitle = 'Your latest openings';
      listEmpty = 'No openings yet. Post your first job to get started.';
      listEndpoint = '/wp-json/customapi/v1/user-jobs';
    } else {
      actions = [
        { label: CONFIG.JOB_COPY?.SEARCH_CTA || 'Search openings', href: '/#list' },
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

  const revealEls = container.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    revealEls.forEach(el => observer.observe(el));
  }

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
