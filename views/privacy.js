export function renderPrivacy(container) {
  container.innerHTML = `
    <div class="flex flex-col items-center justify-center text-left min-h-screen p-8 bg-gray-50 text-gray-900">
      <section class="py-8 px-4 max-w-4xl w-full">
        <h2 class="text-3xl font-semibold mb-4">Privacy</h2>
        <p class="text-lg text-gray-700 mb-6">
          We built this job board to respect privacy. We only collect what is needed to run the service and help you
          apply for jobs.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">What We Collect</h3>
        <p class="text-lg text-gray-700 mb-4">
          Profile details you provide (name, location, resume, cover letter, and contact preferences), plus basic account
          info needed to sign in and manage applications.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">How We Use It</h3>
        <p class="text-lg text-gray-700 mb-4">
          We use your data only to run the job board, process applications, and help employers review applicants.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">No CRM-Style Data Mining</h3>
        <p class="text-lg text-gray-700 mb-4">
          We don’t use applicant data for unrelated marketing or CRM-style profiling. If we ever offer optional
          updates, you can opt in — we don’t auto-enroll you.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">We Don’t Sell Your Info</h3>
        <p class="text-lg text-gray-700 mb-4">
          We do not sell or rent your personal data. The platform is funded by paid job postings, not by selling user
          information.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">Security</h3>
        <p class="text-lg text-gray-700 mb-4">
          We use standard web security practices such as HTTPS in transit and access controls inside the app to protect
          your information.
        </p>

        <h3 class="text-2xl font-semibold mt-6 mb-3">Contact</h3>
        <p class="text-lg text-gray-700">
          Questions or requests? Use the support form and we’ll respond quickly.
        </p>
      </section>
    </div>
  `;
}
