<?php
// Run on post save to create Stripe checkout session for 'job' CPT
add_action('save_post_job', 'jobs_create_stripe_checkout_for_job', 10, 3);

function jobs_create_stripe_checkout_for_job($post_id, $post, $update) {
    // Avoid autosaves and revisions
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (wp_is_post_revision($post_id)) return;

    // Only for published jobs
    if ($post->post_status !== 'publish') return;

    // Check if stripe_url already exists (avoid creating duplicate sessions)
    if (get_post_meta($post_id, 'stripe_url', true)) return;

    // Get price from post meta (assumed stored as a decimal number)
    $price = get_post_meta($post_id, 'price', true);
    if (!$price || !is_numeric($price)) return;

    // Load Stripe PHP SDK
    require_once get_template_directory() . '/stripe/vendor/autoload.php';

    // Set your Stripe secret key (define this in wp-config.php or theme constants)
    \Stripe\Stripe::setApiKey(defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '');

    if (!STRIPE_SECRET_KEY) {
        error_log('Stripe secret key not defined!');
        return;
    }

    $title = get_the_title($post_id);

    try {
        $session = \Stripe\Checkout\Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => ['name' => $title],
                    'unit_amount' => intval(floatval($price) * 100), // amount in cents
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => home_url('/thank-you?session_id={CHECKOUT_SESSION_ID}'),
            'cancel_url' => get_permalink($post_id),
            'metadata' => [
                'post_id' => $post_id,
                'post_type' => $post->post_type,
            ],
        ]);

        // Save session URL in post meta
        update_post_meta($post_id, 'stripe_url', esc_url_raw($session->url));

    } catch (Exception $e) {
        error_log('Stripe checkout creation error: ' . $e->getMessage());
    }
}

// Handle Stripe webhook for checkout.session.completed
function jobs_handle_stripe_webhook(WP_REST_Request $request) {
    require_once get_template_directory() . '/stripe/vendor/autoload.php';

    \Stripe\Stripe::setApiKey(defined('STRIPE_SECRET_KEY') ? STRIPE_SECRET_KEY : '');

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

        if ($post_id) {
            // Mark job as paid (for example, add post meta or change status)
            update_post_meta($post_id, 'job_payment_status', 'paid');
            // You could also send email notifications or trigger other actions here
            error_log("Stripe payment completed for job post ID: $post_id");
        }
    }

    return new WP_REST_Response('Webhook handled', 200);
}





add_action('wp_ajax_create_stripe_checkout', 'create_stripe_checkout');
add_action('wp_ajax_nopriv_create_stripe_checkout', 'create_stripe_checkout');

function create_stripe_checkout() {
    require_once get_template_directory() . '/stripe/vendor/autoload.php';

    \Stripe\Stripe::setApiKey('sk_test_XXX'); // Your Stripe Secret Key

    $job_id = intval($_POST['job_id']);
    if (!$job_id) {
        wp_send_json_error(['error' => 'Invalid job ID']);
    }

    $price = 4900; // in cents
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
            'success_url' => home_url('/success?session_id={CHECKOUT_SESSION_ID}'),
            'cancel_url' => home_url('/cancel'),
            'metadata' => [
                'job_id' => $job_id,
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
