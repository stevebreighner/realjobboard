import { CONFIG } from '../config.js';

export function renderTerms(container) {
  const companyName = CONFIG.COMPANY_NAME || 'Our Platform';
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold">Terms & Disclaimer</h1>
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
          <h2 class="text-xl font-semibold mb-2">Disclaimer</h2>
          <p class="text-gray-700 mb-3">
            The ${companyName} platform is provided as a service for connecting job seekers and employers. By using this site, you acknowledge and agree that:
          </p>
          <ol class="list-decimal pl-5 space-y-2 text-gray-700">
            <li>${companyName} makes no guarantees regarding job listings, employer practices, or hiring outcomes. Users are responsible for verifying all information before acting on it.</li>
            <li>All interactions between job seekers and employers occur at the user’s own risk. ${companyName} is not responsible for any disputes, losses, or damages arising from these interactions.</li>
            <li>While we take reasonable steps to protect your privacy, users are responsible for the information they share on the platform. ${companyName} does not sell personal data.</li>
            <li>This site may contain links to third‑party websites. We are not responsible for the content, accuracy, or practices of these external sites.</li>
            <li>To the maximum extent permitted by law, ${companyName} and its owners, employees, and affiliates disclaim any liability for damages of any kind arising from the use of the platform, including but not limited to direct, indirect, incidental, or consequential losses.</li>
          </ol>
          <p class="text-gray-700 mt-3">
            By using this platform, you agree to these terms and accept that your participation is voluntary and at your own risk.
          </p>
        </div>
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
