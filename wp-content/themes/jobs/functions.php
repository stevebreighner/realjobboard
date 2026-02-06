<?php
// ---------------------------------------------------------------------------
// Custom theme bootstrap (keep this file tidy and easy to navigate).
// ---------------------------------------------------------------------------

// Core bootstrapping (sessions, CORS, upload mimes, roles).
require_once get_template_directory() . '/inc/custom-boot.php';

// REST routes registration.
require_once get_template_directory() . '/inc/custom-routes.php';


// ---------------------------------------------------------------------------
// EMAIL CONFIG + TEMPLATE FACTORY
// ---------------------------------------------------------------------------
// override wp emails
add_filter('send_password_change_email', '__return_false');
add_filter('wp_mail_from', function ($from) {
  return defined('EMAIL_FROM_ADDRESS') ? EMAIL_FROM_ADDRESS : $from;
});

add_filter('wp_mail_from_name', function ($name) {
  return defined('EMAIL_FROM_NAME') ? EMAIL_FROM_NAME : $name;
});
// end override wp emails

// Email branding helpers
if (!defined('EMAIL_BRAND_NAME')) {
  define('EMAIL_BRAND_NAME', get_bloginfo('name'));
}
if (!defined('EMAIL_PRIMARY_COLOR')) {
  define('EMAIL_PRIMARY_COLOR', '#4f46e5');
}
if (!defined('EMAIL_ACCENT_COLOR')) {
  define('EMAIL_ACCENT_COLOR', '#ec4899');
}
if (!defined('EMAIL_BRAND_LOGO_URL')) {
  define('EMAIL_BRAND_LOGO_URL', get_stylesheet_directory_uri() . '/assets/email-logo.svg');
}
if (!defined('EMAIL_HEADER_IMAGE_URL')) {
  define('EMAIL_HEADER_IMAGE_URL', '');
}

function customapi_email_template($title, $bodyHtml, $ctaText = '', $ctaUrl = '', $metaLines = []) {
  $brand = EMAIL_BRAND_NAME;
  $primary = EMAIL_PRIMARY_COLOR;
  $accent = EMAIL_ACCENT_COLOR;
  $logo = EMAIL_BRAND_LOGO_URL;
  $headerImage = EMAIL_HEADER_IMAGE_URL ?: $logo;
  $meta = '';
  if (!empty($metaLines)) {
    $items = array_map(function($line) {
      return '<div style="margin-bottom:6px;">' . esc_html($line) . '</div>';
    }, $metaLines);
    $meta = '<div style="margin:16px 0; padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; font-size:13px; color:#475569;">' . implode('', $items) . '</div>';
  }
  $cta = '';
  if (!empty($ctaText) && !empty($ctaUrl)) {
    $cta = '<div style="margin:22px 0;"><a href="' . esc_url($ctaUrl) . '" style="display:inline-block; background:' . esc_attr($primary) . '; color:#fff; text-decoration:none; font-weight:600; padding:12px 18px; border-radius:10px;">' . esc_html($ctaText) . '</a></div>';
  }
  return '
  <div style="margin:0; padding:24px; background:#f7f7fb; font-family:Arial, sans-serif;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; padding:26px; border:1px solid #e5e7eb;">
      <div style="margin:-26px -26px 18px; border-radius:16px 16px 12px 12px; overflow:hidden;">
        <div style="background:linear-gradient(120deg,' . esc_attr($primary) . ', ' . esc_attr($accent) . '); padding:18px 22px; display:flex; align-items:center; gap:12px;">
          ' . (!empty($headerImage) ? '<img src="' . esc_url($headerImage) . '" alt="' . esc_attr($brand) . '" width="32" height="32" style="display:block; border-radius:8px; background:#fff; padding:4px;" />' : '') . '
          <div style="color:#fff; font-weight:700; font-size:16px; letter-spacing:0.2px;">' . esc_html($brand) . '</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
        ' . (!empty($logo) ? '<img src="' . esc_url($logo) . '" alt="' . esc_attr($brand) . '" width="28" height="28" style="display:block; border-radius:6px;" />' : '') . '
        <div style="font-weight:700; color:#0f172a; font-size:16px;">' . esc_html($brand) . '</div>
      </div>
      <h2 style="margin:0 0 8px; font-size:20px; color:#111827;">' . esc_html($title) . '</h2>
      <div style="font-size:14px; color:#374151; line-height:1.6;">' . $bodyHtml . '</div>
      ' . $meta . '
      ' . $cta . '
      <div style="border-top:1px solid #e5e7eb; margin-top:18px; padding-top:12px; font-size:12px; color:#6b7280;">
        You’re receiving this email because you used ' . esc_html($brand) . '.
        <div style="margin-top:8px;">
          <a href="' . esc_url(home_url('/#/support')) . '" style="color:' . esc_attr($primary) . '; text-decoration:none;">Support</a>
          <span style="margin:0 6px;">•</span>
          <a href="' . esc_url(home_url('/#/privacy')) . '" style="color:' . esc_attr($primary) . '; text-decoration:none;">Privacy</a>
          <span style="margin:0 6px;">•</span>
          <a href="' . esc_url(home_url('/#/terms')) . '" style="color:' . esc_attr($primary) . '; text-decoration:none;">Terms</a>
        </div>
      </div>
    </div>
  </div>';
}

