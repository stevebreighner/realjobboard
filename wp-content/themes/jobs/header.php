<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>" />
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-0FYET61P72"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-0FYET61P72');
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="author" content="Stephen Breighner" />

  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">

  <title><?php bloginfo('name'); ?></title>

  <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
  <div id="wrapper">

    <!-- Logo -->
    <div id="logo">
      <img src="<?php echo get_template_directory_uri(); ?>/logo.jpg" alt="Logo">
    </div>

    <!-- Hamburger Toggle -->
    <div class="menu-toggle" onclick="document.body.classList.toggle('menu-open')">
      &#9776;
    </div>

    <!-- Minimal Dropdown Menu -->
    <nav class="simple-menu">
      <?php
wp_nav_menu([
  'theme_location' => 'primary',
  'menu_class'     => 'simple-menu-list', // optional, match your CSS
  'container'      => false,
  'items_wrap'     => '<ul id="primary-menu" class="%2$s">%3$s</ul>',
  'fallback_cb'    => function() {
      echo '<ul id="primary-menu" class="simple-menu-list">
              <li><a href="'.home_url().'">Home</a></li>
              <li><a href="'.home_url('/jobs').'">Jobs</a></li>
              <li><a href="'.home_url('/post-a-job').'">Post a Job</a></li>
              <li><a href="'.home_url('/login').'">Login</a></li>
            </ul>';
  }
]);
      ?>
    </nav>
