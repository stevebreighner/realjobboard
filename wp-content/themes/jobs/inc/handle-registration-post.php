<?php
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
            ], home_url('/dashboard')); // change this if you want a dedicated activation page

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

// --- Custom login to check verification ---
add_filter('authenticate', function ($user, $username, $password) {
    if (is_a($user, 'WP_User')) {
        $is_verified = get_user_meta($user->ID, 'is_verified', true);
        if (!$is_verified) {
            return new WP_Error('verification_required', __('<strong>ERROR</strong>: Please verify your email before logging in.'));
        }
    }
    return $user;
}, 30, 3);
?>