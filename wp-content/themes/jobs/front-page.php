<?php
/* Template Name: Front Page */
get_header(); ?>

<div class="homepage-hero" style="text-align:center; padding: 4rem 2rem; background: #f5f5f5;">
  <h1>Find Your Next Opportunity</h1>
  <p>Discover jobs posted by top employers</p>
  <a href="/dashboard" class="button" style="padding: 0.75rem 1.5rem; background: #0073aa; color: white; border-radius: 4px;">Get Started</a>
</div>

<div class="homepage-jobs" style="max-width: 800px; margin: 4rem auto; padding: 0 2rem;">
  <h2>Recent Jobs</h2>
  <ul>
    <?php
    $jobs = new WP_Query([
        'post_type' => 'job',
        'post_status' => 'publish',
        'posts_per_page' => 5,
    ]);

    if ($jobs->have_posts()) :
        while ($jobs->have_posts()) : $jobs->the_post(); ?>
            <li style="margin-bottom: 1.5rem;">
              <a href="<?php the_permalink(); ?>" style="font-size: 1.2rem;"><?php the_title(); ?></a>
              <p><?php echo wp_trim_words(get_the_content(), 20); ?></p>
            </li>
        <?php endwhile;
        wp_reset_postdata();
    else :
        echo '<li>No jobs found.</li>';
    endif;
    ?>
  </ul>
</div>

<div class="homepage-cta" style="text-align:center; margin: 4rem auto;">
  <h3>Employers: Ready to post a job?</h3>
  <a href="/dashboard" class="button" style="padding: 0.75rem 1.5rem; background: #28a745; color: white; border-radius: 4px;">Post a Job</a>
</div>

<?php get_footer(); ?>
