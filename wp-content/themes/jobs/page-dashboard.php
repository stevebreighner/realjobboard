<?php
/* Template Name: Dashboard */
get_header();

// --- Handle activation from URL ---
if (!empty($_GET['activate']) && !empty($_GET['user'])) {
    $user_id = intval($_GET['user']);
    $activation_key = sanitize_text_field($_GET['activate']);

    $saved_key = get_user_meta($user_id, 'activation_key', true);
    $is_verified = get_user_meta($user_id, 'is_verified', true);

    if ($saved_key && !$is_verified && $saved_key === $activation_key) {
        update_user_meta($user_id, 'is_verified', true);
        delete_user_meta($user_id, 'activation_key');

        // Auto-login user after activation
        wp_set_current_user($user_id);
        wp_set_auth_cookie($user_id);

        echo '<p style="color:green;">Your account has been activated and you are now logged in! <a href="' . esc_url(home_url('/dashboard')) . '">Go to Dashboard</a></p>';
    } else {
        echo '<p style="color:red;">Invalid activation link or account already activated.</p>';
    }
}

// --- Handle registration POST ---
if (!empty($_POST['register_submit'])) {
    $reg_errors = [];

    $username = sanitize_user($_POST['username']);
    $email = sanitize_email($_POST['email']);
    $password = $_POST['password'];
    $password_confirm = $_POST['password_confirm'];

    if (empty($username) || empty($email) || empty($password) || empty($password_confirm)) {
        $reg_errors[] = 'All fields are required.';
    }
    if (!is_email($email)) {
        $reg_errors[] = 'Invalid email address.';
    }
    if ($password !== $password_confirm) {
        $reg_errors[] = 'Passwords do not match.';
    }
    if (username_exists($username)) {
        $reg_errors[] = 'Username already exists.';
    }
    if (email_exists($email)) {
        $reg_errors[] = 'Email already in use.';
    }

    if (empty($reg_errors)) {
        // Create user but don't activate yet
        $user_id = wp_create_user($username, $password, $email);
        if (!is_wp_error($user_id)) {
            // Set role and verification meta
            wp_update_user([
                'ID' => $user_id,
                'role' => 'job_seeker',
            ]);
            update_user_meta($user_id, 'is_verified', false);
            $activation_key = wp_generate_password(20, false);
            update_user_meta($user_id, 'activation_key', $activation_key);

            // Send activation email
            $activation_link = add_query_arg([
                'activate' => $activation_key,
                'user' => $user_id
            ], home_url('/dashboard'));

            $subject = 'Activate Your Account';
            $message = "Hi $username,\n\nThanks for registering. Please activate your account by clicking the link below:\n\n$activation_link\n\nIf you did not register, please ignore this email.";

            wp_mail($email, $subject, $message);

            echo '<p style="color:green;">Registration successful! Please check your email to activate your account.</p>';
        } else {
            $reg_errors[] = $user_id->get_error_message();
        }
    }

    if (!empty($reg_errors)) {
        echo '<ul style="color:red;">';
        foreach ($reg_errors as $error) {
            echo '<li>' . esc_html($error) . '</li>';
        }
        echo '</ul>';
    }
}

// --- Custom login verification filter ---
add_filter('authenticate', function ($user, $username, $password) {
    if (is_a($user, 'WP_User')) {
        $is_verified = get_user_meta($user->ID, 'is_verified', true);
        if (!$is_verified) {
            return new WP_Error('verification_required', __('<strong>ERROR</strong>: Please verify your email before logging in.'));
        }
    }
    return $user;
}, 30, 3);

// --- Show login/register form if not logged in ---
if (!is_user_logged_in()) {
    ?>
    <div class="auth-container" style="max-width: 400px; margin: 2rem auto;">
      <h2>Login</h2>
      <?php
      if (isset($_GET['login']) && $_GET['login'] == 'failed') {
          echo '<p style="color:red;">Login failed: Invalid username or password.</p>';
      }
      ?>
      <form method="post" action="<?php echo wp_login_url(get_permalink()); ?>">
        <label for="username">Username or Email</label>
        <input type="text" name="log" id="username" required>

        <label for="password">Password</label>
        <input type="password" name="pwd" id="password" required>

        <input type="submit" value="Log In">

        <input type="hidden" name="redirect_to" value="<?php echo esc_url(get_permalink()); ?>">
      </form>

      <p><a href="<?php echo wp_lostpassword_url(); ?>">Lost your password?</a></p>

      <hr>

      <h2>Register</h2>
      <form method="post" action="">
        <label for="reg_username">Username</label>
        <input type="text" name="username" id="reg_username" required>

        <label for="reg_email">Email</label>
        <input type="email" name="email" id="reg_email" required>

        <label for="reg_password">Password</label>
        <input type="password" name="password" id="reg_password" required>

        <label for="reg_password_confirm">Confirm Password</label>
        <input type="password" name="password_confirm" id="reg_password_confirm" required>

        <input type="submit" name="register_submit" value="Register">
      </form>
    </div>
    <?php
    get_footer();
    exit;
}

// --- Logged-in Dashboard ---
$current_user = wp_get_current_user();
$user_id = $current_user->ID;
$user_role = $current_user->roles[0]; // e.g. 'employer' or 'job_seeker'
?>

<div class="dashboard-container" style="max-width: 800px; margin: 2rem auto;">
  <h2>Welcome, <?php echo esc_html($current_user->display_name); ?></h2>

  <?php if ($user_role === 'employer') : ?>
    <h3>My Jobs</h3>
    <ul>
      <?php
      $jobs = new WP_Query([
          'post_type' => 'job',
          'author' => $user_id,
          'post_status' => ['publish', 'draft'],
          'posts_per_page' => -1
      ]);
      if ($jobs->have_posts()) :
          while ($jobs->have_posts()) : $jobs->the_post(); ?>
            <li>
              <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>

              <ul class="submissions">
                <?php
                $submissions = get_post_meta(get_the_ID(), 'job_applications', true);
                if ($submissions && is_array($submissions)) :
                    foreach ($submissions as $submission) :
                        echo '<li>' . esc_html($submission['name']) . ' - ' . esc_html($submission['email']) . '</li>';
                    endforeach;
                else :
                    echo '<li>No applicants yet.</li>';
                endif;
                ?>
              </ul>
            </li>
          <?php endwhile;
          wp_reset_postdata();
      else :
          echo '<li>No jobs posted yet.</li>';
      endif;
      ?>
    </ul>
  <?php elseif ($user_role === 'job_seeker') : ?>
    <h3>Your Applications</h3>
    <p>(This section will list jobs you've applied to.)</p>
  <?php endif; ?>
</div>

<?php get_footer(); ?>
