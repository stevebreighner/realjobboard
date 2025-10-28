<?php
/* Template Name: Jobs */
get_header();
?>

<div class="jobs-page" style="max-width: 900px; margin: 2rem auto; padding: 1rem;">
  <h2>Available Jobs</h2>

  <?php
  $jobs = new WP_Query([
      'post_type' => 'job',
      'post_status' => 'publish',
      'posts_per_page' => 10,
      'paged' => get_query_var('paged') ?: 1
  ]);

  if ($jobs->have_posts()) :
      while ($jobs->have_posts()) : $jobs->the_post();
          $author = get_the_author();
          ?>
          <div class="job-listing" style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #ccc;">
              <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
              <p><strong>Posted by:</strong> <?php echo esc_html($author); ?></p>
              <div><?php the_excerpt(); ?></div>
              <p><a href="<?php the_permalink(); ?>" style="color: #0073aa;">View Details</a></p>
          </div>
          <?php
      endwhile;

      // Pagination
      echo '<div class="pagination" style="text-align: center;">';
      echo paginate_links([
          'total' => $jobs->max_num_pages
      ]);
      echo '</div>';

      wp_reset_postdata();
  else :
      echo '<p>No jobs found.</p>';
  endif;
  ?>
</div>

<?php get_footer(); ?>
