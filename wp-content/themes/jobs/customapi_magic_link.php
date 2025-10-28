<?php

// MAGIC LINK GENERATION
function customapi_send_magic_link($request) {
    global $wpdb;
    $email = sanitize_email($request['email']);
    if (!$email) return new WP_Error('no_email', 'Email is required', ['status' => 400]);
  
    $user = get_user_by('email', $email);
    if (!$user) return new WP_Error('not_found', 'No user found', ['status' => 404]);
  
    $token = bin2hex(random_bytes(32));
    $expires = time() + 900;
  
    $wpdb->insert("{$wpdb->prefix}user_magic_links", [
      'user_id'    => $user->ID,
      'token'      => $token,
      'expires_at' => $expires,
    ]);
  
    $magic_url = home_url("/wp-json/customapi/v1/magic-login?token=$token");
    wp_mail($email, "Magic Login Link", "Click here to login: $magic_url");
  
    return ['message' => '✅ Magic link sent'];
  }
  
  // MAGIC LINK LOGIN
  function customapi_handle_magic_login($request) {
    global $wpdb;
    $token = sanitize_text_field($request['token']);
  
    $row = $wpdb->get_row($wpdb->prepare("
      SELECT u.ID, u.user_login, u.user_email
      FROM {$wpdb->prefix}user_magic_links m
      JOIN {$wpdb->prefix}users u ON m.user_id = u.ID
      WHERE m.token = %s AND m.expires_at > %d
    ", $token, time()));
  
    if (!$row) {
      return new WP_Error('invalid_token', 'Invalid or expired token', ['status' => 401]);
    }
  
    $_SESSION['user'] = [
      'id'       => $row->ID,
      'username' => $row->user_login,
      'email'    => $row->user_email,
    ];
  
    $wpdb->delete("{$wpdb->prefix}user_magic_links", ['token' => $token]);
    return ['message' => '✅ Logged in via magic link', 'user' => $_SESSION['user']];
  }
?>