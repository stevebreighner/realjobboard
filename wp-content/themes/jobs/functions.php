<?php
// Helper to get HTTP Origin header safely
if (!function_exists('get_http_origin')) {
  function get_http_origin() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
      return $_SERVER['HTTP_ORIGIN'];
    }
    if (isset($_SERVER['HTTP_REFERER'])) {
      $referer = $_SERVER['HTTP_REFERER'];
      $parts = parse_url($referer);
      if (isset($parts['scheme']) && isset($parts['host'])) {
        return $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
      }
    }
    return '';
  }
}
// SESSION + CORS SETUP (persistent cookie with 7-day expiration)
add_action('init', function () {
  if (!session_id()) {
    session_start();
  }

  if (!headers_sent()) {
    setcookie(session_name(), session_id(), [
      'expires'  => time() + 60 * 60 * 24 * 7, // 7 days
      'path'     => '/',
      'secure'   => is_ssl(),
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
  }

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    $origin = get_http_origin();

    if (
      preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin) ||
      $origin === 'http://localhost:5174' ||
      $origin === 'https://jobs.stephenbreighner.com'
    ) {
      header("Access-Control-Allow-Origin: $origin");
      header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
      header("Access-Control-Allow-Credentials: true");
      header("Access-Control-Allow-Headers: Origin, Content-Type, Authorization, X-Requested-With");
      header("Vary: Origin");
    }
    exit(0);
  }
}, 1);

