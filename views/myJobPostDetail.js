import { US_STATES } from '../config.js';

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
    const rawContent = data.raw_content ?? '';
    const meta = data.meta || {};
    const getMeta = (key) => (meta && meta[key] != null ? meta[key] : (data[key] ?? ''));
    let jobField = getMeta('field');
    let street1 = getMeta('street1');
    let street2 = getMeta('street2');
    let city = getMeta('city');
    let state = getMeta('state');
    let zip = getMeta('zip');
    let country = getMeta('country') || 'United States';
    let rateType = getMeta('rate_type');
    let rateMin = getMeta('rate_min');
    let rateMax = getMeta('rate_max');
    const addressLine = [street1, street2].filter(Boolean).join(' ');
    const cityState = [city, state].filter(Boolean).join(', ');
    const locationLine = [cityState, zip].filter(Boolean).join(' ');
    const locationFull = [addressLine, locationLine, country].filter(Boolean).join(' • ');

    const renderStateOptions = (selected) => US_STATES.map(s => {
      const isSelected = (selected || '').toUpperCase() === s.code;
      return `<option value="${s.code}" ${isSelected ? 'selected' : ''}>${s.name}</option>`;
    }).join('');

    container.innerHTML = `
      <div class="max-w-4xl mx-auto px-4">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold" id="jobTitle">${data.title}</h1>
          <div class="space-x-2">
            <button id="createJobBtn" class="text-sm text-indigo-600 hover:underline">Create New</button>
            <button id="editJobBtn" class="text-sm text-blue-600 hover:underline">Edit</button>
            <button id="deleteJobBtn" class="text-sm text-red-600 hover:underline">Delete</button>
          </div>
        </div>

        <div id="jobView">
          <div class="text-gray-700 mb-4" id="jobContent">${data.content}</div>
          <p class="text-sm text-gray-600 mb-1 ${jobField ? '' : 'hidden'}" id="jobField">Field: ${jobField || ''}</p>
          <p class="text-sm text-gray-600 mb-1 ${rateType || rateMin || rateMax ? '' : 'hidden'}" id="jobRate">Rate: ${rateMin || ''}${rateMax ? `–${rateMax}` : ''} ${rateType || ''}</p>
          <p class="text-sm text-gray-600 mb-2 ${locationFull ? '' : 'hidden'}" id="jobLocation">${locationFull || ''}</p>
          <p class="text-sm text-gray-500 mb-4">Posted on: ${new Date(data.date).toLocaleDateString()}</p>
        </div>

        <div id="jobEdit" class="hidden">
          <label class="block text-sm font-semibold mb-1">Title</label>
          <input id="editTitle" class="w-full p-2 border rounded mb-3" value="${data.title}" />

          <label class="block text-sm font-semibold mb-1">Field (e.g. Tech, Auto)</label>
          <input id="editField" class="w-full p-2 border rounded mb-3" value="${jobField || ''}" />

          <label class="block text-sm font-semibold mb-1">Description</label>
          <textarea id="editContent" class="w-full p-2 border rounded mb-3" rows="8">${rawContent}</textarea>

          <label class="block text-sm font-semibold mb-1">Rate Type</label>
          <select id="editRateType" class="w-full p-2 border rounded mb-3">
            <option value="" disabled ${rateType ? '' : 'selected'}>Select Rate Type</option>
            <option value="hourly">Hourly</option>
            <option value="salary">Salary</option>
            <option value="contract">Contract</option>
            <option value="commission">Commission</option>
          </select>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <div>
              <label class="block text-sm font-semibold mb-1">Rate Min</label>
              <input id="editRateMin" class="w-full p-2 border rounded" value="${rateMin || ''}" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Rate Max</label>
              <input id="editRateMax" class="w-full p-2 border rounded" value="${rateMax || ''}" />
            </div>
          </div>

          <h3 class="text-sm font-semibold mb-1">Location (USA Only)</h3>
          <label class="block text-sm font-semibold mb-1">Street Address (optional)</label>
          <input id="editStreet1" class="w-full p-2 border rounded mb-3" value="${street1 || ''}" />

          <label class="block text-sm font-semibold mb-1">Unit/Suite (optional)</label>
          <input id="editStreet2" class="w-full p-2 border rounded mb-3" value="${street2 || ''}" />

          <label class="block text-sm font-semibold mb-1">City</label>
          <input id="editCity" class="w-full p-2 border rounded mb-3" value="${city || ''}" />

          <label class="block text-sm font-semibold mb-1">State</label>
          <select id="editState" class="w-full p-2 border rounded mb-3">
            <option value="" disabled ${state ? '' : 'selected'}>Select State</option>
            ${renderStateOptions(state)}
          </select>

          <label class="block text-sm font-semibold mb-1">ZIP Code</label>
          <input id="editZip" class="w-full p-2 border rounded mb-3" value="${zip || ''}" />

          <label class="block text-sm font-semibold mb-1">Country</label>
          <input id="editCountry" class="w-full p-2 border rounded mb-3" value="${country || 'United States'}" />

          <div class="flex items-center space-x-3 mb-3">
            <button id="editPreviewBtn" class="text-sm text-indigo-600 hover:underline">Preview</button>
            <span class="text-xs text-gray-500">Preview shows rendered HTML</span>
          </div>
          <div id="editPreview" class="hidden border rounded p-3 mb-3 bg-gray-50"></div>

          <label class="block text-sm font-semibold mb-1">Status</label>
          <select id="editStatus" class="w-full p-2 border rounded mb-3">
            <option value="publish" selected>Publish</option>
            <option value="draft">Draft</option>
          </select>

          <div class="flex items-center space-x-3">
            <button id="saveJobBtn" class="text-purple px-4 py-2 rounded">Save</button>
            <button id="cancelEditBtn" class="text-gray-600 hover:underline">Cancel</button>
            <span id="jobEditMessage" class="text-sm"></span>
          </div>
        </div>

        <div id="createJob" class="hidden mt-6">
          <h2 class="text-xl font-semibold mb-2">Create New Job</h2>
          <label class="block text-sm font-semibold mb-1">Title</label>
          <input id="createTitle" class="w-full p-2 border rounded mb-3" placeholder="Job title" />

          <label class="block text-sm font-semibold mb-1">Field (e.g. Tech, Auto)</label>
          <input id="createField" class="w-full p-2 border rounded mb-3" placeholder="Industry or field" />

          <label class="block text-sm font-semibold mb-1">Description</label>
          <textarea id="createContent" class="w-full p-2 border rounded mb-3" rows="8" placeholder="Job description"></textarea>

          <label class="block text-sm font-semibold mb-1">Rate Type</label>
          <select id="createRateType" class="w-full p-2 border rounded mb-3">
            <option value="" disabled selected>Select Rate Type</option>
            <option value="hourly">Hourly</option>
            <option value="salary">Salary</option>
            <option value="contract">Contract</option>
            <option value="commission">Commission</option>
          </select>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <div>
              <label class="block text-sm font-semibold mb-1">Rate Min</label>
              <input id="createRateMin" class="w-full p-2 border rounded" placeholder="Min rate" />
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Rate Max</label>
              <input id="createRateMax" class="w-full p-2 border rounded" placeholder="Max rate" />
            </div>
          </div>

          <h3 class="text-sm font-semibold mb-1">Location (USA Only)</h3>
          <label class="block text-sm font-semibold mb-1">Street Address (optional)</label>
          <input id="createStreet1" class="w-full p-2 border rounded mb-3" placeholder="Street address (optional)" />

          <label class="block text-sm font-semibold mb-1">Unit/Suite (optional)</label>
          <input id="createStreet2" class="w-full p-2 border rounded mb-3" placeholder="Unit / Suite (optional)" />

          <label class="block text-sm font-semibold mb-1">City</label>
          <input id="createCity" class="w-full p-2 border rounded mb-3" placeholder="City" />

          <label class="block text-sm font-semibold mb-1">State</label>
          <select id="createState" class="w-full p-2 border rounded mb-3">
            <option value="" disabled selected>Select State</option>
            ${renderStateOptions('')}
          </select>

          <label class="block text-sm font-semibold mb-1">ZIP Code</label>
          <input id="createZip" class="w-full p-2 border rounded mb-3" placeholder="ZIP" />

          <label class="block text-sm font-semibold mb-1">Country</label>
          <input id="createCountry" class="w-full p-2 border rounded mb-3" value="United States" />

          <div class="flex items-center space-x-3 mb-3">
            <button id="createPreviewBtn" class="text-sm text-indigo-600 hover:underline">Preview</button>
            <span class="text-xs text-gray-500">Preview shows rendered HTML</span>
          </div>
          <div id="createPreview" class="hidden border rounded p-3 mb-3 bg-gray-50"></div>

          <label class="block text-sm font-semibold mb-1">Status</label>
          <select id="createStatus" class="w-full p-2 border rounded mb-3">
            <option value="publish" selected>Publish</option>
            <option value="draft">Draft</option>
          </select>

          <div class="flex items-center space-x-3">
            <button id="createSubmitBtn" class="text-purple px-4 py-2 rounded">Create</button>
            <button id="createCancelBtn" class="text-gray-600 hover:underline">Cancel</button>
            <span id="createMessage" class="text-sm"></span>
          </div>
        </div>

        <div class="flex items-center justify-between mt-6 mb-2">
          <h2 class="text-xl font-semibold">Applicants (${applicants.length})</h2>
          <button id="resetLearningBtn" class="text-xs text-indigo-600 hover:underline">Reset learning</button>
        </div>
        <div id="learningPanel" class="mb-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded p-2 hidden"></div>
        <input id="applicantSearch" class="w-full p-2 border rounded mb-3" placeholder="Filter applicants by name, location, or resume filename" />
        <div id="applicantsContainer" class="space-y-2"></div>

        <p class="mt-4">
          <a href="/#my-job-posts" class="text-blue-600 hover:underline">← Back to My Jobs</a>
        </p>

        <div id="deleteModal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg border border-gray-200">
            <h3 class="text-lg font-semibold mb-2">Delete Job</h3>
            <p class="text-sm text-gray-700 mb-4">Delete this job post? This cannot be undone.</p>
            <div class="flex items-center justify-end space-x-3">
              <button id="deleteCancelBtn" class="px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button id="deleteConfirmBtn" class="px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const jobView = container.querySelector('#jobView');
    const jobEdit = container.querySelector('#jobEdit');
    const createSection = container.querySelector('#createJob');
    const editBtn = container.querySelector('#editJobBtn');
    const createBtn = container.querySelector('#createJobBtn');
    const deleteBtn = container.querySelector('#deleteJobBtn');
    const saveBtn = container.querySelector('#saveJobBtn');
    const cancelBtn = container.querySelector('#cancelEditBtn');
    const titleInput = container.querySelector('#editTitle');
    const fieldInput = container.querySelector('#editField');
    const contentInput = container.querySelector('#editContent');
    const editRateType = container.querySelector('#editRateType');
    const editRateMin = container.querySelector('#editRateMin');
    const editRateMax = container.querySelector('#editRateMax');
    const editStreet1 = container.querySelector('#editStreet1');
    const editStreet2 = container.querySelector('#editStreet2');
    const editCity = container.querySelector('#editCity');
    const editState = container.querySelector('#editState');
    const editZip = container.querySelector('#editZip');
    const editCountry = container.querySelector('#editCountry');
    const statusInput = container.querySelector('#editStatus');
    const editPreviewBtn = container.querySelector('#editPreviewBtn');
    const editPreview = container.querySelector('#editPreview');
    const editMessage = container.querySelector('#jobEditMessage');
    const createTitle = container.querySelector('#createTitle');
    const createField = container.querySelector('#createField');
    const createContent = container.querySelector('#createContent');
    const createRateType = container.querySelector('#createRateType');
    const createRateMin = container.querySelector('#createRateMin');
    const createRateMax = container.querySelector('#createRateMax');
    const createStreet1 = container.querySelector('#createStreet1');
    const createStreet2 = container.querySelector('#createStreet2');
    const createCity = container.querySelector('#createCity');
    const createState = container.querySelector('#createState');
    const createZip = container.querySelector('#createZip');
    const createCountry = container.querySelector('#createCountry');
    const createStatus = container.querySelector('#createStatus');
    const createPreviewBtn = container.querySelector('#createPreviewBtn');
    const createPreview = container.querySelector('#createPreview');
    const createSubmitBtn = container.querySelector('#createSubmitBtn');
    const createCancelBtn = container.querySelector('#createCancelBtn');
    const createMessage = container.querySelector('#createMessage');
    const deleteModal = container.querySelector('#deleteModal');
    const deleteCancelBtn = container.querySelector('#deleteCancelBtn');
    const deleteConfirmBtn = container.querySelector('#deleteConfirmBtn');
    const applicantSearch = container.querySelector('#applicantSearch');
    const applicantsContainer = container.querySelector('#applicantsContainer');
    const resetLearningBtn = container.querySelector('#resetLearningBtn');
    const learningPanel = container.querySelector('#learningPanel');

    const setupZipLookup = (zipInput, cityInput, stateSelect) => {
      if (!zipInput || !cityInput || !stateSelect) return;
      const lookup = async () => {
        const zipVal = (zipInput.value || '').trim();
        if (!/^\d{5}$/.test(zipVal)) return;
        try {
          const res = await fetch(`https://api.zippopotam.us/us/${zipVal}`);
          if (!res.ok) return;
          const data = await res.json();
          const place = data.places && data.places[0];
          if (!place) return;
          if (!cityInput.value) cityInput.value = place['place name'] || '';
          const stateCode = place['state abbreviation'];
          if (stateCode) {
            stateSelect.value = stateCode;
          }
        } catch (err) {
          // silent fail
        }
      };
      zipInput.addEventListener('blur', lookup);
      zipInput.addEventListener('change', lookup);
    };

    setupZipLookup(editZip, editCity, editState);
    setupZipLookup(createZip, createCity, createState);

    const renderApplicants = (list) => {
      applicantsContainer.innerHTML = list.length
        ? list.map(app => `
            <div class="border rounded p-2 flex justify-between items-center">
              <div>
                <div>${app.name}</div>
                <div class="text-xs text-gray-600">
                  ${app.hide_email ? 'Email hidden — use resume link only' : (app.email || 'Email not available')}
                </div>
                <div class="text-xs text-gray-600">
                  Match score: ${typeof app.match_score === 'number' ? app.match_score : 0}%
                  ${app.pref_score ? `<span class="ml-1 text-emerald-700">(learned +${app.pref_score}%)</span>` : ''}
                </div>
              </div>
              <a href="${app.link}" data-action="view-application" data-user-id="${app.id}" class="text-blue-600 hover:underline text-sm">View Application</a>
            </div>
          `).join('')
        : `<p class="text-gray-500">No applicants found.</p>`;
    };

    renderApplicants(applicants);

    const computeTopKeywords = (list) => {
      const counts = {};
      list.forEach(app => {
        if (!app.resume_text) return;
        const tokens = app.resume_text
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(t => t.length > 2);
        tokens.forEach(t => {
          counts[t] = (counts[t] || 0) + 1;
        });
      });
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([t]) => t);
      return top;
    };

    const topKeywords = computeTopKeywords(applicants);
    if (learningPanel) {
      if (topKeywords.length) {
        learningPanel.classList.remove('hidden');
        learningPanel.textContent = `Top learned keywords (so far): ${topKeywords.join(', ')}`;
      } else {
        learningPanel.classList.add('hidden');
      }
    }
    applicantsContainer.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-action="view-application"]');
      if (!link) return;
      const userId = Number(link.dataset.userId || 0);
      if (!userId) return;
      fetch('/wp-json/customapi/v1/employer-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ job_id: Number(jobId), user_id: userId }),
        keepalive: true,
      }).catch(() => {});
    });

    resetLearningBtn?.addEventListener('click', async () => {
      if (!confirm('Reset learned preferences?')) return;
      try {
        const res = await fetch('/wp-json/customapi/v1/employer-reset-learning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ job_id: Number(jobId) }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || 'Reset failed');
          return;
        }
        alert('Learning reset.');
      } catch (err) {
        alert('Reset failed.');
      }
    });
    applicantSearch?.addEventListener('input', () => {
      const q = (applicantSearch.value || '').toLowerCase();
      if (!q) {
        renderApplicants(applicants);
        return;
      }
      const filtered = applicants.filter(app => {
        const name = (app.name || '').toLowerCase();
        const resume = (app.resume || '').toLowerCase();
        const cover = (app.cover || '').toLowerCase();
        const city = (app.city || '').toLowerCase();
        const state = (app.state || '').toLowerCase();
        const zip = (app.zip || '').toLowerCase();
        const resumeText = (app.resume_text || '').toLowerCase();
        return name.includes(q) || resume.includes(q) || cover.includes(q) || city.includes(q) || state.includes(q) || zip.includes(q) || resumeText.includes(q);
      });
      renderApplicants(filtered);
    });

    const isValidUsaLocation = ({ city, state, zip, country }, messageEl) => {
      const usaValues = ['usa', 'us', 'united states', 'united states of america'];
      if (!usaValues.includes((country || '').trim().toLowerCase())) {
        if (messageEl) messageEl.textContent = 'USA only: please enter United States.';
        return false;
      }
      if (!city) {
        if (messageEl) messageEl.textContent = 'City is required.';
        return false;
      }
      if (!state || !US_STATES.some(s => s.code === state)) {
        if (messageEl) messageEl.textContent = 'Please select a valid state.';
        return false;
      }
      if (!zip || !/^\d{5}(-\d{4})?$/.test(zip)) {
        if (messageEl) messageEl.textContent = 'ZIP must be 5 digits (or 5+4).';
        return false;
      }
      return true;
    };

    editBtn.addEventListener('click', () => {
      jobView.classList.add('hidden');
      jobEdit.classList.remove('hidden');
      createSection.classList.add('hidden');
      editPreview.classList.add('hidden');
      editPreviewBtn.textContent = 'Preview';
      editMessage.textContent = '';
    });

    createBtn.addEventListener('click', () => {
      jobView.classList.add('hidden');
      jobEdit.classList.add('hidden');
      createSection.classList.remove('hidden');
      createPreview.classList.add('hidden');
      createPreviewBtn.textContent = 'Preview';
      createMessage.textContent = '';
    });

    cancelBtn.addEventListener('click', () => {
      jobEdit.classList.add('hidden');
      jobView.classList.remove('hidden');
      titleInput.value = data.title || '';
      fieldInput.value = jobField || '';
      contentInput.value = rawContent || '';
      if (editRateType && rateType) editRateType.value = rateType;
      if (editRateMin) editRateMin.value = rateMin || '';
      if (editRateMax) editRateMax.value = rateMax || '';
      editStreet1.value = street1 || '';
      editStreet2.value = street2 || '';
      editCity.value = city || '';
      editState.value = state || '';
      editZip.value = zip || '';
      editCountry.value = country || 'United States';
      statusInput.value = 'publish';
      editPreview.classList.add('hidden');
      editPreviewBtn.textContent = 'Preview';
      editMessage.textContent = '';
    });

    createCancelBtn.addEventListener('click', () => {
      createSection.classList.add('hidden');
      jobView.classList.remove('hidden');
      createTitle.value = '';
      createField.value = '';
      createContent.value = '';
      if (createRateType) createRateType.value = '';
      if (createRateMin) createRateMin.value = '';
      if (createRateMax) createRateMax.value = '';
      createStreet1.value = '';
      createStreet2.value = '';
      createCity.value = '';
      createState.value = '';
      createZip.value = '';
      createCountry.value = 'United States';
      createStatus.value = 'publish';
      createPreview.classList.add('hidden');
      createPreviewBtn.textContent = 'Preview';
      createMessage.textContent = '';
    });

    saveBtn.addEventListener('click', async () => {
      editMessage.className = 'text-sm text-gray-600';
      editMessage.textContent = 'Saving...';

      const editFieldValue = fieldInput.value.trim();
      if (!editFieldValue) {
        editMessage.className = 'text-sm text-red-600';
        editMessage.textContent = 'Field is required.';
        return;
      }

      const rateMinVal = (editRateMin?.value || '').toString().replace(/[^0-9.]/g, '');
      const rateMaxVal = (editRateMax?.value || '').toString().replace(/[^0-9.]/g, '');
      if (!editRateType?.value || !rateMinVal || !rateMaxVal || isNaN(rateMinVal) || isNaN(rateMaxVal)) {
        editMessage.className = 'text-sm text-red-600';
        editMessage.textContent = 'Please enter a valid rate type and range.';
        return;
      }
      if (Number(rateMinVal) > Number(rateMaxVal)) {
        editMessage.className = 'text-sm text-red-600';
        editMessage.textContent = 'Rate min must be less than or equal to rate max.';
        return;
      }

      const editLocation = {
        city: editCity.value.trim(),
        state: editState.value.trim(),
        zip: editZip.value.trim(),
        country: editCountry.value.trim(),
      };
      if (!isValidUsaLocation(editLocation, editMessage)) {
        editMessage.className = 'text-sm text-red-600';
        return;
      }

      const payload = {
        id: jobId,
        title: titleInput.value.trim(),
        content: contentInput.value.trim(),
        status: statusInput.value,
        field: editFieldValue,
        rate_type: editRateType.value.trim(),
        rate_min: rateMinVal,
        rate_max: rateMaxVal,
        street1: editStreet1.value.trim(),
        street2: editStreet2.value.trim(),
        ...editLocation,
      };

      try {
        const res = await fetch('/wp-json/customapi/v1/user-job-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Update failed');

        editMessage.className = 'text-sm text-green-700';
        editMessage.textContent = 'Saved.';

        const titleEl = container.querySelector('#jobTitle');
        const contentEl = container.querySelector('#jobContent');
        const fieldEl = container.querySelector('#jobField');
        const locationEl = container.querySelector('#jobLocation');
        titleEl.textContent = payload.title || titleEl.textContent;
        contentEl.innerHTML = payload.content || contentEl.innerHTML;
        if (fieldEl) {
          if (payload.field) {
            fieldEl.textContent = `Field: ${payload.field}`;
            fieldEl.classList.remove('hidden');
          } else {
            fieldEl.classList.add('hidden');
          }
        }
        if (locationEl) {
          const updatedAddress = [payload.street1, payload.street2].filter(Boolean).join(' ');
          const updatedCityState = [payload.city, payload.state].filter(Boolean).join(', ');
          const updatedLocationLine = [updatedCityState, payload.zip].filter(Boolean).join(' ');
          const updatedFull = [updatedAddress, updatedLocationLine, payload.country].filter(Boolean).join(' • ');
          if (updatedFull) {
            locationEl.textContent = updatedFull;
            locationEl.classList.remove('hidden');
          } else {
            locationEl.classList.add('hidden');
          }
        }
        const rateEl = container.querySelector('#jobRate');
        if (rateEl) {
          rateEl.textContent = `Rate: ${payload.rate_min}–${payload.rate_max} ${payload.rate_type}`;
          rateEl.classList.toggle('hidden', !(payload.rate_type || payload.rate_min || payload.rate_max));
        }

        data.title = payload.title;
        data.content = payload.content;
        jobField = payload.field;
        rateType = payload.rate_type;
        rateMin = payload.rate_min;
        rateMax = payload.rate_max;
        street1 = payload.street1;
        street2 = payload.street2;
        city = payload.city;
        state = payload.state;
        zip = payload.zip;
        country = payload.country;

        setTimeout(() => {
          jobEdit.classList.add('hidden');
          jobView.classList.remove('hidden');
        }, 300);
      } catch (err) {
        editMessage.className = 'text-sm text-red-600';
        editMessage.textContent = err.message;
      }
    });

    createSubmitBtn.addEventListener('click', async () => {
      createMessage.className = 'text-sm text-gray-600';
      createMessage.textContent = 'Creating...';

      const createFieldValue = createField.value.trim();
      if (!createFieldValue) {
        createMessage.className = 'text-sm text-red-600';
        createMessage.textContent = 'Field is required.';
        return;
      }

      const createRateMinVal = (createRateMin?.value || '').toString().replace(/[^0-9.]/g, '');
      const createRateMaxVal = (createRateMax?.value || '').toString().replace(/[^0-9.]/g, '');
      if (!createRateType?.value || !createRateMinVal || !createRateMaxVal || isNaN(createRateMinVal) || isNaN(createRateMaxVal)) {
        createMessage.className = 'text-sm text-red-600';
        createMessage.textContent = 'Please enter a valid rate type and range.';
        return;
      }
      if (Number(createRateMinVal) > Number(createRateMaxVal)) {
        createMessage.className = 'text-sm text-red-600';
        createMessage.textContent = 'Rate min must be less than or equal to rate max.';
        return;
      }

      const createLocation = {
        city: createCity.value.trim(),
        state: createState.value.trim(),
        zip: createZip.value.trim(),
        country: createCountry.value.trim(),
      };
      if (!isValidUsaLocation(createLocation, createMessage)) {
        createMessage.className = 'text-sm text-red-600';
        return;
      }

      const payload = {
        title: createTitle.value.trim(),
        description: createContent.value.trim(),
        status: createStatus.value,
        field: createFieldValue,
        rate_type: createRateType.value.trim(),
        rate_min: createRateMinVal,
        rate_max: createRateMaxVal,
        street1: createStreet1.value.trim(),
        street2: createStreet2.value.trim(),
        ...createLocation,
      };

      try {
        const res = await fetch('/wp-json/customapi/v1/create-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Create failed');

        createMessage.className = 'text-sm text-green-700';
        createMessage.textContent = 'Created.';
        if (result.post_id) {
          window.location.hash = `#my-job-post-detail?id=${result.post_id}`;
        } else {
          window.location.hash = '#my-job-posts';
        }
      } catch (err) {
        createMessage.className = 'text-sm text-red-600';
        createMessage.textContent = err.message;
      }
    });

    editPreviewBtn.addEventListener('click', () => {
      const isHidden = editPreview.classList.contains('hidden');
      if (isHidden) {
        editPreview.innerHTML = contentInput.value;
        editPreview.classList.remove('hidden');
        editPreviewBtn.textContent = 'Hide Preview';
      } else {
        editPreview.classList.add('hidden');
        editPreviewBtn.textContent = 'Preview';
      }
    });

    createPreviewBtn.addEventListener('click', () => {
      const isHidden = createPreview.classList.contains('hidden');
      if (isHidden) {
        createPreview.innerHTML = createContent.value;
        createPreview.classList.remove('hidden');
        createPreviewBtn.textContent = 'Hide Preview';
      } else {
        createPreview.classList.add('hidden');
        createPreviewBtn.textContent = 'Preview';
      }
    });

    deleteBtn.addEventListener('click', () => {
      deleteModal.classList.remove('hidden');
    });

    deleteCancelBtn.addEventListener('click', () => {
      deleteModal.classList.add('hidden');
    });

    deleteConfirmBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/wp-json/customapi/v1/user-job-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: jobId }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Delete failed');
        window.location.hash = '#my-job-posts';
      } catch (err) {
        alert(`Delete failed: ${err.message}`);
      } finally {
        deleteModal.classList.add('hidden');
      }
    });
  } catch (err) {
    container.innerHTML = `<p class="text-red-600">❌ Error: ${err.message}</p>`;
    console.error(err);
  }
}
