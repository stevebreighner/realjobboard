<?php

if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

function customapi_require_site_admin() {
  if (empty($_SESSION['user']['id'])) {
    return new WP_Error('unauthorized', 'Login required', ['status' => 401]);
  }
  $user_id = intval($_SESSION['user']['id']);
  if (!customapi_is_site_admin($user_id)) {
    return new WP_Error('forbidden', 'Site admin required', ['status' => 403]);
  }
  return $user_id;
}

function customapi_admin_log($action, $meta = []) {
  $entry = [
    'time' => time(),
    'admin_id' => intval($_SESSION['user']['id'] ?? 0),
    'action' => sanitize_text_field($action),
    'meta' => $meta,
  ];
  $log = get_option('customapi_admin_audit', []);
  if (!is_array($log)) $log = [];
  array_unshift($log, $entry);
  $log = array_slice($log, 0, 200);
  update_option('customapi_admin_audit', $log, false);
}

function customapi_admin_get_audit() {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;
  $log = get_option('customapi_admin_audit', []);
  if (!is_array($log)) $log = [];
  return rest_ensure_response($log);
}

function customapi_default_email_templates() {
  return [
    [
      'id' => 'applicant_received',
      'title' => 'Application received',
      'body' => 'Thanks for applying. We are reviewing your application and will be in touch soon.',
      'scope' => 'employer',
      'category' => 'Status',
    ],
    [
      'id' => 'applicant_interview',
      'title' => 'Interview request',
      'body' => 'We’d like to schedule a quick interview. Please reply with a few times that work for you this week.',
      'scope' => 'employer',
      'category' => 'Interview',
    ],
    [
      'id' => 'applicant_more_info',
      'title' => 'Request more info',
      'body' => 'Could you share a few more details about your recent experience with this role?',
      'scope' => 'employer',
      'category' => 'Screening',
    ],
    [
      'id' => 'applicant_reject',
      'title' => 'Not selected',
      'body' => 'We appreciate your time. We are moving forward with other candidates at this stage.',
      'scope' => 'employer',
      'category' => 'Status',
    ],
    [
      'id' => 'employer_question',
      'title' => 'Question about the role',
      'body' => 'Hi! I’m interested in this role and had a quick question about the day-to-day responsibilities.',
      'scope' => 'applicant',
      'category' => 'Inquiry',
    ],
    [
      'id' => 'employer_followup',
      'title' => 'Follow-up',
      'body' => 'Just following up on my application. Please let me know if there’s anything else I can provide.',
      'scope' => 'applicant',
      'category' => 'Follow-up',
    ],
  ];
}

function customapi_admin_get_email_templates() {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;
  $templates = get_option('customapi_email_templates', []);
  if (!is_array($templates) || empty($templates)) {
    $templates = customapi_default_email_templates();
  }
  $history = get_option('customapi_email_templates_history', []);
  if (!is_array($history)) $history = [];
  return rest_ensure_response([
    'templates' => array_values($templates),
    'history' => array_values($history),
  ]);
}

function customapi_admin_save_email_templates(WP_REST_Request $request) {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;
  $params = $request->get_json_params();
  $templates = is_array($params['templates'] ?? null) ? $params['templates'] : [];
  $clean = [];
  foreach ($templates as $tpl) {
    $title = sanitize_text_field($tpl['title'] ?? '');
    $body = sanitize_textarea_field($tpl['body'] ?? '');
    $scope = sanitize_text_field($tpl['scope'] ?? 'employer');
    $category = sanitize_text_field($tpl['category'] ?? 'General');
    if (!$title || !$body) continue;
    $clean[] = [
      'id' => sanitize_text_field($tpl['id'] ?? uniqid('tpl_', true)),
      'title' => $title,
      'body' => $body,
      'scope' => in_array($scope, ['employer', 'applicant'], true) ? $scope : 'employer',
      'category' => $category ?: 'General',
    ];
  }
  $prev = get_option('customapi_email_templates', []);
  $history = get_option('customapi_email_templates_history', []);
  if (!is_array($history)) $history = [];
  if (is_array($prev) && !empty($prev)) {
    array_unshift($history, [
      'time' => time(),
      'templates' => $prev,
    ]);
    $history = array_slice($history, 0, 10);
    update_option('customapi_email_templates_history', $history, false);
  }
  update_option('customapi_email_templates', $clean, false);
  customapi_admin_log('email_templates_update', ['count' => count($clean)]);
  return rest_ensure_response(['success' => true, 'templates' => $clean, 'history' => $history]);
}

