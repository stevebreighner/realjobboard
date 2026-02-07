export function renderPrivacy(container) {
  container.innerHTML = `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold">Privacy</h1>
        <p class="text-sm text-gray-600">Clear, minimal data collection and no selling your info.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="border rounded-2xl p-4 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">No Data Sales</div>
          <p class="text-sm text-gray-700">
            The platform is funded by paid job postings, not data sales.
          </p>
        </div>
        <div class="border rounded-2xl p-4 bg-white shadow-sm">
          <div class="text-xs uppercase tracking-widest text-indigo-600 mb-2">Opt‑In Only</div>
          <p class="text-sm text-gray-700">
            Optional updates are opt‑in — we never auto‑enroll.
          </p>
        </div>
      </div>

      <div class="border rounded-2xl p-5 md:p-6 bg-white shadow-sm space-y-5">
        <div>
          <h2 class="text-xl font-semibold mb-2">What We Collect</h2>
          <p class="text-gray-700">
            Profile details you provide (name, location, resume, cover letter, and contact preferences), plus basic account
            info needed to sign in and manage applications.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">How We Use It</h2>
          <p class="text-gray-700">
            We use your data only to run the job board, process applications, and help employers review applicants.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">No CRM‑Style Data Mining</h2>
          <p class="text-gray-700">
            We don’t use applicant data for unrelated marketing or CRM-style profiling.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Security</h2>
          <p class="text-gray-700">
            We use standard web security practices such as HTTPS in transit and access controls inside the app to protect
            your information.
          </p>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Contact</h2>
          <p class="text-gray-700">
            Questions or requests? Use the support form and we’ll respond quickly.
          </p>
        </div>
      </div>
    </div>
  `;
}
