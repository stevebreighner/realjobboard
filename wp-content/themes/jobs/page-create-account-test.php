<?php
/* Template Name: Create Account Test */

require_once __DIR__ . '/stripe/init.php'; // Adjust to your Stripe SDK path
\Stripe\Stripe::setApiKey('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
'); // Replace with your Stripe secret key

get_header();

echo '<div style="max-width: 600px; margin: 2rem auto; font-family: sans-serif;">';

if (isset($_GET['session_id'])) {
    try {
        $session = \Stripe\Checkout\Session::retrieve($_GET['session_id']);

        if ($session->payment_status === 'paid') {

            if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username'], $_POST['email'], $_POST['password'])) {
                $username = sanitize_user($_POST['username']);
                $email = sanitize_email($_POST['email']);
                $password = $_POST['password'];

                if (!username_exists($username) && !email_exists($email)) {
                    $user_id = wp_create_user($username, $password, $email);
                    if (!is_wp_error($user_id)) {
                        wp_set_current_user($user_id);
                        wp_set_auth_cookie($user_id);

                        wp_redirect(home_url('/test-dashboard/'));
                        exit;
                    } else {
                        echo '<p style="color:red;">Error: ' . $user_id->get_error_message() . '</p>';
                    }
                } else {
                    echo '<p style="color:red;">Username or email already exists.</p>';
                }
            }

            // Form display
            ?>
            <h2>Create a Test Account</h2><style>label{color:var(--dark);}</style>
            <form method="post">
                <p>
                    <label for="username">Username</label><br>
                    <input type="text" name="username" id="username" required>
                </p>
                <p>
                    <label for="email">Email</label><br>
                    <input type="email" name="email" id="email" required>
                </p>
                <p>
                    <label for="password">Password</label><br>
                    <input type="password" name="password" id="password" required>
                </p>
                <p>
                    <button type="submit">Register</button>
                </p>
            </form>
            <?php

        } else {
            echo '<p>Payment not completed.</p>';
        }
    } catch (Exception $e) {
        echo '<p>Error retrieving session: ' . esc_html($e->getMessage()) . '</p>';
    }
} else {
    echo '<p>Session ID is missing. Please return to the registration page after payment.</p>';
}

echo '</div>';

get_footer();
?>
