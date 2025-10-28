
<?php
/* Template Name: Contact Page */
get_header();
?>
<div class="page-fullheight">
<main class="contact-container">
  <h1>Contact</h1>

  <p>If you'd like to get in touch, use the form below or email me directly at <a href="mailto:steve.breighner@gmail.com">steve.breighner@gmail.com</a>.</p>

  <form id="contact-form" action="https://formspree.io/f/xanoeyok" method="POST">
    <label for="name">Name</label>
    <input type="text" id="name" name="name" placeholder="Your Name" required>

    <label for="email">Email</label>
    <input type="email" id="email" name="email" placeholder="Your Email" required>

    <label for="message">Message</label>
    <textarea id="message" name="message" rows="6" placeholder="Your Message" required></textarea>

    <button type="submit">Send Message</button>
  </form>

  
  
  <hr style="margin: 40px 0;">

<h2>Join the Newsletter</h2>
<p>Get studio updates, new work, and upcoming releases in your inbox.</p>

<!-- Newsletter Signup Form -->
<form id="newsletter-form" action="https://formspree.io/f/xdkgeogb" method="POST">
  <label for="newsletter-email">Email Address</label>
  <input type="email" id="newsletter-email" name="email" placeholder="you@example.com" required>
  <button type="submit">Sign Up</button>
</form>

</div>  

</main>

<!-- Basic client-side validation -->
<script>
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("contact-form");

    form.addEventListener("submit", function (e) {
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        alert("Please fill in all fields.");
        e.preventDefault();
        return;
      }

      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        e.preventDefault();
      }
    });
  });
</script>

<?php get_footer(); ?>