function customapi_send_html_mail($to, $subject, $html, $replyTo = '') {
  $headers = ['Content-Type: text/html; charset=UTF-8'];
  if (!empty($replyTo)) {
    $headers[] = 'Reply-To: ' . $replyTo;
  }
  return wp_mail($to, $subject, $html, $headers);
}

function customapi_email_subject($type, $job_title = '') {
  $brand = EMAIL_BRAND_NAME;
  $job_part = $job_title ? ": {$job_title}" : '';
  $map = [
    'application_submitted' => "Application submitted{$job_part}",
    'application_received' => "New application received{$job_part}",
    'application_withdrawn' => "Application withdrawn{$job_part}",
    'application_update' => "Application update{$job_part}",
    'application_removed' => "Application update{$job_part}",
  ];
  $subject = $map[$type] ?? "Notification{$job_part}";
  return "{$brand} - {$subject}";
}

function customapi_get_site_admin_emails() {
  $admins = get_users([
    'role__in' => ['site_admin', 'administrator'],
    'fields' => ['user_email'],
  ]);
  $emails = [];
  foreach ($admins as $u) {
    if (!empty($u->user_email)) {
      $emails[] = $u->user_email;
    }
  }
  return array_values(array_unique($emails));
}

function customapi_notify_site_admins($subject, $message) {
  $emails = customapi_get_site_admin_emails();
  if (empty($emails)) {
    return false;
  }
  $full_subject = '[Admin] ' . $subject;
  return wp_mail($emails, $full_subject, $message);
}

// Send HTML for the Loginizer 2FA email (only when we include the marker)
add_filter('wp_mail', function ($args) {
  if (!empty($args['message']) && strpos($args['message'], '<!--loginizer-2fa-->') !== false) {
    $headers = $args['headers'] ?? [];
    if (!is_array($headers)) {
      $headers = [$headers];
    }
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $args['headers'] = $headers;
  }
  return $args;
});

// Customize Loginizer 2FA email template (only if not already set)
add_action('init', function () {
  $option = get_option('loginizer_2fa_email_template');
  if (!is_array($option)) {
    $option = [];
  }

  $hasSubject = !empty($option['2fa_email_sub']);
  $hasMessage = !empty($option['2fa_email_msg']);
  if ($hasSubject && $hasMessage) {
    return;
  }

  $option['2fa_email_sub'] = 'Your one-time code for $site_name';
  $option['2fa_email_msg'] = '<!--loginizer-2fa--><div style="font-family:Arial, sans-serif; background:#f7f7fb; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:24px; border:1px solid #e5e7eb;">
    <h2 style="margin:0 0 8px; font-size:20px; color:#111827;">Sign-in code</h2>
    <p style="margin:0 0 16px; color:#374151;">Hi $email,</p>
    <p style="margin:0 0 16px; color:#374151;">Use this one-time code to finish logging in to <strong>$site_name</strong>:</p>
    <div style="font-size:28px; letter-spacing:6px; font-weight:700; text-align:center; background:#f3f4f6; padding:14px; border-radius:10px; margin:16px 0; color:#111827;">
      $otp
    </div>
    <p style="margin:0 0 16px; color:#6b7280; font-size:13px;">This code expires in 10 minutes.</p>
    <p style="margin:0 0 16px; color:#374151;">If you did not request this, you can safely ignore this email.</p>
    <p style="margin:0; color:#6b7280; font-size:12px;">Need help? Visit $site_url</p>
  </div>
</div>';

  update_option('loginizer_2fa_email_template', $option);
});

