const ROUTE_ALIASES = {
  '': 'home',
  home: 'home',
  about: 'about',
  login: 'login',
  register: 'register',
  list: 'list',
  'list-detail': 'listDetail',
  listdetail: 'listDetail',
  post: 'post',
  profile: 'profile',
  admin: 'admin',
  analytics: 'analytics',
  'update-password': 'updatePassword',
  updatepassword: 'updatePassword',
  'forgot-password': 'forgotPassword',
  forgotpassword: 'forgotPassword',
  'reset-password': 'resetPassword',
  resetpassword: 'resetPassword',
  support: 'support',
  privacy: 'privacy',
  terms: 'terms',
  employers: 'employers',
  employees: 'employees',
  speed: 'speed',
  company: 'company',
  'magic-login': 'magicLogin',
  magiclogin: 'magicLogin',
  'verify-email': 'verifyEmail',
  verifyemail: 'verifyEmail',
  unsubscribe: 'unsubscribe',
  'saved-searches': 'savedSearches',
  savedsearches: 'savedSearches',
  'complete-profile': 'completeProfile',
  completeprofile: 'completeProfile',
  '2fa': '2fa',
  resume: 'resume',
  apply: 'apply',
  'my-job-posts': 'myJobPosts',
  myjobposts: 'myJobPosts',
  'my-job-post-detail': 'myJobPostDetail',
  myjobpostdetail: 'myJobPostDetail',
  'my-applications': 'myApplications',
  myapplications: 'myApplications',
};

const STATIC_ROUTE_PATHS = {
  home: '/',
  about: '/about',
  login: '/login',
  register: '/register',
  list: '/list',
  post: '/post',
  profile: '/profile',
  admin: '/admin',
  analytics: '/analytics',
  updatePassword: '/update-password',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  support: '/support',
  privacy: '/privacy',
  terms: '/terms',
  employers: '/employers',
  employees: '/employees',
  speed: '/speed',
  magicLogin: '/magic-login',
  verifyEmail: '/verify-email',
  unsubscribe: '/unsubscribe',
  savedSearches: '/saved-searches',
  completeProfile: '/complete-profile',
  '2fa': '/2fa',
  resume: '/resume',
  myJobPosts: '/my-job-posts',
  myApplications: '/my-applications',
};

const toRouteAliasKey = (value) => {
  return String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
};

export function normalizeRouteName(value) {
  const key = toRouteAliasKey(value);
  return ROUTE_ALIASES[key] || key || 'home';
}

function parseQuery(search = '') {
  const query = String(search || '').replace(/^\?/, '');
  return Object.fromEntries(new URLSearchParams(query));
}

function parseRouteWithSegments(baseRoute, segments, params) {
  if (baseRoute === 'company' && segments.length > 1) {
    params.slug = decodeURIComponent(segments.slice(1).join('/'));
  }
  if (baseRoute === 'listDetail' && segments.length > 1 && !params.id) {
    params.id = decodeURIComponent(segments[1]);
  }
  if (baseRoute === 'apply' && segments.length > 1 && !params.id) {
    params.id = decodeURIComponent(segments[1]);
  }
  if (baseRoute === 'myJobPostDetail' && segments.length > 1 && !params.id) {
    params.id = decodeURIComponent(segments[1]);
  }
  return { route: baseRoute, params };
}

export function parseHashLocation(hashValue) {
  const hash = String(hashValue || '').replace(/^#/, '');
  const [pathPart = '', searchPart = ''] = hash.split('?');
  const params = parseQuery(searchPart);
  const cleanPath = pathPart.replace(/^\/+|\/+$/g, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const base = normalizeRouteName(segments[0] || cleanPath);
  return parseRouteWithSegments(base, segments, params);
}

export function parsePathLocation(pathname, search = '') {
  const params = parseQuery(search);
  const cleanPath = String(pathname || '/').replace(/^\/+|\/+$/g, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const base = normalizeRouteName(segments[0] || 'home');
  return parseRouteWithSegments(base, segments, params);
}

function stringifyQuery(params = {}, omitKeys = []) {
  const qs = new URLSearchParams();
  const omit = new Set(omitKeys);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (omit.has(key)) return;
    if (value === undefined || value === null) return;
    const str = String(value).trim();
    if (!str) return;
    qs.set(key, str);
  });
  const text = qs.toString();
  return text ? `?${text}` : '';
}

export function routeToPath(routeName, params = {}) {
  const route = normalizeRouteName(routeName);
  if (route === 'company') {
    const slug = String(params.slug || '').trim();
    const base = slug ? `/company/${encodeURIComponent(slug)}` : '/company';
    return `${base}${stringifyQuery(params, ['slug'])}`;
  }
  if (route === 'listDetail') {
    const id = String(params.id || '').trim();
    const base = id ? `/list-detail/${encodeURIComponent(id)}` : '/list-detail';
    return `${base}${stringifyQuery(params, ['id'])}`;
  }
  if (route === 'apply') {
    const id = String(params.id || '').trim();
    const base = id ? `/apply/${encodeURIComponent(id)}` : '/apply';
    return `${base}${stringifyQuery(params, ['id'])}`;
  }
  if (route === 'myJobPostDetail') {
    const id = String(params.id || '').trim();
    const base = id ? `/my-job-post-detail/${encodeURIComponent(id)}` : '/my-job-post-detail';
    return `${base}${stringifyQuery(params, ['id'])}`;
  }
  const staticPath = STATIC_ROUTE_PATHS[route] || '/';
  return `${staticPath}${stringifyQuery(params)}`;
}

export function hashToPath(hashValue) {
  const { route, params } = parseHashLocation(hashValue);
  return routeToPath(route, params);
}

export function normalizeInternalHref(href) {
  if (!href) return null;
  const value = String(href).trim();
  if (!value) return null;

  if (value.startsWith('#') || value.startsWith('/#')) {
    const hash = value.startsWith('/#') ? value.slice(1) : value;
    return hashToPath(hash);
  }

  if (value.startsWith('/')) {
    try {
      const url = new URL(value, window.location.origin);
      const path = url.pathname;
      const staticPaths = new Set(Object.values(STATIC_ROUTE_PATHS));
      const isStatic = staticPaths.has(path);
      const isDynamic = /^\/(company|list-detail|apply|my-job-post-detail)\/[^/]+/.test(path);
      if (isStatic || isDynamic) {
        return `${url.pathname}${url.search}`;
      }
    } catch (err) {
      return null;
    }
    return null;
  }
  return null;
}