// CORS for REST API responses
add_action('rest_api_init', function () {
  add_filter('rest_pre_serve_request', function ($served, $result, $request, $server) {
    $origin = get_http_origin();

    if (
      preg_match('#^http://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin) ||
      $origin === 'http://localhost:5174' ||
      $origin === 'https://jobs.stephenbreighner.com'
    ) {
      header("Access-Control-Allow-Origin: $origin");
      header("Access-Control-Allow-Credentials: true");
      header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
      header("Access-Control-Allow-Headers: Origin, Content-Type, Authorization, X-Requested-With");
      header("Vary: Origin");
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      header("HTTP/1.1 200 OK");
      exit(0);
    }

    return $served;
  }, 10, 4);
});
add_filter('upload_mimes', function($mimes) {
  $mimes['doc']  = 'application/msword';
  $mimes['docx'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  $mimes['pdf']  = 'application/pdf';
  return $mimes;
});


// MAIN ROUTES
add_action('rest_api_init', function () {
  $routes = [
    ['register',      'POST', 'customapi_register_user'],
    ['login',         'POST', 'customapi_login_user'],
    ['me',     'GET',  'customapi_get_user_jobs'],
    ['apply-job', 'POST', 'customapi_apply_to_job'],
    ['job-applicants', 'GET', 'customapi_get_job_applicants'],
    ['user-applications', 'GET', 'customapi_get_user_applications'],
      // --- New routes for resumes / covers ---
      ['delete-resume/(?P<time>\d+)', 'DELETE', 'customapi_delete_resume'],
      ['delete-cover/(?P<time>\d+)',  'DELETE', 'customapi_delete_cover'],
      ['get-my-list', 'GET', 'customapi_get_my_list'], ['get-my-list-detail', 'GET', 'customapi_get_my_list_detail'],
      ['submit-application', 'POST', 'customapi_submit_application'],
      ['check-application', 'GET', 'customapi_check_application'],
      ['user-jobs', 'GET', 'customapi_user_jobs'],
      ['user-job-detail', 'GET', 'customapi_user_job_detail'],
           // ---END New routes for resumes / covers ---
    ['create-post',     'POST',  'customapi_create_post'],
    // ['user-jobs',     'GET',  'customapi_get_user_jobs'],
    ['user-profile',     'GET', 'customapi_get_user_profile'],
    ['user-profile-update', 'POST', 'customapi_user_profile_update'],
    ['user-profile-avatar', 'POST', 'customapi_user_profile_avatar'],
    ['forgot-password', 'POST', 'customapi_forgot_password'],
    ['update-password', 'POST', 'customapi_update_password'],
    ['reset-password', 'POST', 'customapi_reset_password'],
    ['upload-resume', 'POST', 'customapi_upload_resume'],
    ['resumes', 'GET', 'customapi_get_resumes'],
    ['resumes-delete', 'POST', 'customapi_delete_resume'],
    ['resumes-update-resume-notes', 'POST', 'customapi_update_resume_notes'],
    ['logout',        'POST', 'customapi_logout_user'],
    ['get-list',          'GET',  'customapi_get_list'],
    ['get-list-detail',          'GET',  'customapi_get_list_detail'],
    ['tables',        'GET',  'customapi_get_tables'],
    ['apply',         'POST', 'customapi_apply_to_job'],
    ['sessions',       'GET',  'customapi_get_session'], // ✅ correct path
    ['profile',       'GET',  'customapi_get_user_profile'],
    ['2fa-start',     'POST', 'customapi_2fa_start'],
    ['2fa-verify', 'POST', 'customapi_2fa_verify'],
    ['magic-link',    'POST', 'customapi_send_magic_link'],
    ['magic-login',   'GET',  'customapi_handle_magic_login'],
    ['ping',     'GET',  'customapi_ping'],
    ['checklist',     'POST', 'customapi_save_checklist'],
  ];

  foreach ($routes as [$endpoint, $method, $callback]) {
    register_rest_route('customapi/v1', "/$endpoint", [
      'methods' => $method,
      'callback' => $callback,
      'permission_callback' => '__return_true',
    ]);
  }
});


// override wp emails
add_filter('send_password_change_email', '__return_false');
add_filter('wp_mail_from', function ($from) {
  return defined('EMAIL_FROM_ADDRESS') ? EMAIL_FROM_ADDRESS : $from;
});

add_filter('wp_mail_from_name', function ($name) {
  return defined('EMAIL_FROM_NAME') ? EMAIL_FROM_NAME : $name;
});
// end override wp emails

function customapi_get_session() {
  return isset($_SESSION['user'])
    ? $_SESSION['user']
    : new WP_Error('unauthorized', 'Not logged in', ['status' => 403]);
}

function customapi_ping() {
  return rest_ensure_response(['status' => 'ok', 'timestamp' => time()]);
}
 


// ⚙️ DEV-ONLY — Toggle current user's role and dump all users
add_action('template_redirect', function() {
  if (!is_user_logged_in() || !isset($_GET['switch_role']) || $_GET['switch_role'] !== 'toggle') {
      return;
  }

  $user = wp_get_current_user();
  if (!$user || !$user->exists()) {
      wp_die('No valid logged-in user found.');
  }

  // Ensure roles exist (create if missing)
  if (!get_role('employer')) add_role('employer', 'Employer');
  if (!get_role('employee')) add_role('employee', 'Employee');

  // Toggle logic
  if (in_array('employer', $user->roles, true)) {
      $user->set_role('employee');
      $msg = "✅ Switched {$user->user_login} to EMPLOYEE";
  } else {
      $user->set_role('employer');
      $msg = "✅ Switched {$user->user_login} to EMPLOYER";
  }

  // Refresh cache and re-fetch user
  clean_user_cache($user->ID);
  $user = wp_get_current_user();

  // Output confirmation + all users
  echo "<div style='background:#222;color:#0f0;padding:10px;font-family:monospace;'>";
  echo "<h2>{$msg}</h2>";
  echo "<p><strong>Current User:</strong> {$user->user_login} (Roles: " . implode(', ', $user->roles) . ")</p>";
  echo "</div>";

  echo "<pre style='background:#111;color:#eee;padding:20px;font-family:monospace;'>";
  echo "All Users and Roles:\n---------------------------------\n";

  $all_users = get_users(['fields' => ['ID', 'user_login', 'roles', 'user_email']]);
  foreach ($all_users as $u) {
      echo "ID: {$u->ID} | {$u->user_login} | " . implode(', ', $u->roles) . " | {$u->user_email}\n";
  }
  echo "</pre>";

  die(); // 💥 stop further page output
});


// Optional small helper to print the transient flash in footer for debugging
add_action('wp_footer', function() {
  if ( is_user_logged_in() ) {
    $user_id = get_current_user_id();
    $key = 'switch_role_message_' . $user_id;
    if ( $m = get_transient($key) ) {
      // simple visible bar
      echo '<div style="position:fixed;bottom:0;left:0;right:0;background:#fffae0;border-top:1px solid #f0e68c;padding:8px;text-align:center;z-index:99999;">' . esc_html($m) . '</div>';
      delete_transient($key);
    }
  }
});
require_once get_template_directory() . '/encrypt.php';
require_once get_template_directory() . '/customapi_profile_stuff.php';
require_once get_template_directory() . '/customapi_posts.php';
// require_once get_template_directory() . '/customapi_get_user_jobs.php';
require_once get_template_directory() . '/customapi_get_lists.php';
require_once get_template_directory() . '/customapi_apply.php';
// require_once get_template_directory() . '/customapi_resume.php';
// require_once get_template_directory() . '/customapi_magic_link.php';


?>