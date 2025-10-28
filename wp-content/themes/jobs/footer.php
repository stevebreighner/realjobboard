</div><!-- #wrapper end -->

<!-- Footer -->
<footer id="site-footer" class="site-footer" style="background-color: #111; color: #aaa; text-align: center; padding: 20px;">
  <p style="font-size: 10px; margin: 0;">
    &copy; <?php echo date('Y'); ?> Stephen Breighner. All rights reserved.
    <br>
    <a href="/about" style="color: #aaa; text-decoration: underline; margin: 0 5px;">About</a> |
    <a href="/contact" style="color: #aaa; text-decoration: underline; margin: 0 5px;">Contact</a> |
    <a href="https://www.tiktok.com/@stevedrawings" target="_blank" rel="noopener noreferrer" class="tiktok-link" style="color: #aaa; text-decoration: underline; margin: 0 5px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 12px; height: 12px; fill: #aaa; margin-right: 4px; vertical-align: text-bottom;">
        <path d="M448,209.9v103.2c0,108.1-87.7,195.9-195.9,195.9S56.2,421.2,56.2,313.1s87.7-195.9,195.9-195.9c6.5,0,12.9,0.3,19.2,0.9
        v111.7c0,24.5-19.9,44.4-44.4,44.4c-24.5,0-44.4-19.9-44.4-44.4s19.9-44.4,44.4-44.4c6.4,0,12.5,1.4,18.1,3.9V96.2
        c-6.5-0.9-13.2-1.4-20-1.4c-59.2,0-107.2,48-107.2,107.2s48,107.2,107.2,107.2c59.2,0,107.2-48,107.2-107.2V161
        c17.6,11.4,38.5,18,61.1,18H448z"/>
      </svg>
      @stevedrawings
    </a>
  </p>
</footer>

<!-- Slim Hamburger Toggle Script -->
<script>
  document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.querySelector('.menu-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        document.body.classList.toggle('menu-open');
      });
    }
  });
</script>

<?php wp_footer(); ?>

</body>
</html>
