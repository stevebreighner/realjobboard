<?php 

if (session_status() === PHP_SESSION_NONE) {
  session_start();
}


// REGISTER
function customapi_register_user($request) {
  $username = sanitize_text_field($request['username']);
  $email    = sanitize_email($request['email']);
  $password = $request['password'];
  $role     = sanitize_text_field($request['role']); // "employer" or "employee"

  if (!$username || !$email || !$password || !$role) {
      return new WP_Error('missing_fields', 'All fields required', ['status' => 400]);
  }

  if (!in_array($role, ['employer', 'employee'])) {
      return new WP_Error('invalid_role', 'Role must be employer or employee', ['status' => 400]);
  }

  if (email_exists($email)) {
      return new WP_Error('email_exists', 'Email already in use', ['status' => 409]);
  }

  // Create user
  $user_id = wp_create_user($username, $password, $email);

  if (is_wp_error($user_id)) {
      return new WP_Error('db_error', 'Could not register', ['status' => 500]);
  }

  // Assign the role
  $user = new WP_User($user_id);
  $user->set_role($role); // make sure "employer" and "employee" exist as roles in WP

  return ['message' => '✅ Registered', 'user_id' => $user_id, 'role' => $role];
}


function customapi_login_user($request) {
  error_log('💡 Login endpoint hit');

  $email_or_username = sanitize_text_field($request['email']);
  $password = $request['password'];

  $user = wp_authenticate($email_or_username, $password);
  if (is_wp_error($user)) {
    return new WP_Error('invalid_credentials', 'Invalid credentials', ['status' => 401]);
  }

  $user_id = $user->ID;

  // 👇 Check if user needs 2FA and hasn't verified in last 24h
  $last_verified = get_user_meta($user_id, '2fa_last_verified', true);
  if (!$last_verified || (time() - (int)$last_verified) > 86400) {
    $_SESSION['pending_2fa_user_id'] = $user_id; // store temporarily
    return ['twoFARequired' => true];
  }

  // ✅ Otherwise, set session now
  $_SESSION['user'] = [
    'id'       => $user->ID,
    'username' => $user->user_login,
    'email'    => $user->user_email,
  ];

  return ['message' => '✅ Login successful', 'user' => $_SESSION['user']];
}


function customapi_get_user_profile() {
  if (!isset($_SESSION['user'])) {
      return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
  }

  $user_id = $_SESSION['user']['id'];
  $user = get_userdata($user_id);
  $_SESSION['user']['roles'] = $user->roles;

  return [
      'id'           => $user->ID,
      'email'        => $user->user_email,
      'username'     => $user->user_login,
      'display_name' => $user->display_name,
      'avatar_url'   => get_user_meta($user_id, 'custom_avatar_url', true),
      'first_name'   => get_user_meta($user_id, 'first_name', true),
      'last_name'    => get_user_meta($user_id, 'last_name', true),
      'company'      => get_user_meta($user_id, 'company', true),
      'dob'          => get_user_meta($user_id, 'dob', true),
      'resumes'      => get_user_meta($user_id, 'user_resumes', true) ?: [],
      'cover_letters'=> get_user_meta($user_id, 'user_covers', true) ?: [],
      'roles'        => $user->roles,
  ];
}




function customapi_delete_resume($data) {
  $user_id = $_SESSION['user']['id'];
  $time = intval($data['time']);
  $resumes = get_user_meta($user_id, 'user_resumes', true) ?: [];

  $found = false;
  foreach ($resumes as $key => $resume) {
      if ($resume['time'] === $time) {
          // Remove file from uploads if exists
          $file_path = str_replace(site_url('/'), ABSPATH, $resume['url']);
          if (file_exists($file_path)) unlink($file_path);
          unset($resumes[$key]);
          $found = true;
          break;
      }
  }

  if (!$found) {
      return new WP_Error('not_found', 'Resume not found', ['status' => 404]);
  }

  update_user_meta($user_id, 'user_resumes', array_values($resumes));
  return ['success' => true];
}

function customapi_delete_cover($data) {
  $user_id = $_SESSION['user']['id'];
  $time = intval($data['time']);
  $covers = get_user_meta($user_id, 'user_covers', true) ?: [];

  $found = false;
  foreach ($covers as $key => $cover) {
      if ($cover['time'] === $time) {
          $file_path = str_replace(site_url('/'), ABSPATH, $cover['url']);
          if (file_exists($file_path)) unlink($file_path);
          unset($covers[$key]);
          $found = true;
          break;
      }
  }

  if (!$found) {
      return new WP_Error('not_found', 'Cover letter not found', ['status' => 404]);
  }

  update_user_meta($user_id, 'user_covers', array_values($covers));
  return ['success' => true];
}

