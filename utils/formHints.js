export function attachFieldHints(form) {
  if (!form) return;
  const fields = form.querySelectorAll('input, select, textarea');
  fields.forEach((el) => {
    if (el.dataset.hintBound) return;
    el.dataset.hintBound = '1';
    const msg = document.createElement('div');
    msg.className = 'text-xs text-red-600 mt-1 hidden';
    el.insertAdjacentElement('afterend', msg);

    const isRequired = () => el.hasAttribute('required');
    const isEmpty = () => {
      if (el.type === 'checkbox') return !el.checked;
      return !String(el.value || '').trim();
    };
    const requiredMsg = () => el.dataset.requiredMsg || (el.name === 'zip' ? 'Please enter a ZIP code.' : 'This field is required.');
    const lockedMsg = () => el.dataset.lockedMsg || 'This field is locked.';

    const show = (text) => {
      msg.textContent = text;
      msg.classList.remove('hidden');
    };
    const hide = () => {
      msg.textContent = '';
      msg.classList.add('hidden');
    };

    el.addEventListener('blur', () => {
      if (isRequired() && isEmpty()) {
        show(requiredMsg());
      } else {
        hide();
      }
    });
    el.addEventListener('input', () => {
      if (!isEmpty()) hide();
    });
    el.addEventListener('change', () => {
      if (!isEmpty()) hide();
    });
    el.addEventListener('focus', () => {
      if (el.readOnly || el.disabled) {
        show(lockedMsg());
      }
    });
  });
}
