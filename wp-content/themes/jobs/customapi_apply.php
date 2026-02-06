<?php



// Check status before applying
function customapi_check_application(WP_REST_Request $request) {
  if (session_status() !== PHP_SESSION_ACTIVE) {
      session_start();
  }
  if (empty($_SESSION['user']['id'])) {
      return new WP_Error('unauthorized', 'You must be logged in to apply.', ['status' => 401]);
  }
  $user_id = intval($_SESSION['user']['id']);
  $job_id = intval($request->get_param('jobId'));
  if (!$job_id) {
      return new WP_Error('missing_job', 'Job ID is required.', ['status' => 400]);
  }

  $applications = get_post_meta($job_id, 'job_applications', true);
  if (!is_array($applications)) {
      $applications = [];
  }

  $already_applied = false;
  foreach ($applications as $app) {
      if (intval($app['user_id']) === $user_id) {
          $already_applied = true;
          break;
      }
  }

  return [
      'already_applied'   => $already_applied,
      'application_count' => count($applications),
      'limit_reached'     => count($applications) >= 25,
  ];
}

add_action('rest_api_init', function () {
  register_rest_route('customapi/v1', '/check-application', [
      'methods' => 'GET',
      'callback' => 'customapi_check_application',
      'permission_callback' => '__return_true',
  ]);
});
function customapi_submit_application(WP_REST_Request $request) {
    // --- Start session if not active ---
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    // --- Check logged-in user via session ---
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error(
            'unauthorized',
            'You must be logged in to apply.',
            ['status' => 401]
        );
    }
    $user_id = intval($_SESSION['user']['id']);

    // --- Get input from frontend ---
    $job_id = intval($request->get_param('jobId'));
    $resume = esc_url_raw($request->get_param('resume'));          // selected resume URL
    $cover_letter = esc_url_raw($request->get_param('cover_letter')); // selected cover letter URL

    if (!$job_id || !$resume) {
        return new WP_Error(
            'missing_fields',
            'Resume is required.',
            ['status' => 400]
        );
    }

    // --- Get existing applications ---
    $applications = get_post_meta($job_id, 'job_applications', true);
    if (!is_array($applications)) $applications = [];

    // --- Duplicate check ---
    foreach ($applications as $app) {
        if (intval($app['user_id']) === $user_id) {
            return new WP_Error(
                'duplicate_application',
                'You have already applied to this job.',
                ['status' => 409]
            );
        }
    }

    // --- Max applications check ---
    if (count($applications) >= 25) {
        return new WP_Error(
            'limit_reached',
            'This job has reached the maximum number of applications.',
            ['status' => 403]
        );
    }

    // --- Save the application ---
    $applications[] = [
        'user_id'      => $user_id,
        'resume'       => $resume,
        'cover_letter' => $cover_letter,
        'time'         => time(),
        'status'       => 'new',
        'rank'         => 0,
    ];
    update_post_meta($job_id, 'job_applications', $applications);

    // --- Email confirmations ---
    $job = get_post($job_id);
    $job_title = $job ? get_the_title($job) : 'Job Application';
    $user = get_user_by('ID', $user_id);
    $user_email = $user ? $user->user_email : '';
    $hide_email = (bool) get_user_meta($user_id, 'hide_email', true);
    $employer_email = '';
    if ($job) {
        $author = get_user_by('ID', $job->post_author);
        if ($author) {
            $employer_email = $author->user_email;
        }
    }
    $company_name = get_post_meta($job_id, 'company', true);
    if ($company_name && strpos($company_name, '@') !== false) {
        $company_name = '';
    }
    $company_label = $company_name ?: EMAIL_BRAND_NAME;

    if (!empty($user_email)) {
        $subject = customapi_email_subject('application_submitted', $job_title);
        $body = "<p>Your application has been submitted successfully.</p>";
        $meta = [
            "Job: {$job_title}",
            "Company: {$company_label}",
        ];
        $html = customapi_email_template('Application submitted', $body, 'View Job', home_url("/#/list-detail?id={$job_id}"), $meta);
        customapi_send_html_mail($user_email, $subject, $html);
    }

    if (!empty($employer_email)) {
        $subject = customapi_email_subject('application_received', $job_title);
        $body = "<p>A new application was received.</p>";
        $meta = [
            "Job: {$job_title}",
            $hide_email ? "Applicant email: hidden" : "Applicant email: {$user_email}",
            "Resume: {$resume}",
            !empty($cover_letter) ? "Cover letter: {$cover_letter}" : null,
        ];
        $meta = array_values(array_filter($meta));
        $html = customapi_email_template('New application received', $body, 'Open Applicants', home_url("/#/my-job-post-detail?id={$job_id}"), $meta);
        customapi_send_html_mail($employer_email, $subject, $html);
    }

    if (function_exists('customapi_notify_site_admins')) {
        customapi_notify_site_admins(
            'Application submitted',
            "Job: {$job_title}\nApplicant: {$user_email}\nJob ID: {$job_id}"
        );
    }

    // --- Return success ---
    return [
        'success' => true,
        'message' => 'Application submitted successfully',
        'job_id'  => $job_id,
        'resume'  => $resume,
        'cover_letter' => $cover_letter,
    ];
}

