<?php
// 1. Add admin menu item
add_action('admin_menu', function () {
    add_menu_page(
        'Stripe Updater',
        'Stripe Updater',
        'manage_options',
        'stripe-updater',
        'render_stripe_updater_settings_page'
    );
});

// 2. Render the settings page
function render_stripe_updater_settings_page() {
    ?>
    <div class="wrap">
        <h1>Stripe Daily Post Updater</h1>
        <form method="post" action="">
            <?php wp_nonce_field('update_stripe_ids'); ?>
            <label for="stripe_post_ids">Post IDs to update daily (comma-separated):</label><br>
            <input type="text" name="stripe_post_ids" id="stripe_post_ids" value="<?php echo esc_attr(implode(',', get_option('daily_stripe_update_ids', []))); ?>" style="width: 100%; max-width: 500px;"><br><br>
            <input type="submit" name="submit_stripe_ids" class="button button-primary" value="Save Post IDs">
        </form>
    </div>
    <?php
}

// 3. Handle form submission
add_action('admin_init', function () {
    if (
        isset($_POST['submit_stripe_ids']) &&
        check_admin_referer('update_stripe_ids') &&
        current_user_can('manage_options')
    ) {
        $raw_ids = sanitize_text_field($_POST['stripe_post_ids']);
        $id_array = array_filter(array_map('intval', explode(',', $raw_ids)));

        update_option('daily_stripe_update_ids', $id_array);

        add_action('admin_notices', function () {
            echo '<div class="notice notice-success is-dismissible"><p>Post IDs updated.</p></div>';
        });
    }
});
?>