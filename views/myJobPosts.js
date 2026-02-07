import { CONFIG } from '../config.js';

export function renderMyJobPosts(container) {
  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4">${CONFIG.JOB_COPY?.MY_POSTS_TITLE || 'My Job Posts'}</h1>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input
          type="text"
          id="searchInput"
          class="w-full p-2 border rounded"
          placeholder="Search title or summary..."
        />
        <input
          type="text"
          id="fieldFilter"
          class="w-full p-2 border rounded"
          placeholder="Filter by field"
        />
        <select id="statusFilter" class="w-full p-2 border rounded">
          <option value="all" selected>All statuses</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="featured">Featured</option>
        </select>
      </div>
      <div class="flex flex-col md:flex-row gap-3 mb-4">
        <select id="sortSelect" class="w-full md:w-56 p-2 border rounded">
          <option value="newest" selected>Newest</option>
          <option value="oldest">Oldest</option>
          <option value="featured">Featured first</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      <div id="jobsContainer" class="space-y-4"></div>
    </div>
  `;

  const jobsContainer = container.querySelector('#jobsContainer');
  const searchInput = container.querySelector('#searchInput');
  const fieldFilter = container.querySelector('#fieldFilter');
  const statusFilter = container.querySelector('#statusFilter');
  const sortSelect = container.querySelector('#sortSelect');

  fetch('/api/user-jobs')
    .then(res => res.json())
    .then(data => {
      let jobs = data;

      const applyFilters = () => {
        const query = (searchInput.value || '').toLowerCase();
        const fieldQuery = (fieldFilter.value || '').toLowerCase();
        const status = statusFilter.value || 'all';
        const sortMode = sortSelect.value || 'newest';

        const filtered = jobs.filter(job => {
          const matchesQuery = !query || ['title', 'summary'].some(field =>
            (job[field] || '').toLowerCase().includes(query)
          );
          const jobField = (getMeta(job, 'field') || '').toLowerCase();
          const matchesField = !fieldQuery || jobField.includes(fieldQuery);
          const paid = isPaid(job);
          const featured = isFeatured(job);
          const statusOk =
            status === 'all' ||
            (status === 'paid' && paid) ||
            (status === 'unpaid' && !paid) ||
            (status === 'featured' && featured);
          return matchesQuery && matchesField && statusOk;
        });

        const sorted = [...filtered].sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime();
          const dateB = new Date(b.date || 0).getTime();
          if (sortMode === 'oldest') return dateA - dateB;
          if (sortMode === 'title') {
            const titleA = (a.title || '').toLowerCase();
            const titleB = (b.title || '').toLowerCase();
            return titleA.localeCompare(titleB);
          }
          if (sortMode === 'featured') {
            const diff = (isFeatured(b) ? 1 : 0) - (isFeatured(a) ? 1 : 0);
            if (diff !== 0) return diff;
          }
          return dateB - dateA;
        });

        renderJobs(sorted);
      };

      [searchInput, fieldFilter].forEach(el => el.addEventListener('input', applyFilters));
      statusFilter.addEventListener('change', applyFilters);
      sortSelect.addEventListener('change', applyFilters);
      applyFilters();
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
                  ${CONFIG.JOB_COPY?.VIEW_JOB || 'View job'}
                </a>
              </div>
            `;
          })
          .join('')
      : `<p>${CONFIG.JOB_COPY?.JOBS_EMPTY || 'No job posts found.'}</p>`;
  }
}
