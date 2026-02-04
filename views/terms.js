export function renderTerms(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center text-left min-h-screen p-8 bg-gray-50 text-gray-900">
      <section class="py-8 px-4 max-w-4xl w-full">
        <h2 class="text-3xl font-semibold mb-4">Terms</h2>
        <p class="text-lg text-gray-700 mb-6">
          By using this site, you agree to use it responsibly and to keep information accurate and respectful.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">Acceptable Use</h3>
        <p class="text-lg text-gray-700 mb-4">
          No spam, harassment, or fraudulent listings. We may remove content or accounts that violate these rules.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">Employer Verification</h3>
        <p class="text-lg text-gray-700 mb-4">
          Employers must be verified to post jobs. This keeps the platform high quality and protects job seekers.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">Payments</h3>
        <p class="text-lg text-gray-700 mb-4">
          Job postings are paid. This keeps the platform running without selling user data.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">No Unwanted Marketing</h3>
        <p class="text-lg text-gray-700 mb-4">
          We don’t use applicant data for CRM-style marketing or spam. Any optional updates are opt-in only.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">Reporting Abuse</h3>
        <p class="text-lg text-gray-700 mb-4">
          If you see a problem, use the report abuse link. We review reports promptly.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">Contact</h3>
        <p class="text-lg text-gray-700">
          Need help? Use the support form and we’ll respond.
        </p>
      </section>
    </div>
  `;
}
