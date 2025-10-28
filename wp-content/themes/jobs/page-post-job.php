<?php
/* Template Name: Post a Job */
get_header();

// Require login
if (!is_user_logged_in()) {
    echo '<p style="text-align:center; margin: 2rem;">Please <a href="/dashboard">log in</a> to post a job.</p>';
    get_footer();
    exit;
}

$current_user = wp_get_current_user();
if (!in_array('employer', $current_user->roles)) {
    echo '<p style="text-align:center; margin: 2rem;">Only employers can post jobs.</p>';
    get_footer();
    exit;
}

// Handle job form submission
if (!empty($_POST['submit_job'])) {
    $title = sanitize_text_field($_POST['job_title']);
    $desc = wp_kses_post($_POST['job_description']);

    if ($title && $desc) {
        $job_id = wp_insert_post([
            'post_title'   => $title,
            'post_content' => $desc,
            'post_type'    => 'job',
            'post_status'  => 'publish',
            'post_author'  => get_current_user_id()
        ]);

        if ($job_id) {
            echo '<p style="color:green; text-align:center;">Job posted successfully! <a href="' . get_permalink($job_id) . '">View Job</a></p>';
        } else {
            echo '<p style="color:red; text-align:center;">Failed to post job. Please try again.</p>';
        }
    } else {
        echo '<p style="color:red; text-align:center;">Title and Description are required.</p>';
    }
}
?>

<div class="post-job-form" style="max-width:600px; margin:2rem auto; padding:1rem; border:1px solid #ddd; border-radius:8px;">
  <h2>Post a Job</h2>
  <form method="post" action="">
    <label for="job_title">Job Title</label>
    <input type="text" name="job_title" id="job_title" required style="width:100%; padding:0.5rem; margin-bottom:1rem;">

    <label for="job_description">Job Description</label>
    <textarea name="job_description" id="job_description" rows="8" required style="width:100%; padding:0.5rem; margin-bottom:1rem;"></textarea>

    <input type="submit" name="submit_job" value="Post Job" style="padding:0.5rem 1.5rem; background:#0073aa; color:white; border:none; border-radius:4px;">
  </form>
</div>

<?php get_footer(); ?>
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