function customapi_user_profile_update() {
  if (!isset($_SESSION['user'])) {
      return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
  }

  $user_id = $_SESSION['user']['id'];

  // Simple text/meta fields
  $fields = ['first_name', 'last_name', 'dob', 'company'];
  foreach ($fields as $field) {
      if (isset($_POST[$field])) {
          update_user_meta($user_id, $field, sanitize_text_field($_POST[$field]));
      }
  }
//end here to check }
  require_once(ABSPATH . 'wp-admin/includes/file.php');

  // Handle avatar upload (single)
  if (!empty($_FILES['avatar']) && !$_FILES['avatar']['error']) {
      $file   = $_FILES['avatar'];
      $upload = wp_handle_upload($file, ['test_form' => false]);

      if (isset($upload['url'])) {
          update_user_meta($user_id, 'custom_avatar_url', esc_url($upload['url']));
      } else {
          return new WP_Error('upload_error', 'Avatar upload failed');
      }
  }

  // Helper for file validation
  $allowed_docs = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Handle resume upload (multiple)
  if (!empty($_FILES['resume']) && !$_FILES['resume']['error']) {
      $file = $_FILES['resume'];
      if (!in_array($file['type'], $allowed_docs)) {
          return new WP_Error('invalid_type', 'Resume must be PDF or DOC/DOCX', ['status' => 415]);
      }

      $upload = wp_handle_upload($file, ['test_form' => false]);
      if (isset($upload['url'])) {
          $resumes = get_user_meta($user_id, 'user_resumes', true);
          if (!is_array($resumes)) {
              $resumes = [];
          }

          $resumes[] = [
              'url'  => esc_url($upload['url']),
              'name' => basename($upload['file']),
              'time' => time(),
          ];

          update_user_meta($user_id, 'user_resumes', $resumes);
      } else {
          return new WP_Error('upload_error', 'Resume upload failed');
      }
  }

// Handle cover letter upload (multiple)
if (!empty($_FILES['cover_letter']) && !$_FILES['cover_letter']['error']) {
  $file = $_FILES['cover_letter'];

  if (!in_array($file['type'], $allowed_docs)) {
      return rest_ensure_response([
          'success' => false,
          'message' => 'Cover letter must be PDF or DOC/DOCX'
      ]);
  }

  $upload = wp_handle_upload($file, ['test_form' => false]);

  if (isset($upload['error'])) {
      error_log("Cover letter upload error: " . $upload['error']);
      return rest_ensure_response([
          'success' => false,
          'message' => 'Cover letter upload failed: ' . $upload['error']
      ]);
  }

  $covers = get_user_meta($user_id, 'user_covers', true);
  if (!is_array($covers)) {
      $covers = [];
  }

  $covers[] = [
      'url'  => esc_url($upload['url']),
      'name' => basename($upload['file']),
      'time' => time(),
  ];

  update_user_meta($user_id, 'user_covers', $covers);
}


  return ['success' => true];
}

  function customapi_user_profile_avatar() {
    if (!isset($_SESSION['user'])) {
      return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
    }
  
    if (empty($_FILES['avatar'])) {
      return new WP_Error('no_file', 'No avatar uploaded', ['status' => 400]);
    }
  
    $file = $_FILES['avatar'];
    $allowed = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowed)) {
      return new WP_Error('invalid_type', 'Only JPG, PNG, or GIF allowed', ['status' => 415]);
    }
  
    require_once ABSPATH . 'wp-admin/includes/file.php';
    $upload_dir = wp_upload_dir();
    $user_id = $_SESSION['user']['id'];
    $overrides = ['test_form' => false, 'unique_filename_callback' => null];
    $uploaded = wp_handle_upload($file, $overrides);
  
    if (isset($uploaded['error'])) {
      return new WP_Error('upload_error', $uploaded['error'], ['status' => 500]);
    }
  
    update_user_meta($user_id, 'custom_avatar_url', esc_url_raw($uploaded['url']));
    return ['message' => '✅ Avatar uploaded', 'url' => $uploaded['url']];
  }
  



  function customapi_forgot_password($request) {
    $params = $request->get_json_params();
    $email = sanitize_email($params['email'] ?? '');

    if (empty($email) || !is_email($email)) {
        return new WP_Error('invalid_email', 'Enter a valid email.', ['status' => 400]);
    }

    $user = get_user_by('email', $email);
    if (!$user) {
        // Do not reveal user existence
        return ['message' => '📧 If the email is valid, a reset link has been sent.'];
    }

    // Rate limit: 1 request per 15 minutes
    $rate_key = 'pw_reset_rate_' . $user->ID;
    $last_request = get_transient($rate_key);
    if ($last_request) {
        return new WP_Error('rate_limited', 'Please wait before requesting another reset.', ['status' => 429]);
    }
    set_transient($rate_key, time(), 15 * MINUTE_IN_SECONDS);

    $token = bin2hex(random_bytes(24));
    update_user_meta($user->ID, 'custom_reset_token', $token);
    update_user_meta($user->ID, 'custom_reset_expires', time() + 3600); // 1 hour expiry

    // Remove user_id from the reset URL here:
    $reset_url = site_url("/#reset-password?token=$token");

    wp_mail($user->user_email, 'Reset Your Password', "Click this link to reset:\n\n$reset_url");

    return ['message' => '📧 If the email is valid, a reset link has been sent.'];
}


