export function renderAbout(container) {
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold">About</h1>
        <p class="text-sm text-gray-600">
          Straightforward, private, and fair job search. Built for clarity and trust.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="border rounded-2xl p-4 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Privacy</div>
          <p class="text-sm text-gray-700">
            We collect only what’s needed to apply and review applicants.
          </p>
        </div>
        <div class="border rounded-2xl p-4 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Verification</div>
          <p class="text-sm text-gray-700">
            Employers are verified before posting to reduce spam and scams.
          </p>
        </div>
      </div>

      <div class="border rounded-2xl p-5 md:p-6 bg-white shadow-sm space-y-5">
        <div>
          <h2 class="text-xl font-semibold mb-2">What We Collect</h2>
          <p class="text-gray-700">
            We collect only what’s needed to apply for jobs and to help employers review candidates. You control what you
            add to your profile and when employers can see it.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Your Visibility Controls</h2>
          <p class="text-gray-700">
            You can hide your email address in your profile. Employers then see “Email hidden — use resume link only.”
            You decide when to share direct contact info.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Abuse Reporting</h2>
          <p class="text-gray-700">
            Every applicant and employer has access to a report abuse link, and reports go directly to site admins for review.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Data Protection</h2>
          <p class="text-gray-700">
            We use standard web security practices (HTTPS in transit and access controls in the app). We do not sell your data.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Our Promise</h2>
          <p class="text-gray-700">
            This is a focused, privacy-respecting job board. If you need something clarified or want data removed, contact us
            through the support form and we’ll help.
          </p>
        </div>
      </div>
    </div>
`};
