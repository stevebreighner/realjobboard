<?php

// USER JOBS
function customapi_get_user_jobs() {
  if (!isset($_SESSION['user'])) {
    return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
  }

  global $wpdb;
  $user_id = $_SESSION['user']['id'];

  $results = $wpdb->get_results($wpdb->prepare(
    "SELECT j.* FROM {$wpdb->prefix}jobs j
     JOIN {$wpdb->prefix}applications a ON j.id = a.job_id
     WHERE a.user_id = %d
     ORDER BY a.applied_at DESC", $user_id), ARRAY_A);

  return $results;
}?>