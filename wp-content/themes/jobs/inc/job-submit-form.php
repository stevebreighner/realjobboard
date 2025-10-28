<?php
function job_submission_form() {
    if (!is_user_logged_in() || !current_user_can('edit_posts')) {
        return 'Please log in as an employer to submit jobs.';
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['job_title'])) {
        $post_data = [
            'post_title' => sanitize_text_field($_POST['job_title']),
            'post_content' => sanitize_textarea_field($_POST['job_description']),
            'post_type' => 'job',
            'post_status' => 'draft',
            'post_author' => get_current_user_id(),
        ];
        $post_id = wp_insert_post($post_data);

        if ($post_id) {
            // Optionally add meta like salary, location, etc.
            update_post_meta($post_id, 'salary', sanitize_text_field($_POST['salary']));

            return 'Job submitted successfully and is pending review.';
        }
    }

    ob_start();
    ?>
    <form method="POST">
        <label>Job Title</label><br/>
        <input type="text" name="job_title" required/><br/><br/>
        <label>Job Description</label><br/>
        <textarea name="job_description" rows="5" required></textarea><br/><br/>
        <label>Salary</label><br/>
        <input type="text" name="salary"/><br/><br/>
        <input type="submit" value="Submit Job"/>
    </form>
    <?php
    return ob_get_clean();
}
add_shortcode('job_submission_form', 'job_submission_form');
