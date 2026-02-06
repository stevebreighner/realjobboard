<?php 

if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

function customapi_validate_us_address($street1, $city, $state, $zip, $country, $require_street = true) {
  $usa_values = ['usa', 'us', 'united states', 'united states of america'];
  $country_norm = strtolower(trim((string) $country));
  if (!in_array($country_norm, $usa_values, true)) {
    return new WP_Error('invalid_country', 'USA only: please enter United States.', ['status' => 400]);
  }

  $city = trim((string) $city);
  $state = strtoupper(trim((string) $state));
  $zip = trim((string) $zip);
  $street1 = trim((string) $street1);

  if ($require_street) {
    if (!$street1 || !preg_match('/\d+/', $street1) || !preg_match('/[a-zA-Z]{2,}/', $street1)) {
      return new WP_Error('invalid_street', 'Street address must include a number and street name.', ['status' => 400]);
    }
  } elseif ($street1) {
    if (!preg_match('/\d+/', $street1) || !preg_match('/[a-zA-Z]{2,}/', $street1)) {
      return new WP_Error('invalid_street', 'Street address must include a number and street name.', ['status' => 400]);
    }
  }

  if (!$city) {
    return new WP_Error('missing_city', 'City is required.', ['status' => 400]);
  }
  if (!$state || !preg_match('/^[A-Z]{2}$/', $state)) {
    return new WP_Error('missing_state', 'Please select a valid state.', ['status' => 400]);
  }
  if (!$zip || !preg_match('/^\d{5}(-\d{4})?$/', $zip)) {
    return new WP_Error('invalid_zip', 'ZIP must be 5 digits (or 5+4).', ['status' => 400]);
  }

  $verify = wp_remote_get('https://api.zippopotam.us/us/' . urlencode(substr($zip, 0, 5)), ['timeout' => 10]);
  if (is_wp_error($verify)) {
    return new WP_Error('zip_verify_failed', 'Unable to verify ZIP code. Please try again.', ['status' => 502]);
  }
  $body = json_decode(wp_remote_retrieve_body($verify), true);
  if (empty($body['places'])) {
    return new WP_Error('zip_invalid', 'ZIP code not found.', ['status' => 400]);
  }

  $city_norm = strtolower($city);
  $state_norm = strtoupper($state);
  $matched = false;
  foreach ($body['places'] as $place) {
    $place_city = strtolower($place['place name'] ?? '');
    $place_state = strtoupper($place['state abbreviation'] ?? '');
    if ($place_city === $city_norm && $place_state === $state_norm) {
      $matched = true;
      break;
    }
  }
  if (!$matched) {
    return new WP_Error('zip_mismatch', 'City and state do not match the ZIP code.', ['status' => 400]);
  }

  return true;
}

function customapi_extract_resume_text($file_path, $mime) {
  if (!$file_path || !file_exists($file_path)) {
    return '';
  }

  $text = '';
  if ($mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    if (class_exists('ZipArchive')) {
      $zip = new ZipArchive();
      if ($zip->open($file_path) === true) {
        $data = $zip->getFromName('word/document.xml');
        $zip->close();
        if ($data !== false) {
          $text = wp_strip_all_tags($data);
        }
      }
    }
  } elseif ($mime === 'application/pdf') {
    if (function_exists('shell_exec')) {
      $tmp = tempnam(sys_get_temp_dir(), 'pdftext_');
      if ($tmp) {
        @shell_exec('pdftotext ' . escapeshellarg($file_path) . ' ' . escapeshellarg($tmp) . ' 2>/dev/null');
        if (file_exists($tmp)) {
          $text = file_get_contents($tmp) ?: '';
          @unlink($tmp);
        }
      }
    }
  }

  $text = preg_replace('/\s+/', ' ', (string) $text);
  return trim($text);
}


