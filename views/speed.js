export function renderSpeed(container) {
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
          <div class="text-xs uppercase tracking-widest text-white/80 mb-2">Performance</div>
          <h1 class="text-3xl md:text-4xl font-bold mb-3">Lightning‑fast by design</h1>
          <p class="text-white/95">
            We keep the site fast with lightweight views, smart caching, and zero front‑end bloat.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-[rgb(0_64_110)] mb-2">Vanilla JS</div>
          <h2 class="text-xl font-semibold mb-2">No heavy framework overhead</h2>
          <p class="text-gray-700">
            The app uses lightweight view rendering to keep initial load and route changes snappy.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-[rgb(0_64_110)] mb-2">Smart Caching</div>
          <h2 class="text-xl font-semibold mb-2">Cache after decryption</h2>
          <p class="text-gray-700">
            Profile data is cached after decryption so revisits load instantly without redoing heavy work.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-[rgb(0_64_110)] mb-2">Optimized Fetching</div>
          <h2 class="text-xl font-semibold mb-2">Only what’s needed</h2>
          <p class="text-gray-700">
            We minimize API calls and reuse cached data across pages to keep the UI responsive.
          </p>
        </div>

        <div class="border rounded-xl p-5 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-[rgb(0_64_110)] mb-2">Predictable UI</div>
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
