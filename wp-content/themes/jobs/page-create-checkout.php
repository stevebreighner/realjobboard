<?php
/**
 * Template Name: Create Checkout
 */

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once get_template_directory() . '/stripe/init.php';



    \Stripe\Stripe::setApiKey('sk_test_51P3zmJHlusB1EIZ8UedPKPM7dgISnZ5xiUNIulWdWp4djeJ7pLlp7GGXe5c8JIxM4EkPZGoMeaArda5D6hIJRhxC00DgCr6cEG');

    // \Stripe\Stripe::setApiKey('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');

    try {
        $session = \Stripe\Checkout\Session::create([
            'payment_method_types' => ['card'],
            'mode' => 'payment',
            'line_items' => [[
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => 'Website Registration',
                    ],
                    'unit_amount' => 2000,
                ],
                'quantity' => 1,
            ]],
            'success_url' => 'https://stephenbreighner.com/page-create-account?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => 'https://stephenbreighner.com/register-now',
        ]);
        wp_redirect($session->url);
        exit;
    } catch (Exception $e) {
        echo '<p>Error: ' . esc_html($e->getMessage()) . '</p>';
        exit;
    }
}

get_header();
?>

<main>
    <h2>Complete Your Registration</h2>
    <form method="post">
        <button type="submit">Register for $20</button>
    </form>
</main>

<?php get_footer(); ?>
