import { CONFIG } from '../config.js';

export function renderPost(container) {
  container.innerHTML = `
    <h1 class="text-2xl font-bold mb-4">Post a ${CONFIG.COMPANY_BUSINESS_THING}</h1>
    <form id="postForm" class="space-y-4">
      ${CONFIG.fields.map(f => {
        const inputType = f.type === 'textarea'
          ? `<textarea name="${f.name}" class="w-full p-2 border rounded" placeholder="${f.label}" ${f.required ? 'required' : ''}></textarea>`
          : `<input type="${f.type}" name="${f.name}" class="w-full p-2 border rounded" placeholder="${f.label}" ${f.required ? 'required' : ''} />`;
        return inputType;
      }).join('')}
      <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">Submit</button>
    </form>
    <p class="mt-4"><a href="/#list" class="text-blue-600 hover:underline">Back to ${CONFIG.COMPANY_BUSINESS_THING_PLURAL}</a></p>
  `;

  const form = container.querySelector('#postForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());

    const response = await fetch('/wp-json/customapi/v1/create-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      alert(`${CONFIG.COMPANY_BUSINESS_THING} posted successfully!`);
      window.location.hash = '/#list';
    } else {
      const data = await response.json();
      alert('❌ Failed to post: ' + (data.message || 'Unknown error'));
    }
  });
}
