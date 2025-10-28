document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.simple-menu');

  if (toggle && menu) {
      toggle.addEventListener('click', function () {
          document.body.classList.toggle('menu-open');
      });

      document.addEventListener('click', function (e) {
          if (!menu.contains(e.target) && !toggle.contains(e.target)) {
              document.body.classList.remove('menu-open');
          }
      });
  }
});
document.addEventListener('DOMContentLoaded', function () {
    const purchaseBtn = document.querySelector('#purchase-button');
    if (!purchaseBtn) return;
  
    purchaseBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const jobId = this.dataset.jobId;
  
      fetch(jobs_ajax.ajax_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'create_stripe_checkout',
          job_id: jobId
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.sessionId) {
          const stripe = Stripe(jobs_ajax.stripe_pk);
          stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else {
          alert('Error: ' + (data.error || 'Could not create session.'));
        }
      });
    });
  });
  