// REGISTER
function customapi_register_user($request) {
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  $honeypot = trim($request['website'] ?? '');
  $ts = intval($request['ts'] ?? 0);
  $turnstile_token = sanitize_text_field($request['turnstile_token'] ?? '');

  if ($honeypot !== '') {
      return new WP_Error('bot_detected', 'Invalid submission', ['status' => 400]);
  }

  if (!$ts || (time() - $ts) < 3) {
      return new WP_Error('too_fast', 'Please take a moment before submitting.', ['status' => 400]);
  }

  $rate_key = 'reg_rate_' . md5($ip);
  $rate_count = (int) get_transient($rate_key);
  if ($rate_count >= 5) {
      return new WP_Error('rate_limited', 'Too many registrations. Try again later.', ['status' => 429]);
  }
  set_transient($rate_key, $rate_count + 1, 10 * MINUTE_IN_SECONDS);

  $dev_mode = (int) get_option('customapi_dev_mode', 0);
  if (!$dev_mode) {
      if (empty($turnstile_token)) {
          return new WP_Error('captcha_required', 'Please complete the captcha.', ['status' => 400]);
      }

      if (!defined('TURNSTILE_SECRET') || !TURNSTILE_SECRET) {
          return new WP_Error('captcha_config', 'Captcha is not configured.', ['status' => 500]);
      }

      $verify = wp_remote_post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
          'timeout' => 10,
          'body' => [
              'secret' => TURNSTILE_SECRET,
              'response' => $turnstile_token,
              'remoteip' => $ip,
          ],
      ]);

      if (is_wp_error($verify)) {
          return new WP_Error('captcha_error', 'Captcha verification failed.', ['status' => 502]);
      }

      $verify_body = json_decode(wp_remote_retrieve_body($verify), true);
      if (empty($verify_body['success'])) {
          return new WP_Error('captcha_invalid', 'Captcha verification failed.', ['status' => 400]);
      }
  }

  $username = sanitize_text_field($request['username']);
  $email    = sanitize_email($request['email']);
  $password = $request['password'];
  $role     = sanitize_text_field($request['role']); // "employer" or "employee"
  $company_site = sanitize_text_field($request['company_site'] ?? '');
  $company_email = sanitize_email($request['company_email'] ?? '');
  $company_name = sanitize_text_field($request['company'] ?? '');

  if (!$username || !$email || !$password || !$role) {
      return new WP_Error('missing_fields', 'All fields required', ['status' => 400]);
  }

  if (!in_array($role, ['employer', 'employee'])) {
      return new WP_Error('invalid_role', 'Role must be employer or employee', ['status' => 400]);
  }

  if ($role === 'employer') {
      if (empty($company_site) || empty($company_email)) {
          return new WP_Error('missing_company', 'Company website and company email are required for employers.', ['status' => 400]);
      }
      $free_domains = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com','aol.com','proton.me','protonmail.com'];
      $email_domain = '';
      if (strpos($company_email, '@') !== false) {
          $email_domain = strtolower(substr(strrchr($company_email, '@'), 1));
      }
      if (!$email_domain || in_array($email_domain, $free_domains, true)) {
          return new WP_Error('invalid_company_email', 'Please use a company email address.', ['status' => 400]);
      }
      $host = '';
      $parsed = wp_parse_url($company_site);
      if (!empty($parsed['host'])) {
          $host = preg_replace('/^www\./', '', strtolower($parsed['host']));
      } else {
          // attempt with https:// if missing scheme
          $parsed = wp_parse_url('https://' . ltrim($company_site, '/'));
          if (!empty($parsed['host'])) {
              $host = preg_replace('/^www\./', '', strtolower($parsed['host']));
          }
      }
      if (!$host || substr($email_domain, -strlen($host)) !== $host) {
          return new WP_Error('domain_mismatch', 'Company email must match website domain.', ['status' => 400]);
      }
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
  if (!get_role('pending')) add_role('pending', 'Pending');
  if (!get_role('employer')) add_role('employer', 'Employer');
  if (!get_role('employee')) add_role('employee', 'Employee');

  $user->set_role('pending');
  update_user_meta($user_id, 'desired_role', $role);
  update_user_meta($user_id, 'email_verified', 0);
  if ($role === 'employer') {
      update_user_meta($user_id, 'employer_verified', 0);
  }
  if ($role === 'employer') {
      if ($company_name) {
          update_user_meta($user_id, 'company', $company_name);
      }
      if ($company_site) {
          update_user_meta($user_id, 'company_site', $company_site);
      }
      if ($company_email) {
          update_user_meta($user_id, 'company_email', $company_email);
      }
  }
  $address_fields = ['street1', 'street2', 'city', 'state', 'zip', 'country'];
  $address = [
      'street1' => $request['street1'] ?? '',
      'city' => $request['city'] ?? '',
      'state' => $request['state'] ?? '',
      'zip' => $request['zip'] ?? '',
      'country' => $request['country'] ?? '',
  ];
  $addr_check = customapi_validate_us_address(
      $address['street1'],
      $address['city'],
      $address['state'],
      $address['zip'],
      $address['country'],
      true
  );
  if (is_wp_error($addr_check)) {
      return $addr_check;
  }
  foreach ($address_fields as $field) {
      if (isset($request[$field])) {
          update_user_meta($user_id, $field, sanitize_text_field($request[$field]));
      }
  }
  customapi_set_user_hashes($user_id, $email, $username);

  if (function_exists('customapi_notify_site_admins')) {
      $role_label = $role === 'employer' ? 'Employer' : 'Employee';
      $company_info = $role === 'employer'
        ? "Company: {$company_name}\nCompany Email: {$company_email}\nCompany Site: {$company_site}\n"
        : '';
      customapi_notify_site_admins(
        'New registration (' . $role_label . ')',
        "User: {$username}\nEmail: {$email}\nRole: {$role_label}\n{$company_info}User ID: {$user_id}"
      );
      if ($role === 'employer') {
          customapi_notify_site_admins(
            'Employer verification required',
            "Employer signup needs verification.\nUser: {$username}\nEmail: {$email}\nCompany Email: {$company_email}\nCompany Site: {$company_site}\nUser ID: {$user_id}"
          );
      }
  }

  $token = bin2hex(random_bytes(32));
  $token_hash = hash('sha256', $token);
  update_user_meta($user_id, 'email_verify_token', $token_hash);
  update_user_meta($user_id, 'email_verify_expires', time() + DAY_IN_SECONDS);

  $verify_url = home_url("/wp-json/customapi/v1/verify-email?uid=$user_id&token=$token");
  $subject = 'Verify your email';
  $message = "Hi $username,\n\nPlease verify your email by clicking the link below:\n$verify_url\n\nThis link expires in 24 hours.";
  wp_mail($email, $subject, $message);

  return ['message' => '✅ Registered. Check your email to verify your account.', 'user_id' => $user_id, 'role' => $role];
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
  customapi_set_user_hashes($user_id, $user->user_email, $user->user_login);
  $verified = get_user_meta($user_id, 'email_verified', true);

  // Back-compat: allow existing users created before verification was added
  if ($verified === '') {
    $roles = (array) $user->roles;
    if (!in_array('pending', $roles, true)) {
      update_user_meta($user_id, 'email_verified', 1);
      $verified = 1;
    }
  }

  if (!$verified) {
    return new WP_Error('email_not_verified', 'Please verify your email before logging in.', ['status' => 403]);
  }

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

function customapi_verify_email($request) {
  $user_id = intval($request['uid'] ?? 0);
  $token = sanitize_text_field($request['token'] ?? '');

  if (!$user_id || !$token) {
    return new WP_Error('invalid_request', 'Invalid verification link.', ['status' => 400]);
  }

  $stored_hash = get_user_meta($user_id, 'email_verify_token', true);
  $expires = intval(get_user_meta($user_id, 'email_verify_expires', true));

  if (!$stored_hash || !$expires || time() > $expires) {
    return new WP_Error('expired', 'Verification link expired. Please register again.', ['status' => 400]);
  }

  if (!hash_equals($stored_hash, hash('sha256', $token))) {
    return new WP_Error('invalid_token', 'Invalid verification link.', ['status' => 400]);
  }

  update_user_meta($user_id, 'email_verified', 1);
  delete_user_meta($user_id, 'email_verify_token');
  delete_user_meta($user_id, 'email_verify_expires');

  $desired_role = get_user_meta($user_id, 'desired_role', true);
  if (!in_array($desired_role, ['employer', 'employee'])) {
    $desired_role = 'subscriber';
  }

  $user = new WP_User($user_id);
  $user->set_role($desired_role);
  if ($desired_role === 'employer' && get_user_meta($user_id, 'employer_verified', true) === '') {
    update_user_meta($user_id, 'employer_verified', 0);
  }

  return ['message' => '✅ Email verified. You can now log in.'];
}

function customapi_resend_verification($request) {
  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
  $email = sanitize_email($request['email'] ?? '');

  if (!$email) {
    return new WP_Error('missing_email', 'Email is required.', ['status' => 400]);
  }

  $rate_key = 'resend_rate_' . md5($ip);
  $rate_count = (int) get_transient($rate_key);
  if ($rate_count >= 5) {
    return new WP_Error('rate_limited', 'Too many requests. Try again later.', ['status' => 429]);
  }
  set_transient($rate_key, $rate_count + 1, 10 * MINUTE_IN_SECONDS);

  $user = get_user_by('email', $email);
  if (!$user) {
    return ['message' => 'If that email exists, a verification link has been sent.'];
  }

  $verified = get_user_meta($user->ID, 'email_verified', true);
  if ($verified) {
    return ['message' => 'If that email exists, a verification link has been sent.'];
  }

  $token = bin2hex(random_bytes(32));
  $token_hash = hash('sha256', $token);
  update_user_meta($user->ID, 'email_verify_token', $token_hash);
  update_user_meta($user->ID, 'email_verify_expires', time() + DAY_IN_SECONDS);

  $verify_url = home_url("/wp-json/customapi/v1/verify-email?uid={$user->ID}&token=$token");
  $subject = 'Verify your email';
  $message = "Hi {$user->user_login},\n\nPlease verify your email by clicking the link below:\n$verify_url\n\nThis link expires in 24 hours.";
  wp_mail($email, $subject, $message);

  return ['message' => 'If that email exists, a verification link has been sent.'];
}

function customapi_get_user_profile(WP_REST_Request $request = null) {
    // Ensure the user is logged in
    if (!isset($_SESSION['user'])) {
        return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
    }

    $user_id = $_SESSION['user']['id'];
    $user = get_userdata($user_id);
    $_SESSION['user']['roles'] = $user->roles;
    $light = false;
    if ($request) {
        $light = (bool) $request->get_param('light');
    }

    // Fetch user data
    $user_profile = [
        'id'           => $user->ID,
        'email'        => $user->user_email,
        'username'     => $user->user_login,
        'display_name' => $user->display_name,
        'avatar_url'   => get_user_meta($user_id, 'custom_avatar_url', true),
        'first_name'   => get_user_meta($user_id, 'first_name', true),
        'last_name'    => get_user_meta($user_id, 'last_name', true),
        'company'      => get_user_meta($user_id, 'company', true),
        'company_site' => get_user_meta($user_id, 'company_site', true),
        'company_key'  => get_user_meta($user_id, 'company_key', true),
        'dob'          => get_user_meta($user_id, 'dob', true),
        'hide_email'   => (bool) get_user_meta($user_id, 'hide_email', true),
        'employer_verified' => (bool) get_user_meta($user_id, 'employer_verified', true),
        'roles'        => $user->roles,
    ];

    if (!$light) {
        // Fetch resumes and decrypt them
        $resumes = get_user_meta($user_id, 'user_resumes', true) ?: [];

        // Retrieve encryption key
        $encryption_key = get_encryption_key($user_id);

        foreach ($resumes as $key => $resume) {
            // Decrypt each resume file
            $decrypted_file_path = decrypt_file($resume['url'], $encryption_key);

            if ($decrypted_file_path === false) {
                // If decryption fails, remove this resume from the list
                unset($resumes[$key]);
                // Optionally log or add an error message here
            } else {
                // Update the URL to point to the decrypted file
                $resumes[$key]['url'] = esc_url($decrypted_file_path);
            }
        }

        // Add decrypted resumes to the user profile
        $user_profile['resumes'] = $resumes;
        $user_profile['cover_letters'] = get_user_meta($user_id, 'user_covers', true) ?: [];
    } else {
        $user_profile['resumes'] = [];
        $user_profile['cover_letters'] = [];
    }

    return $user_profile;
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
    $fields = ['first_name', 'last_name', 'dob', 'company', 'company_site', 'company_key'];
    foreach ($fields as $field) {
        if (isset($_POST[$field])) {
            update_user_meta($user_id, $field, sanitize_text_field($_POST[$field]));
        }
    }
    if (isset($_POST['hide_email'])) {
        update_user_meta($user_id, 'hide_email', 1);
    } else {
        update_user_meta($user_id, 'hide_email', 0);
    }

    $street1 = sanitize_text_field($_POST['street1'] ?? '');
    $city = sanitize_text_field($_POST['city'] ?? '');
    $state = sanitize_text_field($_POST['state'] ?? '');
    $zip = sanitize_text_field($_POST['zip'] ?? '');
    $country = sanitize_text_field($_POST['country'] ?? '');
    if ($street1 || $city || $state || $zip || $country) {
        $addr_check = customapi_validate_us_address($street1, $city, $state, $zip, $country, true);
        if (is_wp_error($addr_check)) {
            return $addr_check;
        }
        update_user_meta($user_id, 'street1', $street1);
        update_user_meta($user_id, 'street2', sanitize_text_field($_POST['street2'] ?? ''));
        update_user_meta($user_id, 'city', $city);
        update_user_meta($user_id, 'state', $state);
        update_user_meta($user_id, 'zip', $zip);
        update_user_meta($user_id, 'country', $country);
    }

    require_once(ABSPATH . 'wp-admin/includes/file.php');

    // Handle avatar upload (single)
    if (!empty($_FILES['avatar']) && !$_FILES['avatar']['error']) {
        $file = $_FILES['avatar'];
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
        // Check if it's a multiple file upload
        if (is_array($_FILES['resume']['name'])) {
            // Loop through each uploaded file
            foreach ($_FILES['resume']['name'] as $index => $name) {
                $file = [
                    'name'     => $_FILES['resume']['name'][$index],
                    'type'     => $_FILES['resume']['type'][$index],
                    'tmp_name' => $_FILES['resume']['tmp_name'][$index],
                    'error'    => $_FILES['resume']['error'][$index],
                    'size'     => $_FILES['resume']['size'][$index],
                ];

                // Validate file type
                if (!in_array($file['type'], $allowed_docs)) {
                    return new WP_Error('invalid_type', 'Resume must be PDF or DOC/DOCX', ['status' => 415]);
                }

                // Handle file upload
                $upload = wp_handle_upload($file, ['test_form' => false]);

                if (isset($upload['url'])) {
                    // Retrieve the encryption key for the user
                    $encryption_key = get_encryption_key($user_id);
                    $resume_text = customapi_extract_resume_text($upload['file'], $file['type']);

                    // Encrypt the uploaded file before saving
                    $encrypted_file_path = encrypt_file($upload['file'], $encryption_key);

                    // If encryption fails, return error
                    if (!$encrypted_file_path) {
                        return new WP_Error('encryption_failed', 'Resume encryption failed', ['status' => 500]);
                    }

                    // Save the encrypted resume details in the database
                    $resumes = get_user_meta($user_id, 'user_resumes', true) ?: [];

                    $resumes[] = [
                        'url'  => esc_url($encrypted_file_path),
                        'name' => basename($encrypted_file_path),
                        'time' => time(),
                        'text' => $resume_text,
                    ];

                    update_user_meta($user_id, 'user_resumes', $resumes);
                } else {
                    return new WP_Error('upload_error', 'Resume upload failed');
                }
            }
        } else {
            // Single file upload scenario
            $file = $_FILES['resume'];

            // Validate file type
            if (!in_array($file['type'], $allowed_docs)) {
                return new WP_Error('invalid_type', 'Resume must be PDF or DOC/DOCX', ['status' => 415]);
            }

            $upload = wp_handle_upload($file, ['test_form' => false]);

            if (isset($upload['url'])) {
                // Retrieve the encryption key for the user
                $encryption_key = get_encryption_key($user_id);
                $resume_text = customapi_extract_resume_text($upload['file'], $file['type']);

                // Encrypt the uploaded file before saving
                $encrypted_file_path = encrypt_file($upload['file'], $encryption_key);

                // If encryption fails, return error
                if (!$encrypted_file_path) {
                    return new WP_Error('encryption_failed', 'Resume encryption failed', ['status' => 500]);
                }

                // Save the encrypted resume details in the database
                $resumes = get_user_meta($user_id, 'user_resumes', true) ?: [];

                $resumes[] = [
                    'url'  => esc_url($encrypted_file_path),
                    'name' => basename($encrypted_file_path),
                    'time' => time(),
                    'text' => $resume_text,
                ];

                update_user_meta($user_id, 'user_resumes', $resumes);
            } else {
                return new WP_Error('upload_error', 'Resume upload failed');
            }
        }
    }

    // Handle cover letter upload (multiple)
    if (!empty($_FILES['cover_letter']) && !$_FILES['cover_letter']['error']) {
        $file = $_FILES['cover_letter'];

        // Validate file type
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

        // Save cover letter to user meta
        $covers = get_user_meta($user_id, 'user_covers', true) ?: [];

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
