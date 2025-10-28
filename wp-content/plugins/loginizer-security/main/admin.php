<?php

if(!defined('ABSPATH')){
	die('HACKING ATTEMPT!');
}

if(current_user_can('activate_plugins')){
	add_action('admin_notices', 'loginizer_pro_free_version_nag');
	add_action('admin_notices', 'loginizer_pro_notices');
	add_filter('softaculous_expired_licenses', 'loginizer_pro_plugins_expired');
}

function loginizer_pro_free_version_nag(){
	
	if(!defined('LOGINIZER_VERSION')){
		return;
	}

	$dismissed_free = (int) get_option('loginizer_version_free_nag');
	$dismissed_pro = (int) get_option('loginizer_version_pro_nag');

	// Checking if time has passed since the dismiss.
	if(!empty($dismissed_free) && time() < $dismissed_pro && !empty($dismissed_pro) && time() < $dismissed_pro){
		return;
	}

	$showing_error = false;
	if(version_compare(LOGINIZER_VERSION, LOGINIZER_PRO_VERSION) > 0 && (empty($dismissed_pro) || time() > $dismissed_pro)){
		$showing_error = true;

		echo '<div class="notice notice-warning is-dismissible" id="loginizer-pro-version-notice" onclick="loginizer_pro_dismiss_notice(event)" data-type="pro">
		<p style="font-size:16px;">'.esc_html__('You are using an older version of Loginizer Security. We recommend updating to the latest version to ensure seamless and uninterrupted use of the application.', 'loginizer').'</p>
	</div>';
	}elseif(version_compare(LOGINIZER_VERSION, LOGINIZER_PRO_VERSION) < 0 && (empty($dismissed_free) || time() > $dismissed_free)){
		$showing_error = true;

		echo '<div class="notice notice-warning is-dismissible" id="loginizer-pro-version-notice" onclick="loginizer_pro_dismiss_notice(event)" data-type="free">
		<p style="font-size:16px;">'.esc_html__('You are using an older version of Loginizer. We recommend updating to the latest free version to ensure smooth and uninterrupted use of the application.', 'loginizer').'</p>
	</div>';
	}
	
	if(!empty($showing_error)){
		wp_register_script('loginizer-pro-version-notice', '', array('jquery'), LOGINIZER_PRO_VERSION, true );
		wp_enqueue_script('loginizer-pro-version-notice');
		wp_add_inline_script('loginizer-pro-version-notice', '
	function loginizer_pro_dismiss_notice(e){
		e.preventDefault();
		let target = jQuery(e.target);

		if(!target.hasClass("notice-dismiss")){
			return;
		}

		let jEle = target.closest("#loginizer-pro-version-notice"),
		type = jEle.data("type");

		jEle.slideUp();
		
		jQuery.post("'.admin_url('admin-ajax.php').'", {
			security : "'.wp_create_nonce('loginizer_version_notice').'",
			action: "loginizer_pro_version_notice",
			type: type
		}, function(res){
			if(!res["success"]){
				alert(res["data"]);
			}
		}).fail(function(data){
			alert("There seems to be some issue dismissing this alert");
		});
	}');
	}
}

function loginizer_pro_plugins_expired($plugins){
	global $loginizer;

	if(!empty($loginizer['license']) && empty($loginizer['license']['active']) && strpos($loginizer['license']['license'], 'SOFTWP') !== FALSE){
		$plugins[] = 'Loginizer';
	}

	return $plugins;
}

function loginizer_pro_notices(){
	global $loginizer;
	
	// We won't show this if not a SOFTWP license.
	if(empty($loginizer['license']) || !empty($loginizer['license']['active']) || strpos($loginizer['license']['license'], 'SOFTWP') === FALSE){
		return;
	}

	// The combined notice for all Softaculous plugin to show that the license has expired
	$dismissed_at = get_option('softaculous_expired_licenses', 0);
	$expired_plugins = apply_filters('softaculous_expired_licenses', []);
	$soft_wp_buy = 'https://www.softaculous.com/clients?ca=softwp_buy';

	if(
		!empty($expired_plugins) && 
		is_array($expired_plugins) &&
		count($expired_plugins) > 0 && 
		!defined('SOFTACULOUS_EXPIRY_LICENSES') && 
		(empty($dismissed_at) || ($dismissed_at + WEEK_IN_SECONDS) < time())
	){

		define('SOFTACULOUS_EXPIRY_LICENSES', true); // To make sure other plugins don't return a Notice
		$soft_rebranding = get_option('softaculous_pro_rebranding', []);

		if(!empty($loginizer['license']['has_plid'])){
			if(!empty($soft_rebranding['sn']) && $soft_rebranding['sn'] != 'Softaculous'){
				
				$msg = sprintf(__('Your SoftWP license has %1$sexpired%2$s. Please contact %3$s to continue receiving uninterrupted updates and support for %4$s.', 'loginizer-security'),
					'<font style="color:red;"><b>',
					'</b></font>',
					esc_html($soft_rebranding['sn']),
					esc_html(implode(', ', $expired_plugins))
				);
				
			}else{
				$msg = sprintf(__('Your SoftWP license has %1$sexpired%2$s. Please contact your hosting provider to continue receiving uninterrupted updates and support for %3$s.', 'loginizer-security'),
					'<font style="color:red;"><b>',
					'</b></font>',
					esc_html(implode(', ', $expired_plugins))
				);
			}
		}else{
			$msg = sprintf(__('Your SoftWP license has %1$sexpired%2$s. Please %3$srenew%4$s it to continue receiving uninterrupted updates and support for %5$s.', 'loginizer-security'),
				'<font style="color:red;"><b>',
				'</b></font>',
				'<a href="'.esc_url($soft_wp_buy.'&license='.$loginizer['license']['license'].'&plan='.$loginizer['license']['plan']).'" target="_blank">',
				'</a>',
				esc_html(implode(', ', $expired_plugins))
			);
		}
		
		
		echo '<div class="notice notice-error is-dismissible" id="loginizer-pro-expiry-notice">
				<p>'.$msg.'</p>
			</div>';

		wp_register_script('loginizer-pro-expiry-notice', '', array('jquery'), LOGINIZER_PRO_VERSION, true );
		wp_enqueue_script('loginizer-pro-expiry-notice');
		wp_add_inline_script('loginizer-pro-expiry-notice', '
		jQuery(document).ready(function(){
			jQuery("#loginizer-pro-expiry-notice").on("click", ".notice-dismiss", function(e){
				e.preventDefault();
				let target = jQuery(e.target);

				let jEle = target.closest("#loginizer-pro-expiry-notice");
				jEle.slideUp();
				
				jQuery.post("'.admin_url('admin-ajax.php').'", {
					security : "'.wp_create_nonce('loginizer_expiry_notice').'",
					action: "loginizer_pro_dismiss_expired_licenses",
				}, function(res){
					if(!res["success"]){
						alert(res["data"]);
					}
				}).fail(function(data){
					alert("There seems to be some issue dismissing this alert");
				});
			});
		})');
	}
}