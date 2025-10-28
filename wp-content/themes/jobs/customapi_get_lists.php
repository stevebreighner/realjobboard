<?php

// USER JOBS
function customapi_get_list(WP_REST_Request $request) {
  $search = sanitize_text_field($request->get_param('search'));
  
  $args = [
      'post_type'      => 'post', // change to 'job' if using a custom type
      'post_status'    => 'publish',
      'posts_per_page' => 100,
      'orderby'        => 'date',
      'order'          => 'DESC',
  ];

  if (!empty($search)) {
      $args['s'] = $search;
  }

  $query = new WP_Query($args);
  $results = [];

  foreach ($query->posts as $post) {
      $meta = get_post_meta($post->ID);

      $results[] = [
          'id'          => $post->ID,
          'title'       => get_the_title($post),
          'description' => apply_filters('the_content', $post->post_content),
          'date'        => get_the_date('', $post),
          'author'      => get_the_author_meta('display_name', $post->post_author),
          'meta'        => array_map(function($v) { return $v[0]; }, $meta), // flatten
      ];
  }

  return rest_ensure_response($results);
}


function customapi_get_list_detail(WP_REST_Request $request) {
  $post_id = intval($request->get_param('id'));

  if (!$post_id || get_post_status($post_id) !== 'publish') {
      return new WP_Error('not_found', 'Post not found', ['status' => 404]);
  }

  $post = get_post($post_id);
  $meta = get_post_meta($post_id);

  return [
      'id'          => $post->ID,
      'title'       => get_the_title($post),
      'description' => apply_filters('the_content', $post->post_content),
      'date'        => get_the_date('', $post),
      'author'      => get_the_author_meta('display_name', $post->post_author),
      'meta'        => array_map(function($v) { return $v[0]; }, $meta), // flatten
  ];
}



// Fetch all jobs created by the logged-in user
function customapi_get_my_list(WP_REST_Request $request) {
    if (!isset($_SESSION['user'])) {
        return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
    }
    $user_id = $_SESSION['user']['id'];

    $args = [
        'post_type'      => 'post',
        'author'         => $user_id,
        'posts_per_page' => -1,
    ];

    $query = new WP_Query($args);
    $jobs = [];
    foreach ($query->posts as $post) {
        $jobs[] = [
            'id'      => $post->ID,
            'title'   => get_the_title($post),
            'summary' => get_the_excerpt($post),
        ];
    }

    return $jobs;
}





// Fetch job detail (only if owned by current user)



function customapi_get_my_list_detail(WP_REST_Request $request) {
    if (!isset($_SESSION['user'])) {
        return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
    }

    $user_id = $_SESSION['user']['id'];
    $job_id = intval($request->get_param('id'));

    $post = get_post($job_id);
    if (!$post || $post->post_type !== 'job') {
        return new WP_Error('not_found', 'Job not found', ['status' => 404]);
    }

    if ((int)$post->post_author !== (int)$user_id) {
        return new WP_Error('forbidden', 'Not your job post', ['status' => 403]);
    }

    // Get applicants for this job
    $applicants = get_post_meta($job_id, 'job_applicants', true) ?: [];

    return [
        'id'         => $post->ID,
        'title'      => get_the_title($post),
        'content'    => apply_filters('the_content', $post->post_content),
        'applicants' => $applicants,
    ];
}


//specfic to jobboard versions
function customapi_user_jobs(WP_REST_Request $request) {
    // ✅ Ensure user is logged in
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);

    // Optional search param
    $search = sanitize_text_field($request->get_param('search'));

    $args = [
        'post_type'      => 'post', // or 'job' if you switch later
        'post_status'    => 'publish',
        'posts_per_page' => 100,
        'orderby'        => 'date',
        'order'          => 'DESC',
        'author'         => $user_id, // only posts by this user
    ];

    if (!empty($search)) {
        $args['s'] = $search;
    }

    $query = new WP_Query($args);
    $results = [];

    foreach ($query->posts as $post) {
        $meta = get_post_meta($post->ID);

        $results[] = [
            'id'          => $post->ID,
            'title'       => get_the_title($post),
            'summary'     => wp_trim_words($post->post_content, 25, '...'),
            'description' => apply_filters('the_content', $post->post_content),
            'date'        => get_the_date('', $post),
            'author'      => get_the_author_meta('display_name', $post->post_author),
            'meta'        => array_map(fn($v) => $v[0], $meta),
        ];
    }

    return rest_ensure_response($results);
}


function customapi_user_job_detail(WP_REST_Request $request) {
    // ✅ Ensure logged in
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);

    $job_id = intval($request->get_param('id'));
    if (!$job_id) {
        return new WP_Error('missing_id', 'Job ID is required', ['status' => 400]);
    }

    $post = get_post($job_id);
    if (!$post || $post->post_type !== 'post') { // or 'job' if you use a custom type
        return new WP_Error('not_found', 'Job not found', ['status' => 404]);
    }

    // ✅ Make sure this post belongs to the logged-in user
    if ((int)$post->post_author !== $user_id) {
        return new WP_Error('forbidden', 'You are not the author of this job', ['status' => 403]);
    }

    // Get applicants meta
    $applicants = get_post_meta($job_id, 'job_applicants', true);
    if (!is_array($applicants)) {
        $applicants = [];
    }

    // Format applicants to include name + link
    $formattedApplicants = [];
    foreach ($applicants as $app) {
        $appUser = get_user_by('ID', intval($app['user_id']));
        if ($appUser) {
            $formattedApplicants[] = [
                'id'       => $appUser->ID,
                'name'     => $appUser->display_name,
                'resume'   => $app['resume'] ?? '',
                'cover'    => $app['cover_letter'] ?? '',
                'time'     => $app['time'] ?? 0,
                'link'     => "/#application?jobId={$job_id}&userId={$appUser->ID}"
            ];
        }
    }

    return rest_ensure_response([
        'id'          => $post->ID,
        'title'       => get_the_title($post),
        'content'     => apply_filters('the_content', $post->post_content),
        'date'        => get_the_date('', $post),
        'applicants'  => $formattedApplicants,
    ]);
}



?>