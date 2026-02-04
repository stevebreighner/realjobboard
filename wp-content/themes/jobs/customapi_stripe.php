<?php

function customapi_get_job_tiers() {
    return [
        'standard' => [
            'id' => 'standard',
            'label' => 'Standard',
            'price_cents' => 14900,
            'duration_days' => 30,
            'featured' => false,
        ],
        'premium' => [
            'id' => 'premium',
            'label' => 'Premium',
            'price_cents' => 29900,
            'duration_days' => 60,
            'featured' => true,
        ],
    ];
}

function customapi_get_job_tier($tier_id) {
    $tiers = customapi_get_job_tiers();
    return $tiers[$tier_id] ?? $tiers['standard'];
}

function customapi_stripe_config() {
    $tiers = array_values(array_map(function ($t) {
        return [
            'id' => $t['id'],
            'label' => $t['label'],
            'price' => $t['price_cents'] / 100,
            'duration_days' => $t['duration_days'],
            'featured' => $t['featured'],
        ];
    }, customapi_get_job_tiers()));

    return rest_ensure_response([
        'publishableKey' => defined('STRIPE_PUBLISHABLE_KEY') ? STRIPE_PUBLISHABLE_KEY : '',
        'tiers' => $tiers,
    ]);
}

function customapi_stripe_checkout(WP_REST_Request $request) {
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

    $job_id = intval($request->get_param('job_id'));
    $tier_id = sanitize_text_field($request->get_param('tier'));
    if (!$job_id) {
        return new WP_Error('missing_job', 'Job ID is required', ['status' => 400]);
    }

    $post = get_post($job_id);
    if (!$post || $post->post_type !== 'post') {
        return new WP_Error('not_found', 'Job not found', ['status' => 404]);
    }
    if ((int) $post->post_author !== $user_id) {
        return new WP_Error('forbidden', 'Not your job post', ['status' => 403]);
    }

    $payment_status = get_post_meta($job_id, 'job_payment_status', true);
    if ($payment_status === 'paid') {
        return new WP_Error('already_paid', 'This job is already paid.', ['status' => 409]);
    }

    $tier = customapi_get_job_tier($tier_id);

    require_once get_template_directory() . '/stripe/vendor/autoload.php';
    \Stripe\Stripe::setApiKey(defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '');
    if (!defined('STRIPE_SECRET_KEY') || !STRIPE_SECRET_KEY) {
        return new WP_Error('stripe_missing', 'Stripe secret key not configured.', ['status' => 500]);
    }

    $site_url = defined('WEBSITE_URL') ? WEBSITE_URL : home_url();
    $success_url = $site_url . '/#my-job-posts?paid=1&job_id=' . $job_id . '&session_id={CHECKOUT_SESSION_ID}';
    $cancel_url = $site_url . '/#my-job-post-detail?id=' . $job_id;

    try {
        $session = \Stripe\Checkout\Session::create([
            'payment_method_types' => ['card'],
            'allow_promotion_codes' => true,
            'line_items' => [[
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => 'Job Listing (' . $tier['label'] . '): ' . get_the_title($job_id),
                    ],
                    'unit_amount' => $tier['price_cents'],
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => $success_url,
            'cancel_url' => $cancel_url,
            'metadata' => [
                'post_id' => $job_id,
                'post_type' => $post->post_type,
                'tier' => $tier['id'],
                'duration_days' => $tier['duration_days'],
                'featured' => $tier['featured'] ? '1' : '0',
            ],
        ]);

        update_post_meta($job_id, 'job_tier', $tier['id']);
        update_post_meta($job_id, 'job_tier_label', $tier['label']);
        update_post_meta($job_id, 'job_duration_days', $tier['duration_days']);
        update_post_meta($job_id, 'job_featured', $tier['featured'] ? '1' : '0');
        update_post_meta($job_id, 'job_price_cents', $tier['price_cents']);
        update_post_meta($job_id, 'job_payment_status', 'pending');

        return rest_ensure_response(['sessionId' => $session->id]);
    } catch (Exception $e) {
        return new WP_Error('stripe_error', $e->getMessage(), ['status' => 500]);
    }
}