function customapi_get_email_templates_public() {
  if (empty($_SESSION['user']['id'])) {
    return new WP_Error('unauthorized', 'Login required', ['status' => 401]);
  }
  $templates = get_option('customapi_email_templates', []);
  if (!is_array($templates) || empty($templates)) {
    $templates = customapi_default_email_templates();
  }
  return rest_ensure_response(array_values($templates));
}

function customapi_admin_list_users() {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;

  $users = get_users(['fields' => ['ID', 'user_login', 'user_email', 'display_name', 'roles', 'user_registered']]);
  $data = array_map(function($u) {
    return [
      'id' => $u->ID,
      'username' => $u->user_login,
      // email excluded by default; use admin/user for full details
      'display_name' => $u->display_name,
      'roles' => $u->roles,
      'registered' => $u->user_registered,
      'email_verified' => (bool) get_user_meta($u->ID, 'email_verified', true),
      'employer_verified' => (bool) get_user_meta($u->ID, 'employer_verified', true),
      'company' => get_user_meta($u->ID, 'company', true),
      'company_site' => get_user_meta($u->ID, 'company_site', true),
      'company_key' => get_user_meta($u->ID, 'company_key', true),
    ];
  }, $users);

  return rest_ensure_response($data);
}

function customapi_admin_get_user(WP_REST_Request $request) {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;

  $user_id = intval($request->get_param('userId'));
  if (!$user_id) {
    return new WP_Error('missing_user', 'User ID required', ['status' => 400]);
  }

  $user = get_userdata($user_id);
  if (!$user) {
    return new WP_Error('not_found', 'User not found', ['status' => 404]);
  }

  $profile = [
    'id' => $user->ID,
    'username' => $user->user_login,
    'email' => $user->user_email,
    'display_name' => $user->display_name,
    'roles' => $user->roles,
    'registered' => $user->user_registered,
    'email_verified' => (bool) get_user_meta($user->ID, 'email_verified', true),
    'employer_verified' => (bool) get_user_meta($user->ID, 'employer_verified', true),
    'first_name' => get_user_meta($user->ID, 'first_name', true),
    'last_name' => get_user_meta($user->ID, 'last_name', true),
    'company' => get_user_meta($user->ID, 'company', true),
    'company_site' => get_user_meta($user->ID, 'company_site', true),
    'company_key' => get_user_meta($user->ID, 'company_key', true),
    'dob' => get_user_meta($user->ID, 'dob', true),
    'street1' => get_user_meta($user->ID, 'street1', true),
    'street2' => get_user_meta($user->ID, 'street2', true),
    'city' => get_user_meta($user->ID, 'city', true),
    'state' => get_user_meta($user->ID, 'state', true),
    'zip' => get_user_meta($user->ID, 'zip', true),
    'country' => get_user_meta($user->ID, 'country', true),
  ];

  customapi_admin_log('user_view', ['user_id' => $user_id]);

  return rest_ensure_response($profile);
}

