import { CONFIG } from '../config.js';

export async function renderListDetail(container, id) {
  try {
    const response = await fetch(`/wp-json/customapi/v1/get-list-detail?id=${id}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || 'Failed to fetch post');

    container.innerHTML = `
      <h1 class="text-2xl font-bold mb-4">${data.title}</h1>
      <p class="text-gray-600 text-sm mb-2">Posted by ${data.author} on ${data.date}</p>
      <div class="prose mb-4">${data.description}</div>

      ${data.meta ? Object.entries(data.meta).map(([key, val]) =>
        `<div class="mb-1"><strong>${key}:</strong> ${val}</div>`
      ).join('') : ''}

      <button id="submitAction" class="mt-6 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
        ${CONFIG.SUBMIT_LABEL}
      </button>

      <p class="mt-4"><a href="/#list" class="text-blue-600 hover:underline">← Back to List</a></p>
    `;

    document.getElementById('submitAction')?.addEventListener('click', () => {
      window.location.hash = `#apply?id=${id}`;
    });
    
  } catch (error) {
    container.innerHTML = `<p class="text-red-600">❌ Error: ${error.message}</p>`;
  }
}
