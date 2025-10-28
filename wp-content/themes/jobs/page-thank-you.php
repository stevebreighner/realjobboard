<?php
/* Template Name: Thank You */

require_once get_template_directory() . '/stripe/vendor/autoload.php'; // Load Stripe SDK
\Stripe\Stripe::setApiKey(STRIPE_SECRET_KEY);

// Get session ID from URL
$session_id = isset($_GET['session_id']) ? sanitize_text_field($_GET['session_id']) : '';

if (!$session_id) {
    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    get_template_part(404);
    exit;
}

try {
    $session = \Stripe\Checkout\Session::retrieve($session_id);

    if ($session->payment_status !== 'paid') {
        global $wp_query;
        $wp_query->set_404();
        status_header(404);
        get_template_part(404);
        exit;
    }

    $post_id = $session->metadata->post_id ?? null;
    $post_type = $session->metadata->post_type ?? '';

    if (!$post_id || get_post_type($post_id) !== $post_type) {
        global $wp_query;
        $wp_query->set_404();
        status_header(404);
        get_template_part(404);
        exit;
    }

    if ($post_type === 'book') {
        $stored = get_transient('book_download_' . $post_id);
        if ($stored) {
            // Build secure file path
            $filename = sanitize_file_name(get_post_field('post_name', $post_id)) . '.epub';
            $file_path = '/home/stepusmy/books/' . $filename;

            if (file_exists($file_path)) {
                // Clean output buffer
                if (ob_get_length()) {
                    ob_end_clean();
                }

                // Send file for download
                header('Content-Description: File Transfer');
                header('Content-Type: application/epub+zip');
                header('Content-Disposition: attachment; filename="' . $filename . '"');
                header('Content-Transfer-Encoding: binary');
                header('Expires: 0');
                header('Cache-Control: must-revalidate');
                header('Pragma: public');
                header('Content-Length: ' . filesize($file_path));

                readfile($file_path);
                exit;
            } else {
                get_header();
                echo "<h2>Thank you for your purchase!</h2>";
                echo "<p>Download file not found. Please contact support.</p>";
                get_footer();
                exit;
            }
        } else {
            get_header();
            echo "<h2>Thank you for your purchase!</h2>";
            echo "<p>Your download link has expired or is invalid.</p>";
            get_footer();
            exit;
        }
    }

    // Non-book: show normal thank-you message
    get_header();
    echo "<h2>Thank you for your purchase!</h2>";
    echo "<p>Your payment was successful.</p>";
    get_footer();
    exit;

} catch (Exception $e) {
    global $wp_query;
    $wp_query->set_404();
    status_header(404);
    get_template_part(404);
    exit;
}