function customapi_get_user_applications(WP_REST_Request $request) {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);

    $query = new WP_Query([
        'post_type'      => ['post', 'job'],
        'post_status'    => ['publish', 'draft'],
        'posts_per_page' => 200,
        'meta_query'     => [
            [
                'key'     => 'job_applications',
                'compare' => 'EXISTS',
            ],
        ],
    ]);

    $results = [];
    foreach ($query->posts as $post) {
        $apps = get_post_meta($post->ID, 'job_applications', true);
        if (!is_array($apps)) {
            $apps = get_post_meta($post->ID, 'job_applicants', true);
        }
        if (!is_array($apps)) continue;
        foreach ($apps as $app) {
            if (intval($app['user_id'] ?? 0) !== $user_id) continue;
            $meta = get_post_meta($post->ID);
            $flat = array_map(function($v) { return $v[0]; }, $meta);
            $company = $flat['company'] ?? '';
            if ($company && strpos($company, '@') !== false) {
                $company = '';
            }
            $city = $flat['city'] ?? '';
            $state = $flat['state'] ?? '';
            $zip = $flat['zip'] ?? '';
            $location = trim(implode(' ', array_filter([trim(implode(', ', array_filter([$city, $state]))), $zip])));
            $results[] = [
                'job_id'       => $post->ID,
                'job_title'    => get_the_title($post),
                'company'      => $company,
                'location'     => $location,
                'rate_type'    => $flat['rate_type'] ?? '',
                'rate_min'     => $flat['rate_min'] ?? '',
                'rate_max'     => $flat['rate_max'] ?? '',
                'applied_time' => intval($app['time'] ?? 0),
                'status'       => $app['status'] ?? 'new',
                'rank'         => $app['rank'] ?? 0,
                'resume'       => $app['resume'] ?? '',
                'cover_letter' => $app['cover_letter'] ?? '',
            ];
        }
    }

    usort($results, function($a, $b) {
        return ($b['applied_time'] ?? 0) <=> ($a['applied_time'] ?? 0);
    });

    return rest_ensure_response($results);
}

