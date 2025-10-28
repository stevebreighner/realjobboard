<?php get_header(); ?>

<main id="main" class="site-main" style="min-height: 80vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 20px; background: #111; color: #ddd; text-align: center;">

  <h1 style="font-size: 3rem; margin-bottom: 10px;">404</h1>
  <p style="font-size: 1.2rem; margin-bottom: 30px;">Oops! That page doesn’t exist. Try searching below.</p>

  <?php get_search_form(); ?>

  <div style="margin-top: 40px;">
    <a href="<?php echo esc_url(home_url('/')); ?>" style="color: #aaa; text-decoration: underline;">← Back to homepage</a>
  </div>

</main>

<?php get_footer(); ?>
