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

function parseHash() {
  const rawHash = window.location.hash.slice(1);
  const [pathPart, queryString = ''] = rawHash.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString));
  const pathLower = pathPart.toLowerCase();
  if (pathLower.startsWith('company/')) {
    params.slug = pathPart.split('/').slice(1).join('/') || params.slug;
    return { path: 'company', params };
  }
  return { path: pathLower, params };
}

function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

const protectedRoutes = ['profile', 'updatePassword','post','apply','resume', 'myJobPosts', 'myJobPostDetail', 'myApplications', 'admin'];
const employerRoutes = ['post', 'myJobPosts', 'myJobPostDetail'];
const adminRoutes = ['admin'];

export async function router() {
  
  const app = document.getElementById('app');
  if (app) {
    app.style.opacity = '0';
    app.style.transition = 'opacity 120ms ease';
  }
  const { path, params } = parseHash();
  const normalizedPath = (!path || path === '/') ? 'home' : kebabToCamel(path);
  console.log('Hash path:', path);
  console.log('Normalized path:', normalizedPath);
  console.log('Params:', params);
  const scrollToTopAfterRender = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (app) app.style.opacity = '1';
    });
  };
  if (protectedRoutes.includes(normalizedPath)) {
    const session = await getSessionCached({ maxAgeMs: 30000 });
    if (!session) {
      if (window.location.hash && window.location.hash !== '#login') {
        sessionStorage.setItem('postLoginRedirect', window.location.hash);
      }
      window.location.hash = '#login';
      return;
    }
    if (employerRoutes.includes(normalizedPath)) {
      const roles = Array.isArray(session?.roles) ? session.roles : [];
      if (!roles.includes('employer')) {
        window.location.hash = '#home';
        return;
      }
    }
    if (adminRoutes.includes(normalizedPath)) {
      const roles = Array.isArray(session?.roles) ? session.roles : [];
      if (!roles.includes('site_admin') && !roles.includes('administrator')) {
        window.location.hash = '#home';
        return;
      }
    }
  }

  switch (normalizedPath) {
    case 'home':
      renderHome(app);
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
        case '2fa':
          render2FA(app);
          return scrollToTopAfterRender();
          // specific to jobboard
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
  //end specific
    default:
      app.innerHTML = '<h1 class="text-xl">404 - Page Not Found</h1>';
  }
}
