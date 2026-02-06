<?php

function customapi_tokenize_text($text) {
  $text = strtolower(wp_strip_all_tags((string) $text));
  $text = preg_replace('/[^a-z0-9\s]/', ' ', $text);
  $tokens = preg_split('/\s+/', $text);
  $stop = ['the','and','for','with','that','this','you','your','are','was','were','from','have','has','had','not','but','all','any','can','will','our','their','they','them','his','her','she','him','its','about','into','over','under','more','most','some','such','than','then','when','what','which','who','whom','why','how','a','an','to','in','of','on','at','as','by','or','is','it','be','we','i','me','my'];
  $tokens = array_values(array_filter($tokens, function($t) use ($stop) {
    return $t !== '' && strlen($t) > 2 && !in_array($t, $stop, true);
  }));
  return array_values(array_unique($tokens));
}

function customapi_get_resume_text_for_application($job_id, $app_user_id) {
  $applicants = get_post_meta($job_id, 'job_applications', true);
  if (!is_array($applicants)) {
    // fallback for legacy key
    $applicants = get_post_meta($job_id, 'job_applicants', true);
  }
  if (!is_array($applicants)) return '';
  $resume_url = '';
  foreach ($applicants as $app) {
    if (intval($app['user_id'] ?? 0) === intval($app_user_id)) {
      $resume_url = $app['resume'] ?? '';
      break;
    }
  }
  if (!$resume_url) return '';
  $user_resumes = get_user_meta($app_user_id, 'user_resumes', true);
  if (!is_array($user_resumes)) return '';
  foreach ($user_resumes as $r) {
    if (!empty($r['url']) && $r['url'] === $resume_url) {
      return $r['text'] ?? '';
    }
  }
  return '';
}

function customapi_update_employer_preferences($employer_id, $tokens) {
  $prefs = get_user_meta($employer_id, 'employer_pref_keywords', true);
  if (!is_array($prefs)) $prefs = [];
  foreach ($tokens as $t) {
    if (!isset($prefs[$t])) $prefs[$t] = 0;
    $prefs[$t] = (int) $prefs[$t] + 1;
  }
  arsort($prefs);
  $prefs = array_slice($prefs, 0, 200, true);
  update_user_meta($employer_id, 'employer_pref_keywords', $prefs);
  update_user_meta($employer_id, 'employer_pref_updated', time());
}

function customapi_employer_click(WP_REST_Request $request) {
  if (empty($_SESSION['user']['id'])) {
    return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
  }
  $employer_id = intval($_SESSION['user']['id']);
  if (!customapi_is_employer($employer_id)) {
    return new WP_Error('forbidden', 'Employer account required', ['status' => 403]);
  }

  $job_id = intval($request->get_param('job_id'));
  $app_user_id = intval($request->get_param('user_id'));
  if (!$job_id || !$app_user_id) {
    return new WP_Error('missing_fields', 'job_id and user_id required', ['status' => 400]);
  }

  $post = get_post($job_id);
  if (!$post || (int) $post->post_author !== $employer_id) {
    return new WP_Error('forbidden', 'Not your job post', ['status' => 403]);
  }

  $resume_text = customapi_get_resume_text_for_application($job_id, $app_user_id);
  if (!$resume_text) {
    return rest_ensure_response(['success' => false, 'message' => 'Resume text not found.']);
  }

  $tokens = customapi_tokenize_text($resume_text);
  if (!empty($tokens)) {
    customapi_update_employer_preferences($employer_id, $tokens);
  }

  return rest_ensure_response(['success' => true]);
}

