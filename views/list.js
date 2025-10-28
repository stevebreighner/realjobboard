import { CONFIG } from '../config.js';

export function renderList(container) {
 

  container.innerHTML = `
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-2xl font-bold mb-4"> || 'Items'}</h1>

      <input
        type="text"
        id="searchInput"
        class="w-full p-2 border rounded mb-4"
        placeholder="Search..."
      />

      <div id="itemsContainer" class="space-y-4"></div>
    </div>
  `;

  const itemsContainer = container.querySelector('#itemsContainer');
  const searchInput = container.querySelector('#searchInput');

  fetch('/wp-json/customapi/v1/get-list')
    .then(res => res.json())
    .then(data => {
      let items = data;
      renderItems(items);

      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filtered = items.filter(item =>
          searchFields.some(field =>
            (item[field] || '').toLowerCase().includes(query)
          )
        );
        renderItems(filtered);
      });
    })
    .catch(err => {
      itemsContainer.innerHTML = `<p class="text-red-600">Failed to load data.</p>`;
      console.error(err);
    });

    function renderItems(items) {
      itemsContainer.innerHTML = items.length
        ? items
            .map(item => {
              const id = item.id || item._id || item.slug;
              return `
                <div class="border rounded p-4 shadow">
                  <h2 class="text-lg font-semibold">${item.title || item.name}</h2>
                  <p class="text-sm text-gray-600">${item.summary || ''}</p>
                  <a href="/#list-detail?id=${id}" class="text-indigo-600 text-sm mt-2 inline-block hover:underline">
                    View Details
                  </a>
                </div>
              `;
            })
            .join('')
        : `<p>No items found.</p>`;
    }
    
}