function customapi_withdraw_application(WP_REST_Request $request) {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);
    $job_id = intval($request->get_param('job_id'));
    if (!$job_id) {
        return new WP_Error('missing_job', 'Job ID is required.', ['status' => 400]);
    }

    $applications = get_post_meta($job_id, 'job_applications', true);
    $meta_key = 'job_applications';
    if (!is_array($applications)) {
        $applications = get_post_meta($job_id, 'job_applicants', true);
        $meta_key = 'job_applicants';
    }
    if (!is_array($applications)) {
        return new WP_Error('not_found', 'No application found.', ['status' => 404]);
    }

    $new_apps = [];
    $found = false;
    $app_resume = '';
    $app_cover = '';
    foreach ($applications as $app) {
        if (intval($app['user_id'] ?? 0) === $user_id) {
            $found = true;
            $app_resume = $app['resume'] ?? '';
            $app_cover = $app['cover_letter'] ?? '';
            continue;
        }
        $new_apps[] = $app;
    }
    if (!$found) {
        return new WP_Error('not_found', 'No application found.', ['status' => 404]);
    }

    update_post_meta($job_id, $meta_key, $new_apps);

    $job = get_post($job_id);
    $job_title = $job ? get_the_title($job) : 'Job Application';
    $user = get_user_by('ID', $user_id);
    $user_email = $user ? $user->user_email : '';
    $employer_email = '';
    if ($job) {
        $author = get_user_by('ID', $job->post_author);
        if ($author) $employer_email = $author->user_email;
    }
    $company_name = get_post_meta($job_id, 'company', true);
    if ($company_name && strpos($company_name, '@') !== false) {
        $company_name = '';
    }
    $company_label = $company_name ?: EMAIL_BRAND_NAME;

    if (!empty($user_email)) {
        $subject = customapi_email_subject('application_withdrawn', $job_title);
        $body = "<p>Your application has been withdrawn.</p>";
        $meta = [
            "Job: {$job_title}",
            "Company: {$company_label}",
        ];
        $html = customapi_email_template('Application withdrawn', $body, '', '', $meta);
        customapi_send_html_mail($user_email, $subject, $html);
    }
    if (!empty($employer_email)) {
        $subject = customapi_email_subject('application_withdrawn', $job_title);
        $body = "<p>An applicant withdrew their application.</p>";
        $meta = [
            "Job: {$job_title}",
            "Resume: {$app_resume}",
            $app_cover ? "Cover: {$app_cover}" : null,
        ];
        $meta = array_values(array_filter($meta));
        $html = customapi_email_template('Application withdrawn', $body, 'Open Applicants', home_url("/#/my-job-post-detail?id={$job_id}"), $meta);
        customapi_send_html_mail($employer_email, $subject, $html);
    }

    if (function_exists('customapi_notify_site_admins')) {
        customapi_notify_site_admins('Application withdrawn', "Job: {$job_title}\nApplicant: {$user_email}\nJob ID: {$job_id}");
    }

    return rest_ensure_response(['success' => true]);
}

function customapi_update_application_status(WP_REST_Request $request) {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $employer_id = intval($_SESSION['user']['id']);
    if (!customapi_is_employer($employer_id)) {
        return new WP_Error('forbidden', 'Employer account required', ['status' => 403]);
    }

    $job_id = intval($request->get_param('job_id'));
    $user_id = intval($request->get_param('user_id'));
    $status = sanitize_text_field($request->get_param('status'));
    $rank = intval($request->get_param('rank'));
    if (!$job_id || !$user_id) {
        return new WP_Error('missing_fields', 'job_id and user_id required', ['status' => 400]);
    }

    $post = get_post($job_id);
    if (!$post || (int) $post->post_author !== $employer_id) {
        return new WP_Error('forbidden', 'Not your job post', ['status' => 403]);
    }

    $allowed_status = ['new', 'reviewing', 'shortlisted', 'rejected'];
    if ($status && !in_array($status, $allowed_status, true)) {
        return new WP_Error('invalid_status', 'Invalid status', ['status' => 400]);
    }

    $applications = get_post_meta($job_id, 'job_applications', true);
    $meta_key = 'job_applications';
    if (!is_array($applications)) {
        $applications = get_post_meta($job_id, 'job_applicants', true);
        $meta_key = 'job_applicants';
    }
    if (!is_array($applications)) {
        return new WP_Error('not_found', 'No applications found', ['status' => 404]);
    }

    $updated = false;
    $prev_status = '';
    foreach ($applications as &$app) {
        if (intval($app['user_id'] ?? 0) === $user_id) {
            $prev_status = $app['status'] ?? 'new';
            if ($status) $app['status'] = $status;
            $app['rank'] = max(0, min(5, $rank));
            $updated = true;
            break;
        }
    }
    unset($app);

    if (!$updated) {
        return new WP_Error('not_found', 'Application not found', ['status' => 404]);
    }
    update_post_meta($job_id, $meta_key, $applications);

    if ($status && $status !== $prev_status) {
        $user = get_user_by('ID', $user_id);
        if ($user && !empty($user->user_email)) {
            $job_title = get_the_title($job_id);
            $company_name = get_post_meta($job_id, 'company', true);
            if ($company_name && strpos($company_name, '@') !== false) {
                $company_name = '';
            }
            $company_label = $company_name ?: EMAIL_BRAND_NAME;
            $subject = customapi_email_subject('application_update', $job_title);
            $body = $status === 'rejected'
                ? "<p>Thanks for applying. After review, we will not be moving forward with this application.</p>"
                : "<p>Your application status was updated to <strong>{$status}</strong>.</p>";
            $meta = [
                "Job: {$job_title}",
                "Company: {$company_label}",
            ];
            $html = customapi_email_template('Application update', $body, 'View Job', home_url("/#/list-detail?id={$job_id}"), $meta);
            customapi_send_html_mail($user->user_email, $subject, $html);
        }
    }

    if (function_exists('customapi_notify_site_admins')) {
        $job_title = get_the_title($job_id);
        customapi_notify_site_admins(
            'Application status updated',
            "Job: {$job_title}\nApplicant ID: {$user_id}\nStatus: {$status}\nRank: {$rank}"
        );
    }

    return rest_ensure_response(['success' => true]);
}