function customapi_reset_password(WP_REST_Request $request) {
  $params = $request->get_json_params();
  $token = sanitize_text_field($params['token'] ?? '');
  $new_password = $params['new_password'] ?? '';

  if (empty($token) || empty($new_password)) {
      return new WP_Error('invalid_request', 'Token and new password required', ['status' => 400]);
  }

  $user_query = new WP_User_Query([
      'meta_key' => 'custom_reset_token',
      'meta_value' => $token,
      'number' => 1,
      'count_total' => false,
  ]);

  if (empty($user_query->results)) {
      return new WP_Error('invalid_token', 'Invalid or expired reset token', ['status' => 400]);
  }

  $user = $user_query->results[0];
  $user_id = $user->ID;

  $token_expiry = (int) get_user_meta($user_id, 'custom_reset_expires', true);
  if (!$token_expiry || time() > $token_expiry) {
      return new WP_Error('expired_token', 'Reset token has expired', ['status' => 400]);
  }

  // Disallow resetting to the current password
  if (wp_check_password($new_password, $user->user_pass, $user_id)) {
      return new WP_Error('password_reuse', 'New password cannot be the same as the old password.', ['status' => 400]);
  }

  wp_set_password($new_password, $user_id);

  delete_user_meta($user_id, 'custom_reset_token');
  delete_user_meta($user_id, 'custom_reset_expires');

  return ['message' => 'Password reset successfully'];
}






function customapi_update_password($request) {
  if (!isset($_SESSION['user'])) {
    return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
  }

  $user_id = $_SESSION['user']['id'];
  $params = $request->get_json_params();

  $current_password = $params['current_password'] ?? '';
  $new_password = $params['new_password'] ?? '';

  if (!$current_password || !$new_password) {
    return new WP_Error('missing_fields', 'Current and new password are required', ['status' => 400]);
  }

  $user = get_userdata($user_id);

  if (!wp_check_password($current_password, $user->user_pass, $user_id)) {
    return new WP_Error('invalid_password', 'Current password is incorrect', ['status' => 403]);
  }

  // Disallow new password same as current
  if (wp_check_password($new_password, $user->user_pass, $user_id)) {
    return new WP_Error('password_reuse', 'New password cannot be the same as the old password.', ['status' => 400]);
  }

  $result = wp_update_user([
    'ID' => $user_id,
    'user_pass' => $new_password
  ]);

  if (is_wp_error($result)) {
    return new WP_Error('update_failed', 'Password update failed: ' . $result->get_error_message(), ['status' => 500]);
  }

  $to = $user->user_email;
  $subject = 'Your password has been changed';
  $message = "Hello " . $user->display_name . ",\n\nYour account password was successfully updated.\n\nIf you did not perform this change, please contact support immediately.\n\nThank you.";

  $headers = [
      'Content-Type: text/plain; charset=UTF-8',
      'From: ' . EMAIL_FROM_NAME . ' <' . EMAIL_FROM_ADDRESS . '>'
  ];

  wp_mail($to, $subject, $message, $headers);

  return ['message' => '✅ Password updated successfully'];
}


  // APPLY TO JOB
  function customapi_apply_to_job($request) {
    global $wpdb;
    if (!isset($_SESSION['user'])) {
      return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
    }
  
    $user_id = $_SESSION['user']['id'];
    $job_id = intval($request['job_id']);
$message = "Hello " . $user->display_name . ",\n\n"
    . "Your account password was successfully updated.\n\n"
    . "If you did not perform this change, please contact our support team immediately:\n"
    . SUPPORT_EMAIL . "\n\n"
    . "Thank you,\n"
    . EMAIL_FROM_NAME . "\n"
    . WEBSITE_URL . "\n";
  
    $success = $wpdb->insert("{$wpdb->prefix}applications", [
      'user_id'    => $user_id,
      'job_id'     => $job_id,
      'message'    => $message,
      'applied_at' => current_time('mysql'),
    ]);
  
    return $success ? ['message' => '✅ Application submitted'] : new WP_Error('db_error', 'Failed to apply', ['status' => 500]);
  }
  
  
  
  
  
