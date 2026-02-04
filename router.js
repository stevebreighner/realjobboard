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
import { getSessionCached } from './utils/session.js';
import { renderAdmin } from './views/admin.js';
import { renderEmployers } from './views/employers.js';
import { renderEmployees } from './views/employees.js';
import { renderSpeed } from './views/speed.js';

function parseHash() {
  const rawHash = window.location.hash.slice(1);
  const [pathPart, queryString = ''] = rawHash.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString));
  return { path: pathPart.toLowerCase(), params };
}

function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

const protectedRoutes = ['profile', 'updatePassword','post','apply','resume', 'myJobPosts', 'myJobPostDetail', 'admin'];
const employerRoutes = ['post', 'myJobPosts', 'myJobPostDetail'];
const adminRoutes = ['admin'];

export async function router() {
  
  const app = document.getElementById('app');
  const { path, params } = parseHash();
  const normalizedPath = (!path || path === '/') ? 'home' : kebabToCamel(path);
  console.log('Hash path:', path);
  console.log('Normalized path:', normalizedPath);
  console.log('Params:', params);
  const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  scrollToTop();
  if (protectedRoutes.includes(normalizedPath)) {
    const session = await getSessionCached({ maxAgeMs: 30000 });
    if (!session) {
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
      return scrollToTop();
    case 'login':
      renderLogin(app);
      return scrollToTop();
       case 'about':
      renderAbout(app);
      return scrollToTop();
    case 'register':
      renderRegister(app);
      return scrollToTop();
    case 'list':
      renderList(app);
      return scrollToTop();
      case 'listDetail':
        if (params.id) {
          renderListDetail(app, params.id);
          return scrollToTop();
        }
        app.innerHTML = '<h1 class="text-xl">Missing ID for List Detail</h1>';
        return;
        case 'myJobPosts':
  renderMyJobPosts(app);
  return scrollToTop();
case 'myJobPostDetail':
  renderMyJobPostDetail(app, params.id);
  return scrollToTop();
    case 'post':
      renderPost(app);
      return scrollToTop();
    case 'profile':
      renderProfile(app);
      return scrollToTop();
    case 'admin':
      renderAdmin(app);
      return scrollToTop();
    case 'updatePassword':
      renderUpdatePassword(app);
      return scrollToTop();
    case 'forgotPassword':
      renderForgotPassword(app);
      return scrollToTop();
    case 'resetPassword':
      renderResetPassword(app, params);
      return scrollToTop();
    case 'support':
      renderSupport(app, params);
      return scrollToTop();
    case 'privacy':
      renderPrivacy(app);
      return scrollToTop();
    case 'terms':
      renderTerms(app);
      return scrollToTop();
    case 'employers':
      renderEmployers(app);
      return scrollToTop();
    case 'employees':
      renderEmployees(app);
      return scrollToTop();
    case 'speed':
      renderSpeed(app);
      return scrollToTop();
        case '2fa':
          render2FA(app);
          return scrollToTop();
          // specific to jobboard
          case 'resume':
            renderResume(app);
            return scrollToTop();
        
          case 'apply':
  if (params.id) {
    renderApply(app, params.id);
    return scrollToTop();
  }
  app.innerHTML = '<h1 class="text-xl">Missing Job ID for Apply</h1>';
  return;
  //end specific
    default:
      app.innerHTML = '<h1 class="text-xl">404 - Page Not Found</h1>';
  }
}
