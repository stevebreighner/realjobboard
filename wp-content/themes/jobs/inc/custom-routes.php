<?php
// ---------------------------------------------------------------------------
// REST ROUTE REGISTRATION
// ---------------------------------------------------------------------------

add_action('rest_api_init', function () {
  $routes = [
    ['register',      'POST', 'customapi_register_user'],
    ['verify-email',  'GET',  'customapi_verify_email'],
    ['resend-verification', 'POST', 'customapi_resend_verification'],
    ['login',         'POST', 'customapi_login_user'],
    ['me',     'GET',  'customapi_get_user_jobs'],
    ['apply-job', 'POST', 'customapi_apply_to_job'],
    ['job-applicants', 'GET', 'customapi_get_job_applicants'],
    ['user-applications', 'GET', 'customapi_get_user_applications'],
    // --- resumes / covers ---
    ['delete-resume/(?P<time>\d+)', 'DELETE', 'customapi_delete_resume'],
    ['delete-cover/(?P<time>\d+)',  'DELETE', 'customapi_delete_cover'],
    ['get-my-list', 'GET', 'customapi_get_my_list'],
    ['get-my-list-detail', 'GET', 'customapi_get_my_list_detail'],
    ['submit-application', 'POST', 'customapi_submit_application'],
    ['withdraw-application', 'POST', 'customapi_withdraw_application'],
    ['update-application-status', 'POST', 'customapi_update_application_status'],
    ['remove-application', 'POST', 'customapi_remove_application'],
    ['check-application', 'GET', 'customapi_check_application'],
    ['user-jobs', 'GET', 'customapi_user_jobs'],
    ['user-job-detail', 'GET', 'customapi_user_job_detail'],
    ['user-job-update', 'POST', 'customapi_user_job_update'],
    ['user-job-delete', 'POST', 'customapi_user_job_delete'],
    ['saved-jobs', 'GET', 'customapi_get_saved_jobs'],
    ['saved-jobs', 'POST', 'customapi_toggle_saved_job'],
    ['job-alerts', 'GET', 'customapi_get_job_alerts'],
    ['job-alerts', 'POST', 'customapi_save_job_alert'],
    ['job-alerts-delete', 'POST', 'customapi_delete_job_alert'],
    // --- end resumes / covers ---
    ['create-post',     'POST',  'customapi_create_post'],
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
    ['get-list-detail',   'GET',  'customapi_get_list_detail'],
    ['tables',        'GET',  'customapi_get_tables'],
    ['apply',         'POST', 'customapi_apply_to_job'],
    ['sessions',       'GET',  'customapi_get_session'],
    ['profile',       'GET',  'customapi_get_user_profile'],
    ['2fa-start',     'POST', 'customapi_2fa_start'],
    ['2fa-verify', 'POST', 'customapi_2fa_verify'],
    ['magic-link',    'POST', 'customapi_send_magic_link'],
    ['magic-login',   'GET',  'customapi_handle_magic_login'],
    ['ping',     'GET',  'customapi_ping'],
    ['checklist',     'POST', 'customapi_save_checklist'],
    ['employer-click', 'POST', 'customapi_employer_click'],
    ['employer-reset-learning', 'POST', 'customapi_employer_reset_learning'],
    ['stripe-config', 'GET', 'customapi_stripe_config'],
    ['stripe-checkout', 'POST', 'customapi_stripe_checkout'],
  ];

  foreach ($routes as [$endpoint, $method, $callback]) {
    register_rest_route('customapi/v1', "/$endpoint", [
      'methods' => $method,
      'callback' => $callback,
      'permission_callback' => '__return_true',
    ]);
  }
});
