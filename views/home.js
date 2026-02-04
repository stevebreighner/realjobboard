//home.js

import { CONFIG } from '../config.js';
import { getSessionCached } from '../utils/session.js';
export function renderHome(container) {
  container.innerHTML = `
    <style>
      .home-hero {
        background-image:
          linear-gradient(135deg, rgba(16, 12, 32, 0.75) 0%, rgba(16, 12, 32, 0.45) 50%, rgba(16, 12, 32, 0.75) 100%),
          url('/views/jobboard.webp');
        background-size: cover;
        background-position: center top;
        position: relative;
        overflow: hidden;
      }
      .home-hero::after {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: grayscale(1) contrast(0.9) brightness(0.95);
        -webkit-backdrop-filter: grayscale(1) contrast(0.9) brightness(0.95);
        mix-blend-mode: luminosity;
        pointer-events: none;
      }

      @media (min-width: 1024px) {
        .home-hero {
          background-position: center 30%;
        }
      }

      .home-blob {
        position: absolute;
        border-radius: 999px;
        filter: blur(20px);
        opacity: 0.45;
        mix-blend-mode: screen;
      }

      .home-blob.one {
        width: 360px;
        height: 360px;
        background: #ff7ab6;
        top: -120px;
        left: -80px;
      }

      .home-blob.two {
        width: 420px;
        height: 420px;
        background: #60a5fa;
        bottom: -160px;
        right: -120px;
      }
    </style>
    <!-- Hero Section -->
    <div class="home-hero relative flex flex-col items-center justify-center text-center min-h-screen text-white p-8 bg-no-repeat">
      <div class="home-blob one"></div>
      <div class="home-blob two"></div>
      <div class="absolute inset-0 bg-black/35"></div>
      <div class="relative z-10">
        <h1 class="text-4xl md:text-6xl font-bold mb-4">Welcome to ${CONFIG.COMPANY_NAME}</h1>
        <p class="text-xl md:text-2xl mb-3">Privacy focused Job Search for finding the best talent and getting hired.</p>
        <p class="text-base md:text-lg text-white/90 mb-2">Your data stays private — resumes and files are encrypted by default.</p>
        <p class="text-sm md:text-base text-white/80 mb-2">Sensitive documents are encrypted and only decrypted when you load them.</p>
        <p class="text-sm md:text-base text-white/80 mb-2">We never sell your info — paid job posts keep the lights on.</p>
        <p class="text-sm md:text-base text-white/80 mb-6">Smart resume matching that’s transparent — no black‑box AI.</p>
        <div class="flex gap-4 justify-center">
          <a id="postCta" href="/#post" class="bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl shadow hover:bg-gray-100 transition" style="display:none;">Post a ${CONFIG.COMPANY_BUSINESS_THING}</a>
          <a href="/#list" class="border border-white px-6 py-3 rounded-xl hover:bg-white hover:text-indigo-600 transition">Browse ${CONFIG.COMPANY_BUSINESS_THING_PLURAL}</a>
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
  `;

  const postCta = container.querySelector('#postCta');
  getSessionCached({ maxAgeMs: 30000 })
    .then(session => {
      const roles = Array.isArray(session?.roles) ? session.roles : [];
      if (postCta && roles.includes('employer')) {
        postCta.style.display = 'inline-block';
      }
    })
    .catch(() => {});
}
