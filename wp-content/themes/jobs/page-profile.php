<?php
/* Template Name: Profile */
get_header();

if (!is_user_logged_in()) {
    wp_redirect(home_url('/login'));
    exit;
}

$current_user = wp_get_current_user();
?>

<div class="container">
  <h2>Your Profile</h2>
  <form method="post">
    <p>
      <label>Email</label><br>
      <input type="email" name="email" value="<?php echo esc_attr($current_user->user_email); ?>" required>
    </p>
    <p>
      <label>New Password</label><br>
      <input type="password" name="password">
      <br><small>Leave blank to keep current password</small>
    </p>
    <p><button type="submit" name="update_profile">Update</button></p>
  </form>
</div>

<?php
if (isset($_POST['update_profile'])) {
    $new_email = sanitize_email($_POST['email']);
    $new_password = $_POST['password'];

    wp_update_user([
        'ID' => $current_user->ID,
        'user_email' => $new_email,
        'user_pass' => $new_password ? $new_password : null
    ]);

    echo '<p class="success">Profile updated.</p>';
}

get_footer();