function customapi_remove_application(WP_REST_Request $request) {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $employer_id = intval($_SESSION['user']['id']);
    if (!customapi_is_employer($employer_id)) {
        return new WP_Error('forbidden', 'Employer account required', ['status' => 403]);
    }

    $job_id = intval($request->get_param('job_id'));
    $user_id = intval($request->get_param('user_id'));
    if (!$job_id || !$user_id) {
        return new WP_Error('missing_fields', 'job_id and user_id required', ['status' => 400]);
    }

    $post = get_post($job_id);
    if (!$post || (int) $post->post_author !== $employer_id) {
        return new WP_Error('forbidden', 'Not your job post', ['status' => 403]);
    }

    $applications = get_post_meta($job_id, 'job_applications', true);
    $meta_key = 'job_applications';
    if (!is_array($applications)) {
        $applications = get_post_meta($job_id, 'job_applicants', true);
        $meta_key = 'job_applicants';
    }
    if (!is_array($applications)) {
        return new WP_Error('not_found', 'No applications found', ['status' => 404]);
    }

    $found = false;
    $new_apps = [];
    foreach ($applications as $app) {
        if (intval($app['user_id'] ?? 0) === $user_id) {
            $found = true;
            continue;
        }
        $new_apps[] = $app;
    }
    if (!$found) {
        return new WP_Error('not_found', 'Application not found', ['status' => 404]);
    }
    update_post_meta($job_id, $meta_key, $new_apps);

    $job_title = get_the_title($job_id);
    $company_name = get_post_meta($job_id, 'company', true);
    if ($company_name && strpos($company_name, '@') !== false) {
        $company_name = '';
    }
    $company_label = $company_name ?: EMAIL_BRAND_NAME;
    $user = get_user_by('ID', $user_id);
    if ($user && !empty($user->user_email)) {
        $subject = customapi_email_subject('application_removed', $job_title);
        $body = "<p>Thanks for applying. After review, we will not be moving forward with this application.</p>";
        $meta = [
            "Job: {$job_title}",
            "Company: {$company_label}",
        ];
        $html = customapi_email_template('Application update', $body, 'View Job', home_url("/#/list-detail?id={$job_id}"), $meta);
        customapi_send_html_mail($user->user_email, $subject, $html);
    }

    if (function_exists('customapi_notify_site_admins')) {
        customapi_notify_site_admins(
            'Application removed',
            "Job: {$job_title}\nApplicant ID: {$user_id}\nJob ID: {$job_id}"
        );
    }

    return rest_ensure_response(['success' => true]);
}

?>
