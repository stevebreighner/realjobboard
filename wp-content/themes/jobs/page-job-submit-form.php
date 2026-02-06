<?php
/*
Template Name: Job Submit Form
*/
get_header();

if ( is_user_logged_in() ) {
    echo do_shortcode('[job_submission_form]');
} else {
    echo '<p>Please <a href="' . wp_login_url() . '">log in</a> to submit a job.</p>';
}

get_footer();
