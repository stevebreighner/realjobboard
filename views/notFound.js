export function renderNotFound(container, path = '') {
  const safePath = (path || '').replace(/[<>&"']/g, '');
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 py-10">
      <div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p class="text-xs uppercase tracking-wider text-slate-500">404</p>
        <h1 class="mt-1 text-2xl font-semibold text-slate-900">Page not found</h1>
        <p class="mt-2 text-sm text-slate-600">
          The route <code class="px-1 py-0.5 rounded bg-slate-100 text-slate-800">${safePath || '(empty)'}</code> does not exist.
        </p>
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <a href="/#home" class="btn-primary px-4 py-2 rounded">Go Home</a>
          <a href="/#list" class="px-4 py-2 rounded border border-slate-300 text-slate-700">Browse Jobs</a>
          <a href="/#profile" class="px-4 py-2 rounded border border-slate-300 text-slate-700">Profile</a>
        </div>
      </div>
    </div>
  `;
}
