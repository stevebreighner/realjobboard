const scriptPromises = new Map();

export function loadScriptOnce(src, attrs = {}) {
  if (!src) return Promise.reject(new Error('Missing script src'));
  if (scriptPromises.has(src)) return scriptPromises.get(src);

  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    const ready = Promise.resolve(existing);
    scriptPromises.set(src, ready);
    return ready;
  }

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    Object.entries(attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        script.setAttribute(key, String(value));
      }
    });
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

  scriptPromises.set(src, promise);
  return promise;
}

export async function ensureStripeLoaded() {
  if (typeof window !== 'undefined' && typeof window.Stripe === 'function') {
    return window.Stripe;
  }
  await loadScriptOnce('https://js.stripe.com/v3/');
  if (typeof window === 'undefined' || typeof window.Stripe !== 'function') {
    throw new Error('Stripe failed to initialize');
  }
  return window.Stripe;
}
