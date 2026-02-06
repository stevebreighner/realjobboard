export function renderEmployers(container) {
  container.innerHTML = `
    <style>
      .hero-blue {
        background: linear-gradient(135deg, #f472b6 0%, #fb7185 55%, #f9a8d4 100%);
      }
      .text-shadow {
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
      }
    </style>
    <div class="max-w-5xl mx-auto px-4 py-10">
      <div class="relative overflow-hidden text-white rounded-2xl p-6 md:p-8 mb-8 shadow hero-blue">
        <div class="absolute inset-0 bg-black/20 pointer-events-none"></div>
        <div class="relative z-10 text-shadow">
          <h1 class="text-3xl md:text-4xl font-bold mb-3">Employer control, without the noise.</h1>
          <p class="text-white/95">
            Verify your company, filter applicants fast, and keep listings focused.
          </p>
          <p class="text-white/85 text-sm mt-2">
            Priority placement and transparent matching — no black‑box promises.
          </p>
          <div class="mt-5 flex gap-3">
            <a href="/#post" class="bg-white text-slate-900 font-semibold px-4 py-2 rounded-lg">Post a job</a>
            <a href="/#my-job-posts" class="border border-white/70 text-white px-4 py-2 rounded-lg hover:bg-white/10">Manage openings</a>
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

      <div class="mt-10 border rounded-2xl p-6 md:p-8 shadow-sm bg-gradient-to-r from-pink-50 via-white to-amber-50">
        <div class="text-xs uppercase tracking-widest text-pink-600 mb-2">Founding Employer</div>
        <h2 class="text-2xl font-bold mb-2">Lock in founder pricing</h2>
        <p class="text-gray-700 mb-4">
          We’re opening early access to the first 10 companies. Founding employers lock in a discounted rate forever and
          get priority placement, verified badges, and direct founder support.
        </p>
        <div class="flex flex-wrap gap-3">
          <a href="/#support?subject=Founding%20Employer&context=employers" class="bg-pink-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-pink-700">
            Apply for founding access
          </a>
          <span class="text-sm text-gray-600 self-center">Early access: $49/month (regular $99)</span>
        </div>
      </div>
    </div>
  `;
}
