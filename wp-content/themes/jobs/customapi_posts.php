<?php 
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
  function customapi_create_post($request) {
    if (!isset($_SESSION['user'])) {
        return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
    }

    $params = $request->get_json_params();
    if (empty($params['title'])) {
        return new WP_Error('missing_title', 'Title is required', ['status' => 400]);
    }

    $title   = sanitize_text_field($params['title']);
    $content = isset($params['description']) ? wp_kses_post($params['description']) : '';

    $post_id = wp_insert_post([
        'post_type'    => 'post',
        'post_title'   => $title,
        'post_content' => $content,
        'post_status'  => 'publish',
        'post_author'  => $_SESSION['user']['id']
    ]);

    if (is_wp_error($post_id)) {
        return new WP_Error('post_error', 'Failed to insert post', ['status' => 500]);
    }

    // Store all other fields as meta
    foreach ($params as $key => $value) {
        if (!in_array($key, ['title', 'description'])) {
            update_post_meta($post_id, sanitize_key($key), sanitize_text_field($value));
        }
    }

    return [
        'success' => true,
        'post_id' => $post_id,
        'message' => 'Post created successfully'
    ];
}

  
  ?>