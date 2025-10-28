<?php

if(!defined('ABSPATH')){
	die('HACKING ATTEMPT!');
}

// Shortcode has options shape|divider|type
add_shortcode('loginizer_social', 'loginizer_social_shortcode');

if(!empty($_COOKIE['lz_social_error'])){
	add_action('woocommerce_before_customer_login_form', 'loginizer_social_wc_error');
}

if(!empty($loginizer['social_settings']['general']['save_avatar'])){
	add_filter('get_avatar', 'loginizer_social_update_avatar', 1, 5);
}

if(!empty($loginizer['social_settings']['login']['registration_form'])){
	add_action('register_form', 'loginizer_social_btn_login', 100);
}

if(in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))){
	if(!empty($loginizer['social_settings']['woocommerce']['login_form'])){
		add_action('woocommerce_login_form', 'loginizer_social_btn_woocommerce', 100);
	}

	if(!empty($loginizer['social_settings']['woocommerce']['registration_form'])){
		add_action('woocommerce_register_form', 'loginizer_social_btn_woocommerce');
	}
}

if(!empty($loginizer['social_settings']['comment']['enable_buttons'])){
	add_action('comment_form_must_log_in_after', 'loginizer_social_btn_comment');
}

// ---- FUNCTIONS ----

function loginizer_social_shortcode($atts){
	global $loginizer;
	
	if(is_user_logged_in()){
		return;
	}

	$atts = shortcode_atts([
		'type' => 'icon',
		'divider' => 'above',
		'shape' => 'square'
	], $atts);
	
	$errors = loginizer_social_login_error_handler();
	
	if(!empty($errors) || is_wp_error($errors)){
		$error = '<style>.notice{background: #fff;border: 1px solid #c3c4c7;border-left-width: 4px;box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);margin: 5px 15px 2px;padding: 1px 12px;}.notice p,.notice-title {margin: 0.5em 0;padding: 2px;}.notice-error{border-left-color: #d63638;}.login-error-list{list-style: none;}</style><div class="loginizer-social-shortcode-error">';

		$args = [
			'type' => 'error',
		];
		
		// Add the number of retires left as well
		if(count($errors->get_error_codes()) > 0 && isset($loginizer['retries_left'])){
			$errors->add('retries_left', loginizer_retries_left());
		}
		
		$messages = $errors->get_error_messages();
		$notice = '';
		if(count($messages) == 1){
			$notice .= '<p>'.wp_kses_post($messages[0]).'</p>';
		} else {
			$notice .= '<ul class="login-error-list">';
			foreach($messages as $message) {
				$notice .= '<li>'.wp_kses_post($message).'</li>';
			}
			$notice .= '</ul>';
		}
		
		$error .= wp_get_admin_notice($notice, $args);
		$error .= '</div>';
	}

	if(!empty($error)){
		return $error . loginizer_social_btn(true, 'login', $atts);
	}

	return loginizer_social_btn(true, 'login', $atts);
}

function loginizer_social_wc_error(){

	// Showing woocommerce error
	if(!function_exists('wc_add_wp_error_notices')){
		return;
	}

	$errors = loginizer_social_login_error_handler();

	if(empty($errors) || !is_wp_error($errors)){
		return;
	}

	wc_add_wp_error_notices($errors);
	loginizer_woocommerce_error_handler();
	woocommerce_output_all_notices();
}

function loginizer_social_update_avatar($avatar, $id_or_email, $size, $default, $alt){
	global $wpdb, $blog_id;

	$user = false;

	if(empty($id_or_email)){
		return $avatar;
	}

	if(is_numeric($id_or_email)){
		$id = (int) $id_or_email;
		$user = get_user_by('id' , $id);
	} elseif(is_object($id_or_email)){
		if(!empty($id_or_email->user_id)){
			$id = (int) $id_or_email->user_id;
			$user = get_user_by('id' , $id);
		}
	} else {
		$user = get_user_by('email', $id_or_email);
	}

	if(empty($user) || !is_object($user) || empty($user->ID)){
		return $avatar;
	}
	
	// Fetching the Image now
	$avatar_id = get_user_meta($user->ID, $wpdb->get_blog_prefix($blog_id) . 'lz_avatar', true);

	if(!wp_attachment_is_image($avatar_id)){
		return $avatar;
	}
	
	$avatar_size = 'thumbnail';
	if(!empty($size)){
		$avatar_size = is_numeric($size) ? [$size, $size] : $size;
	}
	
	$avatar_url = wp_get_attachment_image_src($avatar_id, $avatar_size);
	
	if(empty($avatar_url) || empty($avatar_url[0])){
		return $avatar;
	}

	$avatar = $avatar_url[0];
	$avatar = '<img alt="'.esc_attr($alt).'" src="'.esc_url($avatar).'" class="avatar avatar-'.esc_attr($size).' photo" height="'.esc_attr($size).'" width="'.esc_attr($size).'" />';

	return $avatar;
}

function loginizer_social_btn_woocommerce($return = false, $id = ''){
	loginizer_social_btn($return, 'woocommerce');
}

function loginizer_social_btn_comment($post_id){
	loginizer_social_btn(false, 'comment');
}