function customapi_get_session() {
  if (!isset($_SESSION['user'])) {
    return new WP_Error('unauthorized', 'Not logged in', ['status' => 403]);
  }

  $user_id = intval($_SESSION['user']['id'] ?? 0);
  $user = $user_id ? get_userdata($user_id) : null;
  $roles = $user && !empty($user->roles) ? $user->roles : [];

  $session = $_SESSION['user'];
  $session['roles'] = $roles;
  return $session;
}

function customapi_ping() {
  return rest_ensure_response(['status' => 'ok', 'timestamp' => time()]);
}
 
function customapi_is_employer($user_id = null) {
  if (!$user_id) {
    if (empty($_SESSION['user']['id'])) {
      return false;
    }
    $user_id = intval($_SESSION['user']['id']);
  }

  $user = get_userdata($user_id);
  if (!$user || empty($user->roles)) {
    return false;
  }

  return in_array('employer', (array) $user->roles, true);
}

function customapi_is_site_admin($user_id = null) {
  if (!$user_id) {
    if (empty($_SESSION['user']['id'])) {
      return false;
    }
    $user_id = intval($_SESSION['user']['id']);
  }

  $user = get_userdata($user_id);
  if (!$user || empty($user->roles)) {
    return false;
  }

  return in_array('site_admin', (array) $user->roles, true) || in_array('administrator', (array) $user->roles, true);
}

function customapi_is_employer_verified($user_id = null) {
  if (!$user_id) {
    if (empty($_SESSION['user']['id'])) {
      return false;
    }
    $user_id = intval($_SESSION['user']['id']);
  }
  $user = get_userdata($user_id);
  if (!$user || empty($user->roles)) {
    return false;
  }
  if (!in_array('employer', (array) $user->roles, true)) {
    return true;
  }
  return (bool) get_user_meta($user_id, 'employer_verified', true);
}

function customapi_set_user_hashes($user_id, $email, $username) {
  $email_norm = strtolower(trim((string) $email));
  $user_norm = strtolower(trim((string) $username));
  if ($email_norm !== '') {
    update_user_meta($user_id, 'email_hash', hash('sha256', $email_norm));
  }
  if ($user_norm !== '') {
    update_user_meta($user_id, 'username_hash', hash('sha256', $user_norm));
  }
}


// ⚙️ DEV-ONLY — Toggle current user's role and dump all users
add_action('template_redirect', function() {
  if (!is_user_logged_in() || !isset($_GET['switch_role']) || $_GET['switch_role'] !== 'toggle') {
      return;
  }
  if (!customapi_is_site_admin()) {
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
// ---------------------------------------------------------------------------
// Custom API endpoints (split by area)
// ---------------------------------------------------------------------------
require_once get_template_directory() . '/encrypt.php';
require_once get_template_directory() . '/inc/stripe-job.php';
require_once get_template_directory() . '/customapi_profile_stuff.php';
require_once get_template_directory() . '/customapi_stripe.php';
require_once get_template_directory() . '/customapi_posts.php';
// require_once get_template_directory() . '/customapi_get_user_jobs.php';
require_once get_template_directory() . '/customapi_get_lists.php';
require_once get_template_directory() . '/customapi_apply.php';
require_once get_template_directory() . '/customapi_admin.php';
require_once get_template_directory() . '/customapi_contact.php';
// require_once get_template_directory() . '/customapi_resume.php';
// require_once get_template_directory() . '/customapi_magic_link.php';


?>
