<?php

if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

function customapi_template_replace($text, $vars) {
  if (!is_string($text)) return $text;
  $replacements = [];
  foreach ($vars as $key => $val) {
    $replacements['{' . $key . '}'] = $val;
  }
  return str_replace(array_keys($replacements), array_values($replacements), $text);
}

function customapi_contact(WP_REST_Request $request) {
  $params = $request->get_json_params();
  $name = sanitize_text_field($params['name'] ?? '');
  $email = sanitize_email($params['email'] ?? '');
  $subject = sanitize_text_field($params['subject'] ?? 'Contact Form');
  $message = sanitize_textarea_field($params['message'] ?? '');
  $context = sanitize_text_field($params['context'] ?? '');

  if (!$name || !$email || !$message) {
    return new WP_Error('missing_fields', 'Name, email, and message are required.', ['status' => 400]);
  }

  $to = defined('SUPPORT_EMAIL') ? SUPPORT_EMAIL : get_option('admin_email');
  $full_subject = "[Contact] " . $subject;
  $body = "Name: $name\nEmail: $email\nContext: $context\n\n$message";
  $headers = ['Reply-To: ' . $email];

  $sent = wp_mail($to, $full_subject, $body, $headers);
  if (!$sent) {
    return new WP_Error('email_failed', 'Failed to send message.', ['status' => 500]);
  }

  return ['success' => true];
}

function customapi_contact_employer(WP_REST_Request $request) {
  if (empty($_SESSION['user']['id'])) {
    return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
  }

  $params = $request->get_json_params();
  $job_id = intval($params['job_id'] ?? 0);
  $message = sanitize_textarea_field($params['message'] ?? '');
  $sender_name = sanitize_text_field($params['name'] ?? '');
  $sender_email = sanitize_email($params['email'] ?? '');
  $turnstile_token = sanitize_text_field($params['turnstile_token'] ?? '');

  if (!$job_id || !$message) {
    return new WP_Error('missing_fields', 'Job ID and message are required.', ['status' => 400]);
  }

  if (empty($turnstile_token)) {
    return new WP_Error('captcha_required', 'Please complete the captcha.', ['status' => 400]);
  }

  if (!defined('TURNSTILE_SECRET') || !TURNSTILE_SECRET) {
    return new WP_Error('captcha_config', 'Captcha is not configured.', ['status' => 500]);
  }

  $ip = $_SERVER['REMOTE_ADDR'] ?? '';
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

  $post = get_post($job_id);
  if (!$post || $post->post_status !== 'publish') {
    return new WP_Error('not_found', 'Job not found.', ['status' => 404]);
  }

  $employer = get_user_by('ID', $post->post_author);
  if (!$employer) {
    return new WP_Error('not_found', 'Employer not found.', ['status' => 404]);
  }

  if (!$sender_name || !$sender_email) {
    $current_user = get_user_by('ID', intval($_SESSION['user']['id']));
    if ($current_user) {
      if (!$sender_name) $sender_name = $current_user->display_name;
      if (!$sender_email) $sender_email = $current_user->user_email;
    }
  }

  if (!$sender_name || !$sender_email) {
    return new WP_Error('missing_fields', 'Name and email are required.', ['status' => 400]);
  }

  $job_title = get_the_title($job_id);
  $company_name = get_post_meta($job_id, 'company', true);
  if ($company_name && strpos($company_name, '@') !== false) {
    $company_name = '';
  }
  $company_label = $company_name ?: (defined('EMAIL_BRAND_NAME') ? EMAIL_BRAND_NAME : get_bloginfo('name'));
  $vars = [
    'job_title' => $job_title,
    'company' => $company_label,
    'site_name' => get_bloginfo('name'),
    'site_url' => home_url('/'),
    'applicant_name' => $sender_name,
    'employer_name' => $employer->display_name,
  ];
  $message = customapi_template_replace($message, $vars);
  $subject = "[Job Inquiry] {$job_title}";
  $body = "Job: {$job_title}\nFrom: {$sender_name}\nEmail: {$sender_email}\n\n{$message}";
  $headers = ['Reply-To: ' . $sender_email];

  $sent = wp_mail($employer->user_email, $subject, $body, $headers);
  if (!$sent) {
    return new WP_Error('email_failed', 'Failed to send message.', ['status' => 500]);
  }

  return ['success' => true];
}

