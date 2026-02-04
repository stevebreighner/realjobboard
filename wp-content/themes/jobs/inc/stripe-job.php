<?php
// Legacy hook retained for older CPT flows (no-op for SPA flow)
add_action('save_post_job', 'jobs_create_stripe_checkout_for_job', 10, 3);

function jobs_create_stripe_checkout_for_job($post_id, $post, $update) {
    // Avoid autosaves and revisions
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (wp_is_post_revision($post_id)) return;

    // Only for published jobs
    if ($post->post_status !== 'publish') return;

    // Only run if explicit price meta exists
    $price = get_post_meta($post_id, 'price', true);
    if (!$price || !is_numeric($price)) return;
}

// Handle Stripe webhook for checkout.session.completed
function jobs_handle_stripe_webhook(WP_REST_Request $request) {
    require_once get_template_directory() . '/stripe/vendor/autoload.php';

    \Stripe\Stripe::setApiKey(defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '');
    if (!defined('STRIPE_SECRET_KEY') || !STRIPE_SECRET_KEY) {
        wp_send_json_error(['error' => 'Stripe secret key not configured']);
    }


    $endpoint_secret = defined('STRIPE_SECRET_SIGN') ? STRIPE_SECRET_SIGN : '';

    if (!$endpoint_secret) {
        return new WP_REST_Response('Stripe webhook secret not defined', 500);
    }

    $payload = $request->get_body();
    $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
    $event = null;

    try {
        $event = \Stripe\Webhook::constructEvent($payload, $sig_header, $endpoint_secret);
    } catch (\UnexpectedValueException $e) {
        return new WP_REST_Response('Invalid payload', 400);
    } catch (\Stripe\Exception\SignatureVerificationException $e) {
        return new WP_REST_Response('Invalid signature', 400);
    }

    if ($event->type === 'checkout.session.completed') {
        $session = $event->data->object;
        $post_id = $session->metadata->post_id ?? null;
        $duration_days = isset($session->metadata->duration_days) ? intval($session->metadata->duration_days) : 0;
        $featured = isset($session->metadata->featured) ? $session->metadata->featured : '0';
        $tier = isset($session->metadata->tier) ? sanitize_text_field($session->metadata->tier) : '';

        if ($post_id) {
            update_post_meta($post_id, 'job_payment_status', 'paid');
            update_post_meta($post_id, 'job_paid_at', time());
            if ($duration_days > 0) {
                update_post_meta($post_id, 'job_expires_at', time() + ($duration_days * 86400));
                update_post_meta($post_id, 'job_duration_days', $duration_days);
            }
            if ($tier) {
                update_post_meta($post_id, 'job_tier', $tier);
            }
            update_post_meta($post_id, 'job_featured', $featured === '1' ? '1' : '0');

            // Publish the job once paid
            wp_update_post([
                'ID' => $post_id,
                'post_status' => 'publish',
            ]);

            error_log("Stripe payment completed for job post ID: $post_id");
            if (function_exists('customapi_notify_site_admins')) {
                $title = get_the_title($post_id);
                customapi_notify_site_admins(
                    'Job payment received',
                    "Job: {$title}\nPost ID: {$post_id}\nTier: {$tier}\nFeatured: {$featured}\nDuration days: {$duration_days}"
                );
            }
        }
    }

    return new WP_REST_Response('Webhook handled', 200);
}





add_action('wp_ajax_create_stripe_checkout', 'create_stripe_checkout');
add_action('wp_ajax_nopriv_create_stripe_checkout', 'create_stripe_checkout');

function create_stripe_checkout() {
    require_once get_template_directory() . '/stripe/vendor/autoload.php';

    \Stripe\Stripe::setApiKey(defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '');
    if (!defined('STRIPE_SECRET_KEY') || !STRIPE_SECRET_KEY) {
        wp_send_json_error(['error' => 'Stripe secret key not configured']);
    }

    $job_id = intval($_POST['job_id']);
    $tier_id = isset($_POST['tier']) ? sanitize_text_field($_POST['tier']) : 'standard';
    if (!$job_id) {
        wp_send_json_error(['error' => 'Invalid job ID']);
    }

    if (!function_exists('customapi_get_job_tier')) {
        wp_send_json_error(['error' => 'Pricing not configured']);
    }
    $tier = customapi_get_job_tier($tier_id);
    $price = $tier['price_cents']; // in cents
    $job_title = get_the_title($job_id);

    try {
        $session = \Stripe\Checkout\Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => 'Job Listing: ' . $job_title,
                    ],
                    'unit_amount' => $price,
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'allow_promotion_codes' => true,
            'success_url' => home_url('/success?session_id={CHECKOUT_SESSION_ID}'),
            'cancel_url' => home_url('/cancel'),
            'metadata' => [
                'post_id' => $job_id,
                'post_type' => get_post_type($job_id),
                'tier' => $tier['id'],
                'duration_days' => $tier['duration_days'],
                'featured' => $tier['featured'] ? '1' : '0',
                'user_id' => get_current_user_id()
            ]
        ]);

        wp_send_json_success(['sessionId' => $session->id]);
    } catch (Exception $e) {
        wp_send_json_error(['error' => $e->getMessage()]);
    }
}

// Register webhook REST route
add_action('rest_api_init', function () {
    register_rest_route('jobs/stripe', '/webhook', [
        'methods' => 'POST',
        'callback' => 'jobs_handle_stripe_webhook',
        'permission_callback' => '__return_true',
    ]);
});
