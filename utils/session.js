const PRELOAD_KEY = '__preload';

function getCache(key, maxAgeMs) {
  const store = window[PRELOAD_KEY];
  if (!store || !store[key]) return null;
  const { data, ts } = store[key];
  if (!ts || (Date.now() - ts) > maxAgeMs) return null;
  return data;
}

function getCacheRaw(key) {
  const store = window[PRELOAD_KEY];
  if (!store || !store[key]) return null;
  return store[key];
}

function setCache(key, data) {
  if (!window[PRELOAD_KEY]) window[PRELOAD_KEY] = {};
  window[PRELOAD_KEY][key] = { data, ts: Date.now() };
}

export async function getSessionCached({ maxAgeMs = 30000, force = false } = {}) {
  if (!force) {
    const cached = getCache('session', maxAgeMs);
    if (cached) return cached;
  }
  try {
    const res = await fetch('/wp-json/customapi/v1/sessions?_=' + Date.now(), {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    setCache('session', data);
    return data;
  } catch {
    return null;
  }
}

export async function getUserProfileCached({ maxAgeMs = 30000, force = false } = {}) {
  if (!force) {
    const cached = getCache('profile', maxAgeMs);
    if (cached) return cached;
  }
  try {
    const res = await fetch('/wp-json/customapi/v1/user-profile?_=' + Date.now(), {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    setCache('profile', data);
    return data;
  } catch {
    return null;
  }
}

export function getUserProfileCachedAny() {
  const cached = getCacheRaw('profile');
  return cached ? cached.data : null;
}
