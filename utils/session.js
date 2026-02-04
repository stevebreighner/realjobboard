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

export function clearSessionCache() {
  if (!window[PRELOAD_KEY]) return;
  delete window[PRELOAD_KEY].session;
}

export function clearProfileCache() {
  if (!window[PRELOAD_KEY]) return;
  delete window[PRELOAD_KEY].profile;
  delete window[PRELOAD_KEY].profile_light;
}

export function notifyAuthChanged(session = null) {
  const event = new CustomEvent('auth:changed', { detail: session });
  window.dispatchEvent(event);
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

export async function getUserProfileCached({ maxAgeMs = 30000, force = false, light = false } = {}) {
  const cacheKey = light ? 'profile_light' : 'profile';
  if (!force) {
    const cached = getCache(cacheKey, maxAgeMs);
    if (cached) return cached;
  }
  try {
    const url = light
      ? '/wp-json/customapi/v1/user-profile?light=1&_=' + Date.now()
      : '/wp-json/customapi/v1/user-profile?_=' + Date.now();
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

export function getUserProfileCachedAny({ light = false } = {}) {
  const cacheKey = light ? 'profile_light' : 'profile';
  const cached = getCacheRaw(cacheKey);
  return cached ? cached.data : null;
}
