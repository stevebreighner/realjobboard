<?php
/* Template Name: About Page */
get_header();
?>

<div class="page-fullheight">
  <main class="about-container">
    <h1>About</h1>

    <!-- Artist Image -->
    <div class="about-image">
      <img src="<?php echo get_template_directory_uri(); ?>/images/about.jpg" alt="Stephen Breighner" />
    </div>

    <p>Hi, I'm Stephen Breighner, someone who does art (painting and inks and other) exploring line, form, and storytelling through illustrations and paintings (this was AI generated but I sort of like/agree with it so I'm leaving it for now). My work focuses on human emotion, absurdity, and playful contradictions (this too...I dont know how they know all this about me)</p>

    <p>Everything you see on this site is a reflection of my process, curiosity, and a love for both analog and digital expression. I'm currently working on various projects Including a series on various types of people drawings, which I'm adding to the <a href = "/illustrations">Illustrations</a> page and also one on the Stations of the Cross.</p>

    <p>You can follow me on <a href="https://www.tiktok.com/@stevedrawings" target="_blank" rel="noopener noreferrer">TikTok @stevedrawings</a> for work-in-progress videos and behind-the-scenes clips.</p>

    <p>
      <a class="artist-statement-link" href="<?php echo get_template_directory_uri(); ?>/assets/artist-statement.pdf" target="_blank">
        View Artist Statement (PDF) (Not available yet)
      </a>
    </p>
  </main>
</div>
  <?php get_footer(); ?>
</div>