// LOGOUT
function customapi_logout_user() {
  session_destroy();
  return ['message' => '✅ Logged out'];
}
// 2FA START
function customapi_2fa_start(WP_REST_Request $request) {
  $params = $request->get_json_params();
  
  error_log('2FA start called. Params: ' . print_r($params, true));
  error_log('Session user: ' . print_r($_SESSION['user'] ?? null, true));
  error_log('Session pending 2FA: ' . ($_SESSION['pending_2fa_user_id'] ?? 'none'));

  $user_id = isset($params['user_id']) ? (int)$params['user_id'] : (
              $_SESSION['user']['id'] ?? $_SESSION['pending_2fa_user_id'] ?? 0
            );

  if (!$user_id) {
    return new WP_Error('unauthorized', 'User ID missing or not logged in', ['status' => 403]);
  }

  $user = get_userdata($user_id);
  if (!$user) {
    return new WP_Error('not_found', 'User not found', ['status' => 404]);
  }

  // Rate limiting: max 3 codes per 15 minutes
  $rate_key = '2fa_rate_limit_times';
  $timestamps = get_user_meta($user_id, $rate_key, true) ?: [];
  $now = time();
  $timestamps = array_filter($timestamps, fn($t) => ($now - $t) < 900);

  if (count($timestamps) >= 3) {
    return new WP_Error('rate_limited', 'Too many 2FA requests. Please wait before trying again.', ['status' => 429]);
  }

  $timestamps[] = $now;
  update_user_meta($user_id, $rate_key, $timestamps);

  // Generate 6-digit code
  $code = random_int(100000, 999999);
  update_user_meta($user_id, '2fa_code', $code);
  update_user_meta($user_id, '2fa_code_expires', $now + 300); // expires in 5 mins

  // Email setup
  $to = $user->user_email;
  $subject = 'Your 2FA Verification Code';

  if (!defined('SUPPORT_EMAIL')) define('SUPPORT_EMAIL', 'support@example.com');
  if (!defined('EMAIL_FROM_NAME')) define('EMAIL_FROM_NAME', 'Your Company Name');
  if (!defined('WEBSITE_URL')) define('WEBSITE_URL', 'https://yourwebsite.com');

  $message = "Hello " . $user->display_name . ",\n\n"
           . "Your two-factor authentication (2FA) verification code is: {$code}\n\n"
           . "This code will expire in 5 minutes.\n\n"
           . "If you did not request this code, please contact our support team immediately:\n"
           . SUPPORT_EMAIL . "\n\n"
           . "Thank you,\n"
           . EMAIL_FROM_NAME . "\n"
           . WEBSITE_URL . "\n";

  $headers = ['Content-Type: text/plain; charset=UTF-8'];

  error_log("Sending 2FA to $to. Code: $code");
  $sent = wp_mail($to, $subject, $message, $headers);

  if (!$sent) {
    return new WP_Error('email_failed', 'Failed to send 2FA code email', ['status' => 500]);
  }

  // Save pending user session for 2FA
  $_SESSION['pending_2fa_user_id'] = $user_id;

  return ['message' => '✅ 2FA code sent via email'];
}



// 2FA VERIFY
function customapi_2fa_verify(WP_REST_Request $request) {
  $code = sanitize_text_field($request->get_param('code'));

  if (empty($_SESSION['pending_2fa_user_id'])) {
    return new WP_Error('unauthorized', 'No pending 2FA session', ['status' => 403]);
  }

  $user_id = $_SESSION['pending_2fa_user_id'];
  $expected_code = get_user_meta($user_id, '2fa_code', true);
  $expires = (int)get_user_meta($user_id, '2fa_code_expires', true);

  if (time() > $expires) {
    return new WP_Error('expired_code', '2FA code has expired', ['status' => 410]);
  }

  if ($code !== $expected_code) {
    return new WP_Error('invalid_code', 'Invalid 2FA code', ['status' => 401]);
  }

  // 2FA successful: initialize full session
  $user = get_userdata($user_id);
  $_SESSION['user'] = [
    'id'       => $user->ID,
    'username' => $user->user_login,
    'email'    => $user->user_email,
  ];

  // Clean up
  delete_user_meta($user_id, '2fa_code');
  delete_user_meta($user_id, '2fa_code_expires');
  $_SESSION['pending_2fa_user_id'] = null;

  // Record last 2FA verification time
  update_user_meta($user_id, '2fa_last_verified', time());

  return ['message' => '✅ 2FA verification successful'];
}

  ?>