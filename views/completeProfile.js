import { renderProfile } from './profile.js';

export async function renderCompleteProfile(container) {
  await renderProfile(container);
  const wrapper = document.createElement('div');
  wrapper.className = 'max-w-5xl mx-auto px-4 mt-4';
  wrapper.innerHTML = `
    <div class="border rounded-xl p-4 bg-white shadow-sm text-sm text-slate-700">
      <strong>Complete your profile</strong> so we can finish setting up your account. This is required because Google only
      provides basic account info.
    </div>
  `;
  container.prepend(wrapper);
}
