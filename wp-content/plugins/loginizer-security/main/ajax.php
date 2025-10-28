<?php

if(!defined('ABSPATH')){
	die('HACKING ATTEMPT');
}

// ==== Actions ====
add_action('wp_ajax_loginizer_pro_version_notice', 'loginizer_pro_version_notice');
add_action('wp_ajax_loginizer_wp_admin', 'loginizer_wp_admin_ajax'); // WP-Admin Test handler
add_action('wp_ajax_loginizer_update_csrf_mod', 'loginizer_update_csrf_mod'); // Handler for updating htaccess for rename admin and CSRF
add_action('wp_ajax_loginizer_pro_dismiss_expired_licenses', 'loginizer_pro_dismiss_expired_licenses');

if(!defined('SITEPAD') && loginizer_is_2fa_enabled() && !defined('XMLRPC_REQUEST')){
	// Ajax handler
	add_action('wp_ajax_loginizer_ajax', 'loginizer_user_page_ajax');
}


// ==== FUNCTIONS ====
function loginizer_pro_version_notice(){
	check_admin_referer('loginizer_version_notice', 'security');

	if(!current_user_can('activate_plugins')){
		wp_send_json_error(__('You do not have required access to do this action', 'loginizer'));
	}
	
	$type = '';
	if(!empty($_REQUEST['type'])){
		$type = sanitize_text_field(wp_unslash($_REQUEST['type']));
	}

	if(empty($type)){
		wp_send_json_error(__('Unknow version difference type', 'loginizer'));
	}
	
	update_option('loginizer_version_'. $type .'_nag', time() + WEEK_IN_SECONDS);
	wp_send_json_success();
}

// AJAX callback function used to generate new secret
function loginizer_user_page_ajax(){
	
	global $user_id;

	// Some AJAX security
	check_ajax_referer('loginizer_ajax', 'nonce');
	
	header('Content-Type: application/json');
	
	// Data
	$result = loginizer_2fa_app();
	
	// Echo JSON and die
	echo json_encode($result);
	die(); 
	
}

// AJAX callback function used to TEST the new SLUG
function loginizer_wp_admin_ajax(){
	
	global $user_id;

	// Some AJAX security
	check_ajax_referer('loginizer_admin_ajax', 'nonce');
	 
	if(!current_user_can('manage_options')){
		wp_die(__('Sorry, but you do not have permissions to change settings.', 'loginizer'));
	}
	
	header('Content-Type: application/json');
	
	// Data
	$result['result'] = '1';
	
	// Echo JSON and die
	echo json_encode($result);
	die(); 
	
}

// Updates the .htaccess for the CSRF session
function loginizer_update_csrf_mod(){

	global $loginizer;
	
	check_ajax_referer('loginizer_admin_ajax', 'nonce');
	
	$home_root = parse_url(home_url());

	if(isset($home_root['path'])){
		$home_root = trailingslashit($home_root['path']);
	} else {
		$home_root = '/';
	}
	
	$admin_slug = 'wp-admin';
	
	if(!empty($loginizer['admin_slug'])){
		$admin_slug = $loginizer['admin_slug'];
	}
	
	if(!empty(lz_optpost('admin_name'))){
		$admin_slug = lz_optpost('admin_name');
	}
	
	// Setting the rule
	$rule = '# BEGIN Loginizer' . "\n";
	$rule .= '<IfModule mod_rewrite.c>' . "\n";
	$rule .= 'RewriteEngine On' . "\n";
	$rule .= 'RewriteBase ' . $home_root . "\n\n";
	$rule .= 'RewriteRule ^' . $admin_slug . '(-lzs.{20})?(/?)(.*) wp-admin/$3 [L]' . "\n";
	$rule .= '</IfModule>' . "\n";
	$rule .= '# END Loginizer';

	$htaccess_file = ABSPATH . '/.htaccess';
	
	if(!file_exists($htaccess_file)){
		wp_send_json_error(0);
	}
	
	$contents = file_get_contents($htaccess_file);
	
	if(strpos($contents, '# BEGIN Loginizer') !== FALSE){
		$contents = preg_replace('/# BEGIN Loginizer.*# END Loginizer/ms', '', $contents);
	}

	if(!file_put_contents($htaccess_file, trim($rule . "\n" . $contents))){
		wp_send_json_error(0);
	}
	
	wp_send_json(array('success' => true));

}

function loginizer_pro_dismiss_expired_licenses(){
	check_admin_referer('loginizer_expiry_notice', 'security');

	if(!current_user_can('activate_plugins')){
		wp_send_json_error(__('You do not have required access to do this action', 'loginizer-security'));
	}

	update_option('softaculous_expired_licenses', time());
	wp_send_json_success();
}