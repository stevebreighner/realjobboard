import { renderLogin } from './views/login.js';
import { renderRegister } from './views/register.js';
import { renderProfile } from './views/profile.js';
import { renderList } from './views/list.js';
import { renderListDetail } from './views/listDetail.js';
import { renderPost } from './views/post.js';
import { renderAbout } from './views/about.js';
import { renderUpdatePassword } from './views/updatePassword.js';
import { renderForgotPassword } from './views/forgotPassword.js';
import { renderResetPassword } from './views/resetPassword.js';
import { render2FA } from './views/2fa.js';
import { renderSupport } from './views/support.js';
import { renderHome } from './views/home.js';
import { renderPrivacy } from './views/privacy.js';
import { renderTerms } from './views/terms.js';
// specific to job board
import { renderApply } from './views/apply.js';
import { renderResume } from './views/resume.js';
import { renderMyJobPosts } from './views/myJobPosts.js';
import { renderMyJobPostDetail } from './views/myJobPostDetail.js';
import { renderMyApplications } from './views/myApplications.js';
import { getSessionCached } from './utils/session.js';
import { renderAdmin } from './views/admin.js';
import { renderEmployers } from './views/employers.js';
import { renderEmployees } from './views/employees.js';
import { renderSpeed } from './views/speed.js';
import { renderCompany } from './views/company.js';
import { renderMagicLogin } from './views/magicLogin.js';
import { renderVerifyEmail } from './views/verifyEmail.js';
import { renderUnsubscribe } from './views/unsubscribe.js';
import { renderSavedSearches } from './views/savedSearches.js';
import { renderCompleteProfile } from './views/completeProfile.js';
import { renderNotFound } from './views/notFound.js';
import { renderAnalytics } from './views/analytics.js';
import { parseHashLocation, parsePathLocation, routeToPath } from './utils/routes.js';

const protectedRoutes = ['profile', 'updatePassword', 'post', 'apply', 'resume', 'myJobPosts', 'myJobPostDetail', 'myApplications', 'admin', 'analytics', 'savedSearches', 'completeProfile'];
const employerRoutes = ['post', 'myJobPosts', 'myJobPostDetail'];
const adminRoutes = ['admin', 'analytics'];

function currentViewPath() {
  return `${window.location.pathname}${window.location.search}`;
}

export function navigateTo(route, params = {}, replace = false) {
  const target = routeToPath(route, params);
  if (replace) {
    window.history.replaceState({}, '', target);
  } else {
    window.history.pushState({}, '', target);
  }
}

export async function router() {
  
  const app = document.getElementById('app');
  if (app) {
    app.style.opacity = '0';
    app.style.transition = 'opacity 120ms ease';
    app.style.visibility = 'hidden';
  }

  const currentView = currentViewPath();
  const prevView = sessionStorage.getItem('currentView');
  if (prevView && prevView !== currentView) {
    sessionStorage.setItem('lastView', prevView);
  }
  sessionStorage.setItem('currentView', currentView);

  const hasHashRoute = !!(window.location.hash && window.location.hash !== '#');
  const parsed = hasHashRoute
    ? parseHashLocation(window.location.hash)
    : parsePathLocation(window.location.pathname, window.location.search);
  const normalizedPath = parsed.route || 'home';
  const params = parsed.params || {};

  if (hasHashRoute) {
    const prettyPath = routeToPath(normalizedPath, params);
    window.history.replaceState({}, '', prettyPath);
  }

  console.log('Route:', normalizedPath);
  console.log('Params:', params);
  const scrollToTopAfterRender = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (app) {
        app.style.visibility = 'visible';
        app.style.opacity = '1';
      }
    });
  };
  if (protectedRoutes.includes(normalizedPath)) {
    const session = await getSessionCached({ maxAgeMs: 30000 });
    if (!session) {
      if (normalizedPath !== 'login') {
        sessionStorage.setItem('postLoginRedirect', currentViewPath());
      }
      navigateTo('login');
      router();
      return;
    }
    if (employerRoutes.includes(normalizedPath)) {
      const roles = Array.isArray(session?.roles) ? session.roles : [];
      if (!roles.includes('employer')) {
        navigateTo('home');
        router();
        return;
      }
    }
    if (adminRoutes.includes(normalizedPath)) {
      const roles = Array.isArray(session?.roles) ? session.roles : [];
      if (!roles.includes('site_admin') && !roles.includes('administrator')) {
        navigateTo('home');
        router();
        return;
      }
    }
  }

  switch (normalizedPath) {
    case 'home':
      await renderHome(app);
      return scrollToTopAfterRender();
    case 'login':
      renderLogin(app);
      return scrollToTopAfterRender();
       case 'about':
      renderAbout(app);
      return scrollToTopAfterRender();
    case 'register':
      renderRegister(app);
      return scrollToTopAfterRender();
    case 'list':
      renderList(app);
      return scrollToTopAfterRender();
    case 'listDetail':
      if (params.id) {
        renderListDetail(app, params.id);
        return scrollToTopAfterRender();
      }
      app.innerHTML = '<h1 class="text-xl">Missing ID for List Detail</h1>';
      return;
    case 'myJobPosts':
      renderMyJobPosts(app);
      return scrollToTopAfterRender();
    case 'myJobPostDetail':
      renderMyJobPostDetail(app, params.id);
      return scrollToTopAfterRender();
    case 'myApplications':
      renderMyApplications(app);
      return scrollToTopAfterRender();
    case 'post':
      renderPost(app);
      return scrollToTopAfterRender();
    case 'profile':
      renderProfile(app);
      return scrollToTopAfterRender();
    case 'admin':
      renderAdmin(app);
      return scrollToTopAfterRender();
    case 'analytics':
      await renderAnalytics(app);
      return scrollToTopAfterRender();
    case 'updatePassword':
      renderUpdatePassword(app);
      return scrollToTopAfterRender();
    case 'forgotPassword':
      renderForgotPassword(app);
      return scrollToTopAfterRender();
    case 'resetPassword':
      renderResetPassword(app, params);
      return scrollToTopAfterRender();
    case 'support':
      renderSupport(app, params);
      return scrollToTopAfterRender();
    case 'privacy':
      renderPrivacy(app);
      return scrollToTopAfterRender();
    case 'terms':
      renderTerms(app);
      return scrollToTopAfterRender();
    case 'employers':
      renderEmployers(app);
      return scrollToTopAfterRender();
    case 'employees':
      renderEmployees(app);
      return scrollToTopAfterRender();
    case 'speed':
      renderSpeed(app);
      return scrollToTopAfterRender();
    case 'company':
      if (params.slug) {
        renderCompany(app, params.slug);
        return scrollToTopAfterRender();
      }
      app.innerHTML = '<h1 class="text-xl">Missing company slug</h1>';
      return;
    case 'magicLogin':
      renderMagicLogin(app, params);
      return scrollToTopAfterRender();
    case 'verifyEmail':
      renderVerifyEmail(app, params);
      return scrollToTopAfterRender();
    case 'unsubscribe':
      renderUnsubscribe(app);
      return scrollToTopAfterRender();
    case 'savedSearches':
      renderSavedSearches(app);
      return scrollToTopAfterRender();
    case 'completeProfile':
      await renderCompleteProfile(app);
      return scrollToTopAfterRender();
    case '2fa':
      render2FA(app);
      return scrollToTopAfterRender();
    case 'resume':
      renderResume(app);
      return scrollToTopAfterRender();
    case 'apply':
      if (params.id) {
        renderApply(app, params.id);
        return scrollToTopAfterRender();
      }
      app.innerHTML = '<h1 class="text-xl">Missing Job ID for Apply</h1>';
      return;
    default:
      renderNotFound(app, window.location.pathname || normalizedPath);
      return scrollToTopAfterRender();
  }
}
