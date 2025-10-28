<?php
/* Template Name: Login-Section */
get_header();

if ( is_user_logged_in() ) {
    wp_redirect(home_url('/dashboard'));
    exit;
}

$login_error = '';
if (isset($_POST['log'])) {
    $creds = [
        'user_login'    => $_POST['log'],
        'user_password' => $_POST['pwd'],
        'remember'      => isset($_POST['rememberme']),
    ];
    $user = wp_signon($creds, false);

    if (is_wp_error($user)) {
        $login_error = $user->get_error_message();
    } else {
        $role = $user->roles[0] ?? '';
        $redirect = home_url('/dashboard');
        wp_redirect($redirect);
        exit;
    }
}
?>

<div class="login-form-container">
  <h2>Login</h2>
  <?php if ($login_error): ?>
    <div class="login-error"><?php echo wp_kses_post($login_error); ?></div>
  <?php endif; ?>

  <form method="post">
    <p>
      <label for="log">Username or Email</label><br>
      <input type="text" name="log" id="log" required>
    </p>
    <p>
      <label for="pwd">Password</label><br>
      <input type="password" name="pwd" id="pwd" required>
    </p>
    <p>
      <input type="checkbox" name="rememberme" id="rememberme" value="forever">
      <label for="rememberme">Remember Me</label>
    </p>
    <p>
      <button type="submit">Login</button>
    </p>
  </form>

  <p><a href="<?php echo wp_lostpassword_url(); ?>">Forgot your password?</a></p>
  <p>Don't have an account? <a href="<?php echo home_url('/register'); ?>">Register</a></p>
</div>

<?php get_footer(); ?>