function customapi_admin_create_user(WP_REST_Request $request) {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;

  $params = $request->get_json_params();
  $username = sanitize_text_field($params['username'] ?? '');
  $email = sanitize_email($params['email'] ?? '');
  $password = $params['password'] ?? '';
  $role = sanitize_text_field($params['role'] ?? 'employee');

  if (!$username || !$email || !$password) {
    return new WP_Error('missing_fields', 'Username, email, password required', ['status' => 400]);
  }

  if (email_exists($email) || username_exists($username)) {
    return new WP_Error('conflict', 'Username or email already exists', ['status' => 409]);
  }

  if (!in_array($role, ['employee', 'employer', 'site_admin'], true)) {
    $role = 'employee';
  }

  $user_id = wp_create_user($username, $password, $email);
  if (is_wp_error($user_id)) {
    return new WP_Error('create_failed', 'Failed to create user', ['status' => 500]);
  }

  $user = new WP_User($user_id);
  $user->set_role($role);
  update_user_meta($user_id, 'email_verified', 1);
  if ($role === 'employer') {
    update_user_meta($user_id, 'employer_verified', 0);
  }
  customapi_set_user_hashes($user_id, $email, $username);
  customapi_admin_log('user_create', [
    'user_id' => $user_id,
    'username' => $username,
    'role' => $role,
  ]);

  return rest_ensure_response(['success' => true, 'id' => $user_id]);
}

function customapi_admin_update_user(WP_REST_Request $request) {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;

  $params = $request->get_json_params();
  $user_id = intval($params['userId'] ?? 0);
  if (!$user_id) {
    return new WP_Error('missing_user', 'User ID required', ['status' => 400]);
  }

  $user = get_userdata($user_id);
  if (!$user) {
    return new WP_Error('not_found', 'User not found', ['status' => 404]);
  }

  $role = sanitize_text_field($params['role'] ?? '');
  if ($role && in_array($role, ['employee', 'employer', 'site_admin'], true)) {
    $user_obj = new WP_User($user_id);
    $user_obj->set_role($role);
  }

  $meta_fields = ['first_name', 'last_name', 'company', 'company_site', 'company_key', 'dob', 'street1', 'street2', 'city', 'state', 'zip', 'country'];
  foreach ($meta_fields as $field) {
    if (array_key_exists($field, $params)) {
      update_user_meta($user_id, $field, sanitize_text_field($params[$field]));
    }
  }

  if (array_key_exists('email_verified', $params)) {
    update_user_meta($user_id, 'email_verified', $params['email_verified'] ? 1 : 0);
  }
  $prev_employer_verified = get_user_meta($user_id, 'employer_verified', true);
  if (array_key_exists('employer_verified', $params)) {
    update_user_meta($user_id, 'employer_verified', $params['employer_verified'] ? 1 : 0);
    $new_val = $params['employer_verified'] ? 1 : 0;
    if ((string)$prev_employer_verified !== (string)$new_val && function_exists('customapi_notify_site_admins')) {
      $user_label = $user->user_email ?: $user_id;
      customapi_notify_site_admins(
        'Employer verification updated',
        "User: {$user_label}\nEmployer Verified: " . ($new_val ? 'Yes' : 'No')
      );
    }
  }

  customapi_admin_log('user_update', [
    'user_id' => $user_id,
    'role' => $role ?: null,
    'email_verified' => array_key_exists('email_verified', $params) ? (bool) $params['email_verified'] : null,
    'employer_verified' => array_key_exists('employer_verified', $params) ? (bool) $params['employer_verified'] : null,
  ]);

  return rest_ensure_response(['success' => true]);
}

function customapi_admin_delete_user(WP_REST_Request $request) {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;

  $params = $request->get_json_params();
  $user_id = intval($params['userId'] ?? 0);
  if (!$user_id) {
    return new WP_Error('missing_user', 'User ID required', ['status' => 400]);
  }

  if ($user_id === intval($_SESSION['user']['id'])) {
    return new WP_Error('forbidden', 'Cannot delete yourself', ['status' => 403]);
  }

  $deleted = wp_delete_user($user_id);
  if (!$deleted) {
    return new WP_Error('delete_failed', 'Failed to delete user', ['status' => 500]);
  }

  customapi_admin_log('user_delete', ['user_id' => $user_id]);

  return rest_ensure_response(['success' => true]);
}

