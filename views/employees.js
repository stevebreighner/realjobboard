export function renderEmployees(container) {
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
          <div class="text-xs uppercase tracking-widest text-white/80 mb-2">Job Seekers</div>
          <h1 class="text-3xl md:text-4xl font-bold mb-3">Privacy that feels human.</h1>
          <p class="text-white/95">
            Apply with confidence knowing your data stays protected.
          </p>
          <div class="mt-5 flex gap-3">
            <a href="/#list" class="bg-white text-indigo-700 font-semibold px-4 py-2 rounded-lg">Browse jobs</a>
            <a href="/#profile" class="border border-white/70 text-white px-4 py-2 rounded-lg hover:bg-white/10">Manage profile</a>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">No Data Sales</div>
          <h2 class="text-xl font-semibold mb-2">We don’t sell your info</h2>
          <p class="text-gray-700">
            The site is funded by paid job posts, not by selling your personal data.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Encrypted Files</div>
          <h2 class="text-xl font-semibold mb-2">Files protected by default</h2>
          <p class="text-gray-700">
            Resumes and cover letters are encrypted at rest and only decrypted when you choose to load them.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Abuse Prevention</div>
          <h2 class="text-xl font-semibold mb-2">Report issues fast</h2>
          <p class="text-gray-700">
            Report abuse directly to admins from any job or application page. Reports go to a dedicated form.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Verified Employers</div>
          <h2 class="text-xl font-semibold mb-2">Fewer scams, more trust</h2>
          <p class="text-gray-700">
            Employers must be verified before they can post, reducing spam and scams.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Email Privacy</div>
          <h2 class="text-xl font-semibold mb-2">Share on your terms</h2>
          <p class="text-gray-700">
            You can hide your email from employers and share only your resume link if you prefer.
          </p>
        </div>
      </div>
    </div>
  `;
}
