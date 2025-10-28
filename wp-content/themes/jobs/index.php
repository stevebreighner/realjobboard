<?php get_header(); ?>

<main class="site-main">
  <h1>Latest Posts</h1>

  <?php if ( have_posts() ) : ?>
    <?php while ( have_posts() ) : the_post(); ?>
      <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
        <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
        <div class="entry-content">
          <?php the_excerpt(); ?>
        </div>
      </article>
    <?php endwhile; ?>

    <?php the_posts_navigation(); ?>

  <?php else : ?>
    <p>No content found.</p>
  <?php endif; ?>
</main>

<?php get_footer(); ?>
