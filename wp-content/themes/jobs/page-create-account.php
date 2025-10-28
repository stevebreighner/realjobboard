<?php
/* Template Name: Create Account */
require_once get_template_directory() . '/stripe/init.php';
\Stripe\Stripe::setApiKey('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
'); // Replace with your real key

get_header();

// Optional: Verify Stripe session
$session_valid = false;
if (isset($_GET['session_id'])) {
    try {
        $session = \Stripe\Checkout\Session::retrieve($_GET['session_id']);
        if ($session->payment_status === 'paid') {
            $session_valid = true;
        }
    } catch (Exception $e) {
        echo '<p>Error verifying Stripe session: ' . $e->getMessage() . '</p>';
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $session_valid) {
    $email = sanitize_email($_POST['email']);
    $password = $_POST['password'];
    $username = sanitize_user(current(explode('@', $email)));

    if (!email_exists($email)) {
        $user_id = wp_create_user($username, $password, $email);
        if (!is_wp_error($user_id)) {
            wp_set_current_user($user_id);
            wp_set_auth_cookie($user_id);
            wp_redirect(home_url('/my-contacts'));
            exit;
        } else {
            echo '<p>Error: ' . $user_id->get_error_message() . '</p>';
        }
    } else {
        echo '<p>Email already exists.</p>';
    }
}
?>

<main class="create-account">
  <h2>Create Your Account</h2>

  <?php if ($session_valid): ?>
    <form method="post">
      <input type="email" name="email" placeholder="Your Email" required>
      <input type="password" name="password" placeholder="Choose Password" required>
      <button type="submit">Create Account</button>
    </form>
  <?php else: ?>
    <p>Stripe payment not confirmed. Please <a href="<?= home_url('/register-now'); ?>">try again</a>.</p>
  <?php endif; ?>
</main>

<?php get_footer(); ?>
