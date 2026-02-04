export function renderAbout(container) {
  container.innerHTML = `
<div class="flex flex-col items-center justify-center text-left min-h-screen p-8 bg-gray-50 text-gray-900">
  <section id="about" class="py-8 px-4 max-w-4xl w-full">
    <h2 class="text-3xl font-semibold mb-4">About This Job Board</h2>
    <p class="text-lg text-gray-700 mb-6">
      This site is built to keep job searching straightforward, private, and fair. We focus on real job matches,
      clear employer expectations, and tools that help you control what you share.
    </p>

    <h3 class="text-2xl font-semibold mt-6 mb-3">What We Collect</h3>
    <p class="text-lg text-gray-700 mb-4">
      We collect only what’s needed to apply for jobs and to help employers review candidates. You control what you
      add to your profile and when employers can see it.
    </p>

    <h3 class="text-2xl font-semibold mt-6 mb-3">Your Visibility Controls</h3>
    <p class="text-lg text-gray-700 mb-4">
      You can hide your email address in your profile. Employers then see “Email hidden — use resume link only.”
      You decide when to share direct contact info.
    </p>

    <h3 class="text-2xl font-semibold mt-6 mb-3">Verified Employers</h3>
    <p class="text-lg text-gray-700 mb-4">
      Employers must be verified before posting jobs. This keeps listings higher quality and reduces spam.
    </p>

    <h3 class="text-2xl font-semibold mt-6 mb-3">Abuse Reporting</h3>
    <p class="text-lg text-gray-700 mb-4">
      Every applicant and employer has access to a report abuse link, and reports go directly to site admins for review.
    </p>

    <h3 class="text-2xl font-semibold mt-6 mb-3">Data Protection</h3>
    <p class="text-lg text-gray-700 mb-4">
      We use standard web security practices (HTTPS in transit and access controls in the app). We do not sell your data.
    </p>

    <h3 class="text-2xl font-semibold mt-6 mb-3">Our Promise</h3>
    <p class="text-lg text-gray-700">
      This is a focused, privacy-respecting job board. If you need something clarified or want data removed, contact us
      through the support form and we’ll help.
    </p>
  </section>
</div>
`};