function customapi_contact_applicant(WP_REST_Request $request) {
  if (empty($_SESSION['user']['id'])) {
    return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
  }
  $employer_id = intval($_SESSION['user']['id']);
  if (!function_exists('customapi_is_employer') || !customapi_is_employer($employer_id)) {
    return new WP_Error('forbidden', 'Employer account required.', ['status' => 403]);
  }

  $params = $request->get_json_params();
  $job_id = intval($params['job_id'] ?? 0);
  $applicant_id = intval($params['user_id'] ?? 0);
  $message = sanitize_textarea_field($params['message'] ?? '');

  if (!$job_id || !$applicant_id || !$message) {
    return new WP_Error('missing_fields', 'job_id, user_id, and message are required.', ['status' => 400]);
  }

  $post = get_post($job_id);
  if (!$post || $post->post_status !== 'publish') {
    return new WP_Error('not_found', 'Job not found.', ['status' => 404]);
  }
  if ((int) $post->post_author !== $employer_id) {
    return new WP_Error('forbidden', 'Not your job post.', ['status' => 403]);
  }

  $applicant = get_user_by('ID', $applicant_id);
  if (!$applicant || empty($applicant->user_email)) {
    return new WP_Error('not_found', 'Applicant not found.', ['status' => 404]);
  }

  $job_title = get_the_title($job_id);
  $company_name = get_post_meta($job_id, 'company', true);
  if ($company_name && strpos($company_name, '@') !== false) {
    $company_name = '';
  }
  $company_label = $company_name ?: (defined('EMAIL_BRAND_NAME') ? EMAIL_BRAND_NAME : get_bloginfo('name'));
  $vars = [
    'job_title' => $job_title,
    'company' => $company_label,
    'site_name' => get_bloginfo('name'),
    'site_url' => home_url('/'),
    'applicant_name' => $applicant->display_name,
    'employer_name' => get_user_by('ID', $employer_id)->display_name ?? $company_label,
  ];
  $message = customapi_template_replace($message, $vars);
  $subject = function_exists('customapi_email_subject')
    ? customapi_email_subject('application_update', $job_title)
    : "Update on your application: {$job_title}";

  $body = "<p>You received a message from the employer.</p><p style=\"white-space:pre-line;\">{$message}</p>";
  $meta = [
    "Job: {$job_title}",
    "Company: {$company_label}",
  ];

  if (function_exists('customapi_email_template') && function_exists('customapi_send_html_mail')) {
    $html = customapi_email_template('Message from employer', $body, 'View Job', home_url("/#/list-detail?id={$job_id}"), $meta);
    $sent = customapi_send_html_mail($applicant->user_email, $subject, $html);
  } else {
    $sent = wp_mail($applicant->user_email, $subject, wp_strip_all_tags($message));
  }

  if (!$sent) {
    return new WP_Error('email_failed', 'Failed to send message.', ['status' => 500]);
  }

  return ['success' => true];
}

add_action('rest_api_init', function () {
  register_rest_route('customapi/v1', '/contact', [
    'methods' => 'POST',
    'callback' => 'customapi_contact',
    'permission_callback' => '__return_true',
  ]);

  register_rest_route('customapi/v1', '/contact-employer', [
    'methods' => 'POST',
    'callback' => 'customapi_contact_employer',
    'permission_callback' => '__return_true',
  ]);

  register_rest_route('customapi/v1', '/contact-applicant', [
    'methods' => 'POST',
    'callback' => 'customapi_contact_applicant',
    'permission_callback' => '__return_true',
  ]);
});

?>
