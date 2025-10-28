<?php
    require_once get_template_directory() . '/stripe/init.php';
    \Stripe\Stripe::setApiKey('sk_test_51P3zmJHlusB1EIZ8UedPKPM7dgISnZ5xiUNIulWdWp4djeJ7pLlp7GGXe5c8JIxM4EkPZGoMeaArda5D6hIJRhxC00DgCr6cEG');

    // \Stripe\Stripe::setApiKey('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');


if (!isset($_POST['price_id'])) {
    http_response_code(400);
    echo "Missing Stripe price ID.";
    exit;
}

$price_id = sanitize_text_field($_POST['price_id']);

try {
    $session = \Stripe\Checkout\Session::create([
        'mode' => 'payment',
        'line_items' => [[
            'price' => $price_id,
            'quantity' => 1,
        ]],
        'success_url' => home_url('/thank-you'),
        'cancel_url' => home_url($_SERVER['HTTP_REFERER'] ?? '/'),
    ]);

    header("Location: " . $session->url);
    exit;

} catch (Exception $e) {
    echo 'Stripe error: ' . $e->getMessage();
    http_response_code(500);
}