function customapi_employer_reset_learning(WP_REST_Request $request) {
  if (empty($_SESSION['user']['id'])) {
    return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
  }
  $employer_id = intval($_SESSION['user']['id']);
  if (!customapi_is_employer($employer_id)) {
    return new WP_Error('forbidden', 'Employer account required', ['status' => 403]);
  }

  delete_user_meta($employer_id, 'employer_pref_keywords');
  delete_user_meta($employer_id, 'employer_pref_updated');

  return rest_ensure_response(['success' => true]);
}

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
    $applicants = get_post_meta($job_id, 'job_applications', true);
    if (!is_array($applicants)) {
        $applicants = get_post_meta($job_id, 'job_applicants', true);
    }
    if (!is_array($applicants)) {
        $applicants = [];
    }

    // Simple keyword match score between job description and resume text
    $job_text = wp_strip_all_tags($post->post_content);
    $job_text = strtolower($job_text);
    $job_text = preg_replace('/[^a-z0-9\s]/', ' ', $job_text);
    $job_tokens = preg_split('/\s+/', $job_text);
    $stop = ['the','and','for','with','that','this','you','your','are','was','were','from','have','has','had','not','but','all','any','can','will','our','their','they','them','his','her','she','him','its','about','into','over','under','more','most','some','such','than','then','when','what','which','who','whom','why','how','a','an','to','in','of','on','at','as','by','or','is','it','be','we','i','me','my'];
    $job_tokens = array_values(array_filter($job_tokens, function($t) use ($stop) {
        return $t !== '' && strlen($t) > 2 && !in_array($t, $stop, true);
    }));
    $job_set = array_unique($job_tokens);
    $pref = get_user_meta($user_id, 'employer_pref_keywords', true);
    if (!is_array($pref)) $pref = [];

    // Format applicants to include name + link
    $formattedApplicants = [];
    foreach ($applicants as $app) {
        $appUser = get_user_by('ID', intval($app['user_id']));
        if ($appUser) {
            $hide_email = (bool) get_user_meta($appUser->ID, 'hide_email', true);
            $city = get_user_meta($appUser->ID, 'city', true);
            $state = get_user_meta($appUser->ID, 'state', true);
            $zip = get_user_meta($appUser->ID, 'zip', true);
            $resume_text = '';
            $user_resumes = get_user_meta($appUser->ID, 'user_resumes', true);
            if (is_array($user_resumes) && !empty($app['resume'])) {
                foreach ($user_resumes as $r) {
                    if (!empty($r['url']) && $r['url'] === $app['resume']) {
                        $resume_text = $r['text'] ?? '';
                        break;
                    }
                }
            }
            $score = 0;
            $pref_boost = 0;
            if (!empty($resume_text) && !empty($job_set)) {
                $rt = strtolower($resume_text);
                $rt = preg_replace('/[^a-z0-9\s]/', ' ', $rt);
                $rtokens = preg_split('/\s+/', $rt);
                $rtokens = array_values(array_filter($rtokens, function($t) use ($stop) {
                    return $t !== '' && strlen($t) > 2 && !in_array($t, $stop, true);
                }));
                $rset = array_unique($rtokens);
                $overlap = array_intersect($job_set, $rset);
                $score = (int) round((count($overlap) / max(1, count($job_set))) * 100);
                if (!empty($pref) && !empty($rset)) {
                    $pref_sum = 0;
                    foreach ($rset as $t) {
                        if (isset($pref[$t])) {
                            $pref_sum += (int) $pref[$t];
                        }
                    }
                    if ($pref_sum > 0) {
                        $pref_boost = (int) min(20, round(log(1 + $pref_sum) * 3));
                    }
                }
            }
            $total_score = min(100, $score + $pref_boost);
            $formattedApplicants[] = [
                'id'       => $appUser->ID,
                'name'     => $appUser->display_name,
                'email'    => $hide_email ? '' : $appUser->user_email,
                'hide_email' => $hide_email,
                'city'     => $city ?: '',
                'state'    => $state ?: '',
                'zip'      => $zip ?: '',
                'resume'   => $app['resume'] ?? '',
                'resume_text' => $resume_text,
                'match_score' => $total_score,
                'base_match_score' => $score,
                'pref_score' => $pref_boost,
                'cover'    => $app['cover_letter'] ?? '',
                'time'     => $app['time'] ?? 0,
                'status'   => $app['status'] ?? 'new',
                'rank'     => $app['rank'] ?? 0,
                'link'     => "/#application?jobId={$job_id}&userId={$appUser->ID}"
            ];
        }
    }

    $meta = get_post_meta($job_id);
    $flat_meta = array_map(function($v) { return $v[0]; }, $meta);

    return rest_ensure_response([
        'id'          => $post->ID,
        'title'       => get_the_title($post),
        'content'     => apply_filters('the_content', $post->post_content),
        'raw_content' => $post->post_content,
        'date'        => get_the_date('', $post),
        'applicants'  => $formattedApplicants,
        'meta'        => $flat_meta,
    ]);
}
function customapi_user_job_update(WP_REST_Request $request) {
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);
    if (!customapi_is_employer($user_id)) {
        return new WP_Error('forbidden', 'Employer account required', ['status' => 403]);
    }
    if (!customapi_is_employer_verified($user_id)) {
        return new WP_Error('forbidden', 'Employer verification required', ['status' => 403]);
    }

    $job_id = intval($request->get_param('id'));
    if (!$job_id) {
        return new WP_Error('missing_id', 'Job ID is required', ['status' => 400]);
    }

    $post = get_post($job_id);
    if (!$post || $post->post_type !== 'post') {
        return new WP_Error('not_found', 'Job not found', ['status' => 404]);
    }

    if ((int)$post->post_author !== $user_id) {
        return new WP_Error('forbidden', 'You are not the author of this job', ['status' => 403]);
    }

    $title = sanitize_text_field($request->get_param('title'));
    $content = $request->get_param('content');
    $status = sanitize_text_field($request->get_param('status'));

    $update = ['ID' => $job_id];
    if ($title !== null && $title !== '') {
        $update['post_title'] = $title;
    }
    if ($content !== null && $content !== '') {
        $update['post_content'] = wp_kses_post($content);
    }
    if (in_array($status, ['publish', 'draft'], true)) {
        $update['post_status'] = $status;
    }

    if (count($update) === 1) {
        return new WP_Error('missing_fields', 'Nothing to update', ['status' => 400]);
    }

    $result = wp_update_post($update, true);
    if (is_wp_error($result)) {
        return $result;
    }

    $meta_fields = [
        'field',
        'rate_type',
        'rate_min',
        'rate_max',
        'street1',
        'street2',
        'city',
        'state',
        'zip',
        'country',
    ];
    $meta_updates = [];
    foreach ($meta_fields as $field) {
        $val = $request->get_param($field);
        if ($val !== null) {
            $meta_updates[$field] = sanitize_text_field($val);
        }
    }
    if (!empty($meta_updates)) {
        $street1 = $meta_updates['street1'] ?? '';
        $city = $meta_updates['city'] ?? '';
        $state = $meta_updates['state'] ?? '';
        $zip = $meta_updates['zip'] ?? '';
        $country = $meta_updates['country'] ?? '';
        if (function_exists('customapi_validate_us_address')) {
            $addr_check = customapi_validate_us_address($street1, $city, $state, $zip, $country, false);
            if (is_wp_error($addr_check)) {
                return $addr_check;
            }
        }
        foreach ($meta_updates as $key => $value) {
            update_post_meta($job_id, $key, $value);
        }
    }

    return rest_ensure_response(['message' => 'Job updated', 'id' => $job_id]);
}

