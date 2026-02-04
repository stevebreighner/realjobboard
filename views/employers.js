export function renderEmployers(container) {
  container.innerHTML = `
    <style>
      .bg-hero-fun {
        background: linear-gradient(135deg, #ff4d8d 0%, #ffb347 35%, #5cffd1 70%, #5b7cff 100%);
        background-size: 200% 200%;
        animation: heroShift 12s ease infinite;
      }
      .hero-fun-blob {
        position: absolute;
        border-radius: 999px;
        filter: blur(20px);
        opacity: 0.35;
        mix-blend-mode: screen;
      }
      .hero-fun-blob.one {
        width: 320px;
        height: 320px;
        background: #ff7ab6;
        top: -120px;
        left: -80px;
      }
      .hero-fun-blob.two {
        width: 360px;
        height: 360px;
        background: #60a5fa;
        bottom: -140px;
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
    <div class="max-w-5xl mx-auto px-4 py-10">
      <div class="relative overflow-hidden text-white rounded-2xl p-6 md:p-8 mb-8 shadow bg-hero-fun">
        <div class="hero-fun-blob one"></div>
        <div class="hero-fun-blob two"></div>
        <div class="absolute inset-0 bg-black/35 pointer-events-none"></div>
        <div class="relative z-10 text-shadow">
          <div class="text-xs uppercase tracking-widest text-white/80 mb-2">Employers</div>
          <h1 class="text-3xl md:text-4xl font-bold mb-3">Fewer distractions. Better hires.</h1>
          <p class="text-white/95">
            Built to reduce noise and improve applicant quality without penalizing great candidates.
          </p>
          <p class="text-white/85 text-sm mt-2">
            Smart matching that’s transparent — no black‑box AI.
          </p>
          <div class="mt-5 flex gap-3">
            <a href="/#post" class="bg-white text-slate-900 font-semibold px-4 py-2 rounded-lg">Post a job</a>
            <a href="/#list" class="border border-white/70 text-white px-4 py-2 rounded-lg hover:bg-white/10">Browse listings</a>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">No Data Sales</div>
          <h2 class="text-xl font-semibold mb-2">We don’t sell user data</h2>
          <p class="text-gray-700">
            The platform is funded by paid job posts, so applicant data isn’t sold or monetized.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Smart Matching</div>
          <h2 class="text-xl font-semibold mb-2">Resume relevance scoring</h2>
          <p class="text-gray-700">
            Applicants are scored against the job description using resume text extraction and keyword matching,
            so you can prioritize stronger matches quickly.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Applicant Filtering</div>
          <h2 class="text-xl font-semibold mb-2">Find what matters fast</h2>
          <p class="text-gray-700">
            Filter applicants by name, resume filename, location, and extracted resume text.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Verified Employers</div>
          <h2 class="text-xl font-semibold mb-2">Trust built in</h2>
          <p class="text-gray-700">
            Employer accounts are verified before posting, helping keep the marketplace trustworthy.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Privacy‑First Contact</div>
          <h2 class="text-xl font-semibold mb-2">Respect applicant privacy</h2>
          <p class="text-gray-700">
            Applicants can hide their email. When hidden, you’ll see “Email hidden — use resume link only.”
          </p>
        </div>
      </div>
    </div>
  `;
}