function customapi_admin_list_jobs() {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;

  $posts = get_posts([
    'post_type' => 'post',
    'post_status' => ['publish', 'draft'],
    'numberposts' => 200,
  ]);

  $data = array_map(function($p) {
    return [
      'id' => $p->ID,
      'title' => $p->post_title,
      'status' => $p->post_status,
      'author' => $p->post_author,
      'date' => $p->post_date,
    ];
  }, $posts);

  return rest_ensure_response($data);
}

function customapi_admin_update_job(WP_REST_Request $request) {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;

  $params = $request->get_json_params();
  $job_id = intval($params['id'] ?? 0);
  if (!$job_id) {
    return new WP_Error('missing_id', 'Job ID required', ['status' => 400]);
  }

  $post = get_post($job_id);
  $prev_status = $post ? $post->post_status : '';
  $update = ['ID' => $job_id];
  if (isset($params['title'])) {
    $update['post_title'] = sanitize_text_field($params['title']);
  }
  if (isset($params['content'])) {
    $update['post_content'] = wp_kses_post($params['content']);
  }
  if (isset($params['status']) && in_array($params['status'], ['publish', 'draft'], true)) {
    $update['post_status'] = $params['status'];
  }

  $result = wp_update_post($update, true);
  if (is_wp_error($result)) {
    return $result;
  }

  if (isset($params['meta']) && is_array($params['meta'])) {
    foreach ($params['meta'] as $key => $value) {
      update_post_meta($job_id, sanitize_key($key), sanitize_text_field($value));
    }
  }

  customapi_admin_log('job_update', [
    'job_id' => $job_id,
    'status' => $params['status'] ?? null,
    'title' => $params['title'] ?? null,
  ]);

  if (isset($params['status']) && $params['status'] === 'publish' && $prev_status !== 'publish') {
    if (function_exists('customapi_notify_site_admins')) {
      $title = get_the_title($job_id);
      customapi_notify_site_admins(
        'Job approved',
        "Job: {$title}\nPost ID: {$job_id}\nStatus: publish"
      );
    }
  }

  return rest_ensure_response(['success' => true]);
}

function customapi_admin_delete_job(WP_REST_Request $request) {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;

  $params = $request->get_json_params();
  $job_id = intval($params['id'] ?? 0);
  if (!$job_id) {
    return new WP_Error('missing_id', 'Job ID required', ['status' => 400]);
  }

  $deleted = wp_delete_post($job_id, true);
  if (!$deleted) {
    return new WP_Error('delete_failed', 'Unable to delete job', ['status' => 500]);
  }

  customapi_admin_log('job_delete', ['job_id' => $job_id]);

  return rest_ensure_response(['success' => true]);
}

function customapi_admin_export_users() {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;

  $users = get_users(['fields' => ['ID', 'user_login', 'user_email', 'display_name', 'roles', 'user_registered']]);
  $rows = [];
  $rows[] = ['id', 'username', 'email', 'display_name', 'roles', 'registered'];
  foreach ($users as $u) {
    $rows[] = [
      $u->ID,
      $u->user_login,
      $u->user_email,
      $u->display_name,
      implode('|', (array) $u->roles),
      $u->user_registered,
    ];
  }

  $fh = fopen('php://temp', 'w+');
  foreach ($rows as $row) {
    fputcsv($fh, $row);
  }
  rewind($fh);
  $csv = stream_get_contents($fh);
  fclose($fh);

  return new WP_REST_Response($csv, 200, [
    'Content-Type' => 'text/csv',
    'Content-Disposition' => 'attachment; filename="users.csv"',
  ]);
}

