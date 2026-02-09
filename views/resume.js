export async function renderResume(container) {
    try {
      // Fetch user profile
      const profileRes = await fetch("/api/user-profile?_=" + Date.now(), {
        credentials: "include"
      });
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.message || "Failed to fetch profile");
  
      container.innerHTML = `
        <h1 class="text-2xl font-bold mb-4">Manage Your Documents</h1>
    <p class="text-sm text-slate-600 mb-4">Accepted formats: PDF, DOC, DOCX. (Word files should be saved in proper .doc or .docx format.)</p>
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">Resumes</h2>
          <ul id="resumeList" class="space-y-2">
            ${profileData.resumes?.map(r => {
              const previewUrl = r.url ? r.url.replace('/api/user-file', '/api/user-file-preview') : '';
              const textUrl = r.url ? r.url.replace('/api/user-file', '/api/user-file-text') : '';
              const isPdf = (r.mime || '').toLowerCase().includes('pdf') || (r.name || '').toLowerCase().endsWith('.pdf');
              const isDoc = (r.name || '').toLowerCase().endsWith('.doc') || (r.name || '').toLowerCase().endsWith('.docx');
              return `
              <li class="flex items-center justify-between border rounded px-3 py-2">
                <div class="flex items-center gap-3">
                  <a href="${r.url}" target="_blank" class="text-blue-600 hover:underline">${r.name}</a>
                  ${isPdf && previewUrl
                    ? `<button data-preview-url="${previewUrl}" data-preview-type="pdf" class="previewDoc text-xs text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full hover:border-indigo-400 transition">Preview</button>`
                    : isDoc && textUrl
                      ? `<button data-preview-url="${textUrl}" data-preview-type="text" data-preview-kind="resume" data-preview-name="${r.name}" class="previewDoc text-xs text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full hover:border-indigo-400 transition">Text preview</button>`
                      : `<span class="text-xs text-slate-500">Preview not available</span>`}
                </div>
                <button data-id="${r.id}" data-time="${r.time}" class="deleteResume text-red-600 hover:underline text-sm px-2 py-1">Delete</button>
              </li>
            `;
            }).join("") || `<p class="text-gray-500">No resumes uploaded yet.</p>`}
          </ul>
          <form id="resumeUpload" class="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="flex items-center gap-2 flex-wrap">
              <input type="file" name="resume" accept=".pdf,.doc,.docx" required class="w-full sm:w-auto h-10 p-2 border rounded" />
              <span class="text-xs text-slate-600">PDF preferred</span>
              <details class="text-xs text-slate-500">
                <summary class="cursor-pointer">?</summary>
                <div class="mt-1 bg-white border rounded p-2 shadow-sm">
                  Export as PDF: In Word/Google Docs, go to File → Download/Save As → PDF.
                </div>
              </details>
            </div>
            <button type="submit" class="text-purple px-3 py-1 h-10 rounded hover:border-indigo-500 transition">
              Upload Resume
            </button>
          </form>
        </section>
  
        <section>
          <h2 class="text-xl font-semibold mb-2">Cover Letters</h2>
          <ul id="coverList" class="space-y-2">
            ${profileData.cover_letters?.map(c => {
              const previewUrl = c.url ? c.url.replace('/api/user-file', '/api/user-file-preview') : '';
              const textUrl = c.url ? c.url.replace('/api/user-file', '/api/user-file-text') : '';
              const isPdf = (c.mime || '').toLowerCase().includes('pdf') || (c.name || '').toLowerCase().endsWith('.pdf');
              const isDoc = (c.name || '').toLowerCase().endsWith('.doc') || (c.name || '').toLowerCase().endsWith('.docx');
              return `
              <li class="flex items-center justify-between border rounded px-3 py-2">
                <div class="flex items-center gap-3">
                  <a href="${c.url}" target="_blank" class="text-blue-600 hover:underline">${c.name}</a>
                  ${isPdf && previewUrl
                    ? `<button data-preview-url="${previewUrl}" data-preview-type="pdf" class="previewDoc text-xs text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full hover:border-indigo-400 transition">Preview</button>`
                    : isDoc && textUrl
                      ? `<button data-preview-url="${textUrl}" data-preview-type="text" data-preview-kind="cover" data-preview-name="${c.name}" class="previewDoc text-xs text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full hover:border-indigo-400 transition">Text preview</button>`
                      : `<span class="text-xs text-slate-500">Preview not available</span>`}
                </div>
                <button data-id="${c.id}" data-time="${c.time}" class="deleteCover text-red-600 hover:underline text-sm px-2 py-1">Delete</button>
              </li>
            `;
            }).join("") || `<p class="text-gray-500">No cover letters uploaded yet.</p>`}
          </ul>
          <form id="coverUpload" class="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="flex items-center gap-2 flex-wrap">
              <input type="file" name="cover_letter" accept=".pdf,.doc,.docx" required class="w-full sm:w-auto h-10 p-2 border rounded" />
              <span class="text-xs text-slate-600">PDF preferred</span>
              <details class="text-xs text-slate-500">
                <summary class="cursor-pointer">?</summary>
                <div class="mt-1 bg-white border rounded p-2 shadow-sm">
                  Export as PDF: In Word/Google Docs, go to File → Download/Save As → PDF.
                </div>
              </details>
            </div>
            <button type="submit" class="text-purple px-3 py-1 h-10 rounded hover:border-indigo-500 transition">
              Upload Cover Letter
            </button>
          </form>
        </section>
        <div id="docPreviewModal" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-50 p-4">
          <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full h-[80vh] flex flex-col">
            <div class="flex items-center justify-between px-4 py-2 border-b">
              <div class="text-sm font-semibold text-slate-700">Document preview</div>
              <button id="closeDocPreview" class="btn-close text-slate-600 hover:text-slate-900 text-xl leading-none" aria-label="Close">×</button>
            </div>
            <iframe id="docPreviewFrame" class="flex-1 w-full hidden" src="" title="Document preview"></iframe>
            <div id="docTextWrap" class="flex-1 hidden flex-col">
              <textarea id="docTextArea" class="flex-1 w-full p-3 text-sm font-mono border-0 outline-none" spellcheck="false"></textarea>
              <div class="px-4 py-2 border-t flex items-center justify-between">
                <div class="text-xs text-slate-500">Text preview (you can edit before saving)</div>
                <button id="saveTextDoc" class="text-xs px-3 py-1.5 rounded-full border border-indigo-300 text-indigo-700 hover:border-indigo-500 transition">Save as text file</button>
              </div>
            </div>
          </div>
        </div>
      `;
  
      const modal = container.querySelector('#docPreviewModal');
      const previewFrame = container.querySelector('#docPreviewFrame');
      const textWrap = container.querySelector('#docTextWrap');
      const textArea = container.querySelector('#docTextArea');
      const saveTextBtn = container.querySelector('#saveTextDoc');
      const closePreview = container.querySelector('#closeDocPreview');
      let currentTextKind = 'resume';
      let currentTextName = 'resume_text.txt';
      const openPreview = (url) => {
        if (!modal || !previewFrame) return;
        previewFrame.classList.remove('hidden');
        textWrap?.classList.add('hidden');
        previewFrame.src = url;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      };
      const openTextPreview = async (url, kind, name) => {
        if (!modal || !textWrap || !textArea) return;
        previewFrame?.classList.add('hidden');
        textWrap.classList.remove('hidden');
        currentTextKind = kind || 'resume';
        currentTextName = (name || '').replace(/\.(docx|doc)$/i, '.txt');
        textArea.value = 'Loading...';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        try {
          const res = await fetch(url, { credentials: 'include' });
          const data = await res.json();
          textArea.value = data.text || '';
        } catch (err) {
          textArea.value = 'Unable to extract text.';
        }
      };
      const closePreviewModal = () => {
        if (!modal || !previewFrame) return;
        previewFrame.src = '';
        if (textArea) textArea.value = '';
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      };
      closePreview?.addEventListener('click', closePreviewModal);
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) closePreviewModal();
      });
      container.querySelectorAll('.previewDoc').forEach(btn => {
        btn.addEventListener('click', () => {
          const url = btn.getAttribute('data-preview-url');
          const type = btn.getAttribute('data-preview-type');
          const kind = btn.getAttribute('data-preview-kind') || 'resume';
          const name = btn.getAttribute('data-preview-name') || '';
          if (!url) return;
          if (type === 'text') {
            openTextPreview(url, kind, name);
          } else {
            openPreview(url);
          }
        });
      });
      saveTextBtn?.addEventListener('click', async () => {
        if (!textArea) return;
        const payload = {
          kind: currentTextKind,
          name: currentTextName || (currentTextKind === 'cover' ? 'cover_text.txt' : 'resume_text.txt'),
          text: textArea.value || '',
        };
        try {
          const res = await fetch('/api/user-files-upload-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Save failed');
          location.reload();
        } catch (err) {
          if (textArea) textArea.value = (textArea.value || '') + '\n\n[Save failed]';
        }
      });

      // --- Resume Upload ---
      const resumeInput = document.querySelector('input[name="resume"]');
      const resumeForm = document.getElementById("resumeUpload");
      const uploadFile = async (file, kind) => {
        const formData = new FormData();
        formData.append("file", file);
  
        try {
          const res = await fetch(`/api/user-files-upload?kind=${kind}`, {
            method: "POST",
            body: formData,
            credentials: "include"
          });
          if (!res.ok) throw new Error(`Failed to upload ${kind}`);
          location.reload(); // refresh list
        } catch (err) {
          const listId = kind === 'resume' ? '#resumeList' : '#coverList';
          container.querySelector(listId)?.insertAdjacentHTML('beforebegin', `<p class="text-red-600 text-sm">❌ ${err.message}</p>`);
        }
      };
      const validateFile = (file) => {
        if (!file) return 'Missing file';
        const maxBytes = 8 * 1024 * 1024;
        if (file.size > maxBytes) return 'File too large (max 8MB).';
        const ok = /\.(pdf|doc|docx)$/i.test(file.name || '');
        if (!ok) return 'Invalid file type. Use PDF, DOC, or DOCX.';
        return '';
      };
      resumeInput?.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        const err = validateFile(file);
        if (err) {
          container.querySelector('#resumeList')?.insertAdjacentHTML('beforebegin', `<p class="text-red-600 text-sm">❌ ${err}</p>`);
          return;
        }
        await uploadFile(file, 'resume');
      });
      resumeForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const file = resumeInput && resumeInput.files && resumeInput.files[0];
        const err = validateFile(file);
        if (err) {
          container.querySelector('#resumeList')?.insertAdjacentHTML('beforebegin', `<p class="text-red-600 text-sm">❌ ${err}</p>`);
          return;
        }
        uploadFile(file, 'resume');
      });
  
      // --- Cover Upload ---
      const coverInput = document.querySelector('input[name="cover_letter"]');
      const coverForm = document.getElementById("coverUpload");
      coverInput?.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        const err = validateFile(file);
        if (err) {
          container.querySelector('#coverList')?.insertAdjacentHTML('beforebegin', `<p class="text-red-600 text-sm">❌ ${err}</p>`);
          return;
        }
        await uploadFile(file, 'cover');
      });
      coverForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const file = coverInput && coverInput.files && coverInput.files[0];
        const err = validateFile(file);
        if (err) {
          container.querySelector('#coverList')?.insertAdjacentHTML('beforebegin', `<p class="text-red-600 text-sm">❌ ${err}</p>`);
          return;
        }
        uploadFile(file, 'cover');
      });
  
      // --- Resume Delete ---
      container.querySelectorAll(".deleteResume")?.forEach(btn =>
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this resume?")) return;
          try {
            const res = await fetch("/api/user-files-delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ id: Number(btn.dataset.id || 0) || Number(btn.dataset.time || 0) })
            });
            if (!res.ok) throw new Error("Failed to delete resume");
            location.reload();
          } catch (err) {
            container.querySelector('#resumeList')?.insertAdjacentHTML('beforebegin', `<p class="text-red-600 text-sm">❌ ${err.message}</p>`);
          }
        })
      );
  
      // --- Cover Delete ---
      container.querySelectorAll(".deleteCover")?.forEach(btn =>
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this cover letter?")) return;
          try {
            const res = await fetch("/api/user-files-delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ id: Number(btn.dataset.id || 0) || Number(btn.dataset.time || 0) })
            });
            if (!res.ok) throw new Error("Failed to delete cover letter");
            location.reload();
          } catch (err) {
            container.querySelector('#coverList')?.insertAdjacentHTML('beforebegin', `<p class="text-red-600 text-sm">❌ ${err.message}</p>`);
          }
        })
      );
  
    } catch (err) {
      container.innerHTML = `<p class="text-red-600">❌ Error: ${err.message}</p>`;
    }
  }
  
