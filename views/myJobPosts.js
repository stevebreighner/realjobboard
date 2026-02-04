import { CONFIG } from '../config.js';

export function renderMyJobPosts(container) {
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4">My Job Posts</h1>

      <input
        type="text"
        id="searchInput"
        class="w-full p-2 border rounded mb-4"
        placeholder="Search my jobs..."
      />

      <div id="jobsContainer" class="space-y-4"></div>
    </div>
  `;

  const jobsContainer = container.querySelector('#jobsContainer');
  const searchInput = container.querySelector('#searchInput');

  fetch('/wp-json/customapi/v1/user-jobs')
    .then(res => res.json())
    .then(data => {
      let jobs = data;
      renderJobs(jobs);

      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filtered = jobs.filter(job =>
          ['title', 'summary'].some(field =>
            (job[field] || '').toLowerCase().includes(query)
          )
        );
        renderJobs(filtered);
      });
    })
    .catch(err => {
      jobsContainer.innerHTML = `<p class="text-red-600">Failed to load job posts.</p>`;
      console.error(err);
    });

  const getMeta = (job, key) => (job?.meta && job.meta[key] != null ? job.meta[key] : job?.[key]) ?? '';
  const isFeatured = (job) => ['1', 'true', 'yes'].includes(String(getMeta(job, 'job_featured') || '').toLowerCase());
  const isPaid = (job) => String(getMeta(job, 'job_payment_status') || '').toLowerCase() === 'paid';

  function renderJobs(jobs) {
    jobsContainer.innerHTML = jobs.length
      ? jobs
          .map(job => {
            const id = job.id || job._id || job.slug;
            const featured = isFeatured(job);
            const paid = isPaid(job);
            return `
              <div class="border rounded p-4 shadow">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold">${job.title || job.name}</h2>
                  <div class="flex items-center space-x-2">
                    ${featured ? `<span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">Featured</span>` : ''}
                    ${!paid ? `<span class="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded">Unpaid</span>` : ''}
                  </div>
                </div>
                <p class="text-sm text-gray-600">${job.summary || ''}</p>
                <a href="/#my-job-post-detail?id=${id}" class="text-indigo-600 text-sm mt-2 inline-block hover:underline">
                  View Job
                </a>
              </div>
            `;
          })
          .join('')
      : `<p>No job posts found.</p>`;
  }
}
