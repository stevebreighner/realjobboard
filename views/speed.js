export function renderSpeed(container) {
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
          <div class="text-xs uppercase tracking-widest text-white/80 mb-2">Performance</div>
          <h1 class="text-3xl md:text-4xl font-bold mb-3">Lightning‑fast by design</h1>
          <p class="text-white/95">
            We keep the site fast with lightweight views, smart caching, and zero front‑end bloat.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-emerald-600 mb-2">Vanilla JS</div>
          <h2 class="text-xl font-semibold mb-2">No heavy framework overhead</h2>
          <p class="text-gray-700">
            The app uses lightweight view rendering to keep initial load and route changes snappy.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-emerald-600 mb-2">Smart Caching</div>
          <h2 class="text-xl font-semibold mb-2">Cache after decryption</h2>
          <p class="text-gray-700">
            Profile data is cached after decryption so revisits load instantly without redoing heavy work.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-emerald-600 mb-2">Optimized Fetching</div>
          <h2 class="text-xl font-semibold mb-2">Only what’s needed</h2>
          <p class="text-gray-700">
            We minimize API calls and reuse cached data across pages to keep the UI responsive.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-emerald-600 mb-2">Predictable UI</div>
          <h2 class="text-xl font-semibold mb-2">Fast, consistent experience</h2>
          <p class="text-gray-700">
            A consistent layout means fewer layout shifts and a smoother feel on every page.
          </p>
        </div>
      </div>

      <p class="mt-6">
        <a href="/#home" class="text-emerald-700 hover:underline">Back to home</a>
      </p>
    </div>
  `;
}
