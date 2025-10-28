<?php get_header(); ?>

<main class="single-painting-content">
  <?php if (have_posts()) : while (have_posts()) : the_post(); ?>

    <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>

      <!-- Painting Title -->
      <h1 class="painting-title"><?php the_title(); ?></h1> 

      <!-- Painting Image -->
      <div class="painting-image">
        <?php if (has_post_thumbnail()) : ?>
          <?php the_post_thumbnail('large'); ?>
        <?php endif; ?>
      </div>

      <!-- Painting Info Area -->
      <div class="painting-info">
        <p><strong>Medium:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'medium', true)); ?></p>
        <p><strong>Size:</strong> <?php echo esc_html(get_post_meta(get_the_ID(), 'size', true)); ?></p>
        <p><strong>Price:</strong> $<?php echo esc_html(get_post_meta(get_the_ID(), 'price', true)); ?></p>

        <!-- Painting Description -->
        <div class="painting-description">
          <?php the_content(); ?>
        </div>

        <?php
        $stripe_url = get_post_meta(get_the_ID(), 'stripe_url', true);
        $price = get_post_meta(get_the_ID(), 'price', true);

        if ($price == 0 || empty($stripe_url)) :
        ?>
          <p style="color: red; font-weight: bold;">Sold</p>
        <?php elseif ($stripe_url) : ?>
          <p><a class="buy-button" href="<?php echo esc_url($stripe_url); ?>" style="padding: 0.75rem 1.5rem; background: #222; color: #fff; text-decoration: none; border-radius: 6px; display: inline-block;" target="_blank">Buy Now</a></p>
        <?php endif; ?>
      </div>

    </article>

    <!-- Back Button -->
    <div style="margin-top: 2rem; text-align: center;">
      <a href="<?php echo get_post_type_archive_link('painting'); ?>" class="btn">
        ← Back to Paintings
      </a>
    </div>

  <?php endwhile; endif; ?>
</main>

<?php get_footer(); ?>
