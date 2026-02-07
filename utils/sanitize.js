export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, window.location.origin);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch (err) {
    return '';
  }
  return '';
}

export function safeImageUrl(value) {
  if (!value) return '';
  if (typeof value === 'string' && value.startsWith('data:image/')) {
    return value;
  }
  return safeUrl(value);
}
