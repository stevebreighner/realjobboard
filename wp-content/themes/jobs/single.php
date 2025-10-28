<?php get_header(); ?>

<main id="main" class="site-main" style="min-height: 100vh; background: #fff; color: #333; padding: 60px 20px; display: flex; flex-direction: column; align-items: center;">

  <!-- Featured Image Section -->
  <div class="featured-image" style="width: 100%; margin-bottom: 40px;">
    <?php if (has_post_thumbnail()) : ?>
      <img src="<?php the_post_thumbnail_url('full'); ?>" alt="<?php the_title(); ?>" style="width: 100%; height: auto;">
    <?php endif; ?>
  </div>

  <!-- Post Title -->
  <h1 style="font-size: 2.5rem; margin-bottom: 20px;"><?php the_title(); ?></h1>
<hr>
  <!-- Post Content -->
  <div class="post-content" style="max-width: 900px; width: 100%; padding: 20px; background: #f9f9f9; border-radius: 8px;">
    <?php the_content(); ?>
  </div>

  <!-- Smaller Images Section -->
  <div class="smaller-images" style="width: 100%; display: flex; flex-wrap: wrap; justify-content: center; margin-top: 40px;">
    <?php
      // Example: Displaying gallery or additional images related to the post.
      $images = get_attached_media('image'); // This will fetch attached images to the post
      foreach ($images as $image) :
    ?>
      <div class="smaller-image" style="flex: 1 1 calc(33.333% - 20px); margin: 10px; background-color: #e0e0e0; padding: 10px; border-radius: 8px;">
        <img src="<?php echo wp_get_attachment_url($image->ID); ?>" alt="<?php echo esc_attr($image->post_title); ?>" style="width: 100%; height: auto; border-radius: 6px;">
      </div>
    <?php endforeach; ?>
  </div>
  <a href="<?php echo esc_url( home_url('/latest') ); ?>" class="back-button">
    ← </a>
</main>

<?php get_footer(); ?>
