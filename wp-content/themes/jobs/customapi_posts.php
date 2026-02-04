<?php 
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
  function customapi_create_post($request) {
    if (!isset($_SESSION['user'])) {
        return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
    }
    if (!customapi_is_employer($_SESSION['user']['id'])) {
        return new WP_Error('forbidden', 'Employer account required', ['status' => 403]);
    }
    if (!customapi_is_employer_verified($_SESSION['user']['id'])) {
        return new WP_Error('forbidden', 'Employer verification required', ['status' => 403]);
    }

    $params = $request->get_json_params();
    if (empty($params['title'])) {
        return new WP_Error('missing_title', 'Title is required', ['status' => 400]);
    }

    $title   = sanitize_text_field($params['title']);
    $content = isset($params['description']) ? wp_kses_post($params['description']) : '';
    $status  = isset($params['status']) ? sanitize_text_field($params['status']) : 'publish';
    $tier_id = isset($params['job_tier']) ? sanitize_text_field($params['job_tier']) : (isset($params['tier']) ? sanitize_text_field($params['tier']) : (isset($params['pricing_tier']) ? sanitize_text_field($params['pricing_tier']) : ''));
    if (!in_array($status, ['publish', 'draft'], true)) {
        $status = 'publish';
    }
    if ($tier_id) {
        $status = 'draft';
    }

    $street1 = sanitize_text_field($params['street1'] ?? '');
    $city = sanitize_text_field($params['city'] ?? '');
    $state = sanitize_text_field($params['state'] ?? '');
    $zip = sanitize_text_field($params['zip'] ?? '');
    $country = sanitize_text_field($params['country'] ?? '');
    if (function_exists('customapi_validate_us_address')) {
        $addr_check = customapi_validate_us_address($street1, $city, $state, $zip, $country, false);
        if (is_wp_error($addr_check)) {
            return $addr_check;
        }
    }

    $post_id = wp_insert_post([
        'post_type'    => 'post',
        'post_title'   => $title,
        'post_content' => $content,
        'post_status'  => $status,
        'post_author'  => $_SESSION['user']['id']
    ]);

    if (is_wp_error($post_id)) {
        return new WP_Error('post_error', 'Failed to insert post', ['status' => 500]);
    }

    $user_id = intval($_SESSION['user']['id']);
    $company_default = get_user_meta($user_id, 'company', true);
    $company_site_default = get_user_meta($user_id, 'company_site', true);
    $company_key_default = get_user_meta($user_id, 'company_key', true);

    // Store all other fields as meta
    foreach ($params as $key => $value) {
        if (!in_array($key, ['title', 'description'])) {
            update_post_meta($post_id, sanitize_key($key), sanitize_text_field($value));
        }
    }

    if ($tier_id && function_exists('customapi_get_job_tier')) {
        $tier = customapi_get_job_tier($tier_id);
        update_post_meta($post_id, 'job_tier', $tier['id']);
        update_post_meta($post_id, 'job_tier_label', $tier['label']);
        update_post_meta($post_id, 'job_duration_days', $tier['duration_days']);
        update_post_meta($post_id, 'job_featured', $tier['featured'] ? '1' : '0');
        update_post_meta($post_id, 'job_price_cents', $tier['price_cents']);
        update_post_meta($post_id, 'job_payment_status', 'pending');
    }

    // Inherit company data from employer profile when not provided
    if (empty($params['company']) && !empty($company_default)) {
        update_post_meta($post_id, 'company', sanitize_text_field($company_default));
    }
    if (empty($params['company_site']) && !empty($company_site_default)) {
        update_post_meta($post_id, 'company_site', esc_url_raw($company_site_default));
    }
    if (empty($params['company_key']) && !empty($company_key_default)) {
        update_post_meta($post_id, 'company_key', sanitize_text_field($company_key_default));
    }

    if (function_exists('customapi_notify_site_admins')) {
        $author = get_userdata($user_id);
        $tier_label = isset($tier) ? $tier['label'] : ($tier_id ?: 'standard');
        $payment_status = get_post_meta($post_id, 'job_payment_status', true) ?: 'unpaid';
        customapi_notify_site_admins(
            'New job posted',
            "Job: {$title}\nAuthor: " . ($author ? $author->user_email : $user_id) . "\nStatus: {$status}\nTier: {$tier_label}\nPayment: {$payment_status}\nPost ID: {$post_id}"
        );
    }

    return [
        'success' => true,
        'post_id' => $post_id,
        'message' => 'Post created successfully'
    ];
}

  
  ?>
