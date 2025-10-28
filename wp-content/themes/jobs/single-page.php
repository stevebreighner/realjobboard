<?php
/* Template Name: Featured Image + Small Images + Content */

get_header(); ?>

<main id="main" class="site-main" style="max-width: 900px; margin: 0 auto; padding: 40px 20px; background: #fff; color: #555;">
<!-- singel single single -->
  <?php
  if (have_posts()) :
    while (have_posts()) : the_post();

      // Featured Image
      if (has_post_thumbnail()) : ?>
        <div style="margin-bottom: 30px;">
          <?php the_post_thumbnail('full', ['style' => 'width: 100%; height: auto; border-radius: 12px;']); ?>
        </div>
      <?php endif;

      // Get smaller image IDs from a custom field (comma-separated IDs)
      $small_image_ids_raw = get_post_meta(get_the_ID(), 'small_image_ids', true);
      if ($small_image_ids_raw) {
        $small_image_ids = array_map('trim', explode(',', $small_image_ids_raw));
        echo '<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 30px;">';
        foreach ($small_image_ids as $image_id) {
          $img_url = wp_get_attachment_image_url($image_id, 'medium');
          if ($img_url) {
            echo '<img src="' . esc_url($img_url) . '" style="width: 150px; height: auto; border-radius: 8px;" />';
          }
        }
        echo '</div>';
      }

      // Content
      echo '<div class="entry-content" style="font-size: 16px; line-height: 1.6;">';
      the_content();
      echo '</div>';

    endwhile;
  endif;
  ?>

</main>

<?php get_footer(); ?>
