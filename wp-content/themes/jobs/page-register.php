<?php
/* Template Name: Register */
get_header();

if (is_user_logged_in()) {
    wp_redirect(home_url('/dashboard'));
    exit;
}
?>

<div class="container">
  <h2>Register</h2>
  <?php if (isset($_GET['success'])): ?>
    <p class="success">Registration successful! Please <a href="<?php echo home_url('/login'); ?>">log in</a>.</p>
  <?php endif; ?>

  <form method="post">
    <p>
      <label>Username</label><br>
      <input type="text" name="username" required>
    </p>
    <p>
      <label>Email</label><br>
      <input type="email" name="email" required>
    </p>
    <p>
      <label>Password</label><br>
      <input type="password" name="password" required>
    </p>
    <p>
      <label>Register as:</label><br>
      <select name="role" required>
        <option value="job_seeker">Job Seeker</option>
        <option value="employer">Employer</option>
      </select>
    </p>
    <p><button type="submit" name="register_user">Register</button></p>
  </form>
</div>

<?php
if (isset($_POST['register_user'])) {
    $username = sanitize_user($_POST['username']);
    $email = sanitize_email($_POST['email']);
    $password = $_POST['password'];
    $role = ($_POST['role'] === 'employer') ? 'employer' : 'job_seeker';

    $errors = [];

    if (username_exists($username) || email_exists($email)) {
        echo '<p class="error">Username or email already exists.</p>';
    } else {
        $user_id = wp_create_user($username, $password, $email);
        if (!is_wp_error($user_id)) {
            wp_update_user(['ID' => $user_id, 'role' => $role]);
            wp_redirect(home_url('/register?success=1'));
            exit;
        } else {
            echo '<p class="error">Error: ' . esc_html($user_id->get_error_message()) . '</p>';
        }
    }
}

get_footer();
