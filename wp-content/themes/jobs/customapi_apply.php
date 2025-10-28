<?php



// Check status before applying
function customapi_check_application(WP_REST_Request $request) {
  $user_id = get_current_user_id();
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
    ];
    update_post_meta($job_id, 'job_applications', $applications);

    // --- Return success ---
    return [
        'success' => true,
        'message' => 'Application submitted successfully',
        'job_id'  => $job_id,
        'resume'  => $resume,
        'cover_letter' => $cover_letter,
    ];
}

?>