function customapi_get_saved_jobs(WP_REST_Request $request) {
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);
    $saved = get_user_meta($user_id, 'saved_jobs', true);
    if (!is_array($saved)) $saved = [];
    $saved = array_values(array_filter(array_map('intval', $saved)));
    return rest_ensure_response($saved);
}

function customapi_toggle_saved_job(WP_REST_Request $request) {
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);
    $job_id = intval($request->get_param('job_id'));
    if (!$job_id) {
        return new WP_Error('missing_id', 'Job ID required.', ['status' => 400]);
    }
    $saved = get_user_meta($user_id, 'saved_jobs', true);
    if (!is_array($saved)) $saved = [];
    $saved = array_values(array_filter(array_map('intval', $saved)));
    if (in_array($job_id, $saved, true)) {
        $saved = array_values(array_diff($saved, [$job_id]));
        update_user_meta($user_id, 'saved_jobs', $saved);
        return rest_ensure_response(['saved' => false, 'job_id' => $job_id]);
    }
    $saved[] = $job_id;
    $saved = array_values(array_unique($saved));
    update_user_meta($user_id, 'saved_jobs', $saved);
    return rest_ensure_response(['saved' => true, 'job_id' => $job_id]);
}

function customapi_get_job_alerts(WP_REST_Request $request) {
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);
    $alerts = get_user_meta($user_id, 'job_alerts', true);
    if (!is_array($alerts)) $alerts = [];
    return rest_ensure_response(array_values($alerts));
}

function customapi_save_job_alert(WP_REST_Request $request) {
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);
    $payload = $request->get_json_params();
    $label = sanitize_text_field($payload['label'] ?? 'Alert');
    $criteria = $payload['criteria'] ?? [];
    if (!is_array($criteria)) $criteria = [];

    $alerts = get_user_meta($user_id, 'job_alerts', true);
    if (!is_array($alerts)) $alerts = [];

    $alerts[] = [
        'id' => uniqid('alert_', true),
        'label' => $label,
        'criteria' => $criteria,
        'created_at' => time(),
    ];
    update_user_meta($user_id, 'job_alerts', array_values($alerts));
    return rest_ensure_response(['success' => true, 'alerts' => $alerts]);
}

function customapi_delete_job_alert(WP_REST_Request $request) {
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);
    $alert_id = sanitize_text_field($request->get_param('alert_id'));
    if (!$alert_id) {
        return new WP_Error('missing_id', 'Alert ID required.', ['status' => 400]);
    }
    $alerts = get_user_meta($user_id, 'job_alerts', true);
    if (!is_array($alerts)) $alerts = [];
    $alerts = array_values(array_filter($alerts, function($a) use ($alert_id) {
        return ($a['id'] ?? '') !== $alert_id;
    }));
    update_user_meta($user_id, 'job_alerts', $alerts);
    return rest_ensure_response(['success' => true, 'alerts' => $alerts]);
}

function customapi_user_job_delete(WP_REST_Request $request) {
    if (empty($_SESSION['user']['id'])) {
        return new WP_Error('unauthorized', 'You must be logged in.', ['status' => 401]);
    }
    $user_id = intval($_SESSION['user']['id']);
    if (!customapi_is_employer($user_id)) {
        return new WP_Error('forbidden', 'Employer account required', ['status' => 403]);
    }

    $job_id = intval($request->get_param('id'));
    if (!$job_id) {
        return new WP_Error('missing_id', 'Job ID is required', ['status' => 400]);
    }

    $post = get_post($job_id);
    if (!$post || $post->post_type !== 'post') {
        return new WP_Error('not_found', 'Job not found', ['status' => 404]);
    }

    if ((int)$post->post_author !== $user_id) {
        return new WP_Error('forbidden', 'You are not the author of this job', ['status' => 403]);
    }

    $deleted = wp_delete_post($job_id, true);
    if (!$deleted) {
        return new WP_Error('delete_failed', 'Unable to delete job', ['status' => 500]);
    }

    return rest_ensure_response(['message' => 'Job deleted', 'id' => $job_id]);
}


?>
