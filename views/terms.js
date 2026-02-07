export function renderTerms(container) {
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold">Terms</h1>
        <p class="text-sm text-gray-600">Clear rules that keep the marketplace safe and useful.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="border rounded-2xl p-4 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Acceptable Use</div>
          <p class="text-sm text-gray-700">
            No spam, harassment, or fraudulent listings. Violations may be removed.
          </p>
        </div>
        <div class="border rounded-2xl p-4 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Verification</div>
          <p class="text-sm text-gray-700">
            Employers must be verified before posting jobs.
          </p>
        </div>
      </div>

      <div class="border rounded-2xl p-5 md:p-6 bg-white shadow-sm space-y-5">
        <div>
          <h2 class="text-xl font-semibold mb-2">Payments</h2>
          <p class="text-gray-700">
            Job postings are paid. This keeps the platform running without selling user data.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">No Unwanted Marketing</h2>
          <p class="text-gray-700">
            We don’t use applicant data for CRM-style marketing or spam. Any optional updates are opt‑in only.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Reporting Abuse</h2>
          <p class="text-gray-700">
            If you see a problem, use the report abuse link. We review reports promptly.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Contact</h2>
          <p class="text-gray-700">
            Need help? Use the support form and we’ll respond.
          </p>
        </div>
      </div>
    </div>
  `;
}
