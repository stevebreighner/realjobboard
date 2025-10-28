<?php get_header(); ?>

<main id="main" class="site-main" style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 20px; background: #fff; color: #ddd;">

  <h1 style="font-size: 2rem; margin-bottom: 30px;">
    Search results for: <em style="color: #aaa;"><?php echo get_search_query(); ?></em>
  </h1>

  <?php if (have_posts()) : ?>
    <ul style="list-style: none; padding: 0; margin: 0;">
      <?php while (have_posts()) : the_post(); ?>
        <li style="margin-bottom: 30px; border-bottom: 1px solid #333; padding-bottom: 20px;">
          <h2 style="font-size: 1.5rem; margin-bottom: 10px;">
            <a href="<?php the_permalink(); ?>" style="color: #5fd; text-decoration: none;">
              <?php the_title(); ?>
            </a>
          </h2>
          <p style="font-size: 0.95rem; color: #aaa;"><?php echo wp_trim_words(get_the_excerpt(), 25); ?></p>
        </li>
      <?php endwhile; ?>
    </ul>

    <div class="pagination" style="margin-top: 40px;">
      <?php the_posts_pagination([
        'mid_size' => 2,
        'prev_text' => '← Prev',
        'next_text' => 'Next →',
        'screen_reader_text' => ''
      ]); ?>
    </div>

  <?php else : ?>
    <p style="font-size: 1.1rem;">No results found. Try a different search:</p>
    <?php get_search_form(); ?>
  <?php endif; ?>

</main>

<?php get_footer(); ?>
