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
// specific to job board
import { renderApply } from './views/apply.js';
import { renderResume } from './views/resume.js';
import { renderMyJobPosts } from './views/myJobPosts.js';
import { renderMyJobPostDetail } from './views/myJobPostDetail.js';

function parseHash() {
  const rawHash = window.location.hash.slice(1);
  const [pathPart, queryString = ''] = rawHash.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryString));
  return { path: pathPart.toLowerCase(), params };
}

function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

async function isLoggedIn() {
  try {
    const response = await fetch('/wp-json/customapi/v1/user-profile?_=' + Date.now(), {
      credentials: 'include'
    });
    return response.ok;
  } catch {
    return false;
  }
}

const protectedRoutes = ['profile', 'updatePassword','post','apply','resume', 'myJobPosts', 'myJobPostDetail'];

export async function router() {
  
  const app = document.getElementById('app');
  const { path, params } = parseHash();
  const normalizedPath = (!path || path === '/') ? 'home' : kebabToCamel(path);
  console.log('Hash path:', path);
  console.log('Normalized path:', normalizedPath);
  console.log('Params:', params);
  if (protectedRoutes.includes(normalizedPath)) {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      window.location.hash = '#login';
      return;
    }
  }

  switch (normalizedPath) {
    case 'home':
      return renderHome(app);
    case 'login':
      return renderLogin(app);
       case 'about':
      return renderAbout(app);
    case 'register':
      return renderRegister(app);
    case 'list':
      return renderList(app);
      case 'listDetail':
        if (params.id) {
          return renderListDetail(app, params.id);
        }
        app.innerHTML = '<h1 class="text-xl">Missing ID for List Detail</h1>';
        return;
        case 'myJobPosts':
  return renderMyJobPosts(app);
case 'myJobPostDetail':
  return renderMyJobPostDetail(app, params.id);
    case 'post':
      return renderPost(app);
    case 'profile':
      return renderProfile(app);
    case 'updatePassword':
      return renderUpdatePassword(app);
    case 'forgotPassword':
      return renderForgotPassword(app);
    case 'resetPassword':
      return renderResetPassword(app, params);
      case 'support':
        return renderSupport(app);
        case '2fa':
          return render2FA(app);
          // specific to jobboard
          case 'resume':
            return renderResume(app);
        
          case 'apply':
  if (params.id) {
    return renderApply(app, params.id);
  }
  app.innerHTML = '<h1 class="text-xl">Missing Job ID for Apply</h1>';
  return;
  //end specific
    default:
      app.innerHTML = '<h1 class="text-xl">404 - Page Not Found</h1>';
  }
}
