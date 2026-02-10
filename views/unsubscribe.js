export function renderUnsubscribe(container) {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const status = params.get('status') || '';
  const isSuccess = status === 'success';
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4">
      <div class="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
        <h1 class="text-2xl font-semibold mb-2">${isSuccess ? 'You’re unsubscribed' : 'Unsubscribe'}</h1>
        <p class="text-sm text-slate-600 mb-4">
          ${isSuccess
            ? 'You will no longer receive job alert emails.'
            : 'We could not confirm your unsubscribe request. If you believe this is a mistake, contact support.'}
        </p>
        <a href="/#list" class="text-sm text-indigo-600 hover:underline">← Back to listings</a>
      </div>
    </div>
  `;
}

