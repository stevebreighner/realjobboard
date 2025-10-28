export async function renderMyJobPostDetail(container, jobId) {
  container.innerHTML = `<p>Loading job details...</p>`;

  try {
    const response = await fetch(`/wp-json/customapi/v1/user-job-detail?id=${jobId}`, {
      credentials: 'include'
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to load job details');
    }

    const applicants = Array.isArray(data.applicants) ? data.applicants : [];

    container.innerHTML = `
      <div class="max-w-4xl mx-auto px-4">
        <h1 class="text-2xl font-bold mb-4">${data.title}</h1>
        <p class="text-gray-700 mb-4">${data.content}</p>
        <p class="text-sm text-gray-500 mb-4">Posted on: ${new Date(data.date).toLocaleDateString()}</p>

        <h2 class="text-xl font-semibold mb-2">Applicants (${applicants.length})</h2>
        <div id="applicantsContainer" class="space-y-2">
          ${
            applicants.length
              ? applicants.map(app => `
                  <div class="border rounded p-2 flex justify-between items-center">
                    <span>${app.name}</span>
                    <a href="${app.link}" class="text-blue-600 hover:underline text-sm">View Application</a>
                  </div>
                `).join('')
              : `<p class="text-gray-500">No applicants yet.</p>`
          }
        </div>

        <p class="mt-4">
          <a href="/#my-job-posts" class="text-blue-600 hover:underline">← Back to My Jobs</a>
        </p>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<p class="text-red-600">❌ Error: ${err.message}</p>`;
    console.error(err);
  }
}