function customapi_admin_export_jobs() {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;

  $posts = get_posts([
    'post_type' => 'post',
    'post_status' => ['publish', 'draft'],
    'numberposts' => 200,
  ]);

  $rows = [];
  $rows[] = ['id', 'title', 'status', 'author', 'date'];
  foreach ($posts as $p) {
    $rows[] = [
      $p->ID,
      $p->post_title,
      $p->post_status,
      $p->post_author,
      $p->post_date,
    ];
  }

  $fh = fopen('php://temp', 'w+');
  foreach ($rows as $row) {
    fputcsv($fh, $row);
  }
  rewind($fh);
  $csv = stream_get_contents($fh);
  fclose($fh);

  return new WP_REST_Response($csv, 200, [
    'Content-Type' => 'text/csv',
    'Content-Disposition' => 'attachment; filename="jobs.csv"',
  ]);
}

function customapi_admin_get_flags() {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;
  $dev_mode = (int) get_option('customapi_dev_mode', 0);
  return rest_ensure_response([
    'dev_mode' => $dev_mode ? 1 : 0,
  ]);
}

function customapi_admin_set_flags(WP_REST_Request $request) {
  $auth = customapi_require_site_admin();
  if (is_wp_error($auth)) return $auth;
  $dev_mode = !empty($request['dev_mode']) ? 1 : 0;
  update_option('customapi_dev_mode', $dev_mode, false);
  customapi_admin_log('dev_mode_update', ['dev_mode' => $dev_mode]);
  return rest_ensure_response([
    'success' => true,
    'dev_mode' => $dev_mode,
  ]);
}

function customapi_get_dev_flags_public() {
  $dev_mode = (int) get_option('customapi_dev_mode', 0);
  return rest_ensure_response([
    'dev_mode' => $dev_mode ? 1 : 0,
  ]);
}

add_action('rest_api_init', function () {
  register_rest_route('customapi/v1', '/admin/users', [
    'methods' => 'GET',
    'callback' => 'customapi_admin_list_users',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/audit', [
    'methods' => 'GET',
    'callback' => 'customapi_admin_get_audit',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/user', [
    'methods' => 'GET',
    'callback' => 'customapi_admin_get_user',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/user-create', [
    'methods' => 'POST',
    'callback' => 'customapi_admin_create_user',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/user-update', [
    'methods' => 'POST',
    'callback' => 'customapi_admin_update_user',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/user-delete', [
    'methods' => 'POST',
    'callback' => 'customapi_admin_delete_user',
    'permission_callback' => '__return_true',
  ]);

  register_rest_route('customapi/v1', '/admin/jobs', [
    'methods' => 'GET',
    'callback' => 'customapi_admin_list_jobs',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/job-update', [
    'methods' => 'POST',
    'callback' => 'customapi_admin_update_job',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/job-delete', [
    'methods' => 'POST',
    'callback' => 'customapi_admin_delete_job',
    'permission_callback' => '__return_true',
  ]);

  register_rest_route('customapi/v1', '/admin/export-users', [
    'methods' => 'GET',
    'callback' => 'customapi_admin_export_users',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/export-jobs', [
    'methods' => 'GET',
    'callback' => 'customapi_admin_export_jobs',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/flags', [
    'methods' => 'GET',
    'callback' => 'customapi_admin_get_flags',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/flags', [
    'methods' => 'POST',
    'callback' => 'customapi_admin_set_flags',
    'permission_callback' => '__return_true',
  ]);

  register_rest_route('customapi/v1', '/admin/email-templates', [
    'methods' => 'GET',
    'callback' => 'customapi_admin_get_email_templates',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/admin/email-templates', [
    'methods' => 'POST',
    'callback' => 'customapi_admin_save_email_templates',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/email-templates', [
    'methods' => 'GET',
    'callback' => 'customapi_get_email_templates_public',
    'permission_callback' => '__return_true',
  ]);
  register_rest_route('customapi/v1', '/dev-flags', [
    'methods' => 'GET',
    'callback' => 'customapi_get_dev_flags_public',
    'permission_callback' => '__return_true',
  ]);
});

?>
