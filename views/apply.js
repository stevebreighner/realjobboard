import { escapeHtml } from '../utils/sanitize.js';
import { CONFIG } from '../config.js';
import { attachFieldHints, markInvalidField } from '../utils/formHints.js';

export async function renderApply(container, jobId) {
    try {
      // --- Fetch job detail (for job title) ---
      const jobRes = await fetch(`/api/job?id=${jobId}`);
      const jobData = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobData.message || "Failed to fetch job details");
      const jobLabel = CONFIG.JOB_COPY?.SINGULAR || 'Job';
      const jobTitle = escapeHtml(jobData.title || `${jobLabel} #${jobId}`);
      const complianceEnabled = jobData?.meta?.compliance_enabled === '1';
      const complianceBlocks = (jobData?.meta?.compliance_blocks || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
  
      // --- Check application status ---
      const statusRes = await fetch(`/api/check-application?jobId=${jobId}`, {
        credentials: "include"
      });
      if (statusRes.status === 401 || statusRes.status === 403) {
        window.location.hash = "#login";
        return;
      }
      const statusData = await statusRes.json();
  
      if (statusData.already_applied) {
        container.innerHTML = `
          <h1 class="text-2xl font-bold mb-4">${CONFIG.JOB_COPY?.APPLY_FOR_PREFIX || 'Apply for:'} ${jobTitle}</h1>
          <p class="text-red-600 mb-4">⚠️ ${CONFIG.JOB_COPY?.ALREADY_APPLIED || 'You have already applied to this job.'}</p>
          <p><a href="/#resume" class="text-blue-600 hover:underline">${CONFIG.JOB_COPY?.MANAGE_RESUMES_LABEL || 'Manage resumes/cover letters'}</a></p>
          <p><a href="/#list-detail?id=${jobId}" class="text-blue-600 hover:underline">${CONFIG.JOB_COPY?.BACK_TO_DETAIL || '← Back to Job Detail'}</a></p>
        `;
        return;
      }
  
      if (statusData.limit_reached) {
        container.innerHTML = `
          <h1 class="text-2xl font-bold mb-4">${CONFIG.JOB_COPY?.APPLY_FOR_PREFIX || 'Apply for:'} ${jobTitle}</h1>
          <p class="text-red-600 mb-4">🚫 ${CONFIG.JOB_COPY?.MAX_APPS_REACHED || 'This job has reached the maximum of 25 applications.'}</p>
          <p><a href="/#list-detail?id=${jobId}" class="text-blue-600 hover:underline">${CONFIG.JOB_COPY?.BACK_TO_DETAIL || '← Back to Job Detail'}</a></p>
        `;
        return;
      }
  
      // --- Fetch user profile (for resumes and covers) ---
      const profileRes = await fetch("/api/user-profile?_=" + Date.now(), {
        credentials: "include"
      });
      if (profileRes.status === 401 || profileRes.status === 403) {
        window.location.hash = "#login";
        return;
      }
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.message || "Failed to fetch profile");
  
      const resumes = Array.isArray(profileData.resumes) ? profileData.resumes : [];
      const covers = Array.isArray(profileData.cover_letters) ? profileData.cover_letters : [];
      const compliancePrefill = {
        gender: profileData.compliance_gender || '',
        race: profileData.compliance_race || '',
        disability: profileData.compliance_disability || '',
        veteran: profileData.compliance_veteran || '',
        work_auth: profileData.compliance_work_auth || '',
        prior_employment: profileData.compliance_prior_employment || '',
        background_check: profileData.compliance_background_check || '',
        age_minimum: profileData.compliance_age_minimum || '',
      };
  
      // --- Render form ---
      container.innerHTML = `
        <h1 class="text-2xl font-bold mb-4">${CONFIG.JOB_COPY?.APPLY_FOR_PREFIX || 'Apply for:'} ${jobTitle}</h1>
        <div id="applyMessage" class="mb-4 text-sm"></div>
        <div class="mb-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
          ${CONFIG.JOB_COPY?.PRIVACY_NOTE_APPLY || 'Privacy note: Employers may contact you using the details you provide. If you choose to hide your email, they will only see your resume link.'}
          <a class="text-blue-600 hover:underline ml-2" href="/#support?subject=Report%20Abuse&context=apply:${jobId}">Report abuse</a>
        </div>
        <form id="applyForm" class="space-y-6">
          <div>
                  <p class="mt-4">
          <a href="/#resume" class="text-blue-600 hover:underline">${CONFIG.JOB_COPY?.MANAGE_RESUMES_LABEL || 'Manage resumes/cover letters'}</a>
        </p>
           <h2>Resume</h2>
            ${
              resumes.length
                ? resumes.map((resume, i) => `
                    <div class="flex items-center space-x-2">
                      <input type="checkbox" name="resume" value="${resume.url}" id="resume-${i}" ${i === 0 ? "checked" : ""} />
                      <label for="resume-${i}" class="text-sm">
                        ${resume.name} (${new Date(resume.time * 1000).toLocaleDateString()})
                      </label>
                    </div>
                  `).join("")
                : `
                  <p class="text-gray-500 text-sm mb-2">No resumes uploaded.</p>
                  <label class="text-sm block mb-1" for="resume-link">Resume link</label>
                  <input id="resume-link" name="resume_link" type="url" class="w-full p-2 border rounded" placeholder="https://..." />
                `
            }
          </div>
  
          <div>
            <h2>Cover Letter</h2>
            ${
              covers.length
                ? covers.map((cover, i) => `
                    <div class="flex items-center space-x-2">
                      <input type="checkbox" name="cover_letter" value="${cover.url}" id="cover-${i}" ${i === 0 ? "checked" : ""} />
                      <label for="cover-${i}" class="text-sm">
                        ${cover.name} (${new Date(cover.time * 1000).toLocaleDateString()})
                      </label>
                    </div>
                  `).join("")
                : `
                  <p class="text-gray-500 text-sm mb-2">No cover letters uploaded.</p>
                `
            }
          </div>
          ${complianceEnabled ? `
          <div class="border rounded p-4 bg-white">
            <h2 class="text-lg font-semibold mb-2">Optional compliance questions</h2>
            <p class="text-xs text-gray-500 mb-3">You may skip these unless the employer requires them. “Prefer not to say” is always acceptable.</p>
            ${complianceBlocks.includes('eeo') ? `
              <div class="mb-3">
                <label class="block text-sm font-semibold">Gender (optional)</label>
                <select name="compliance_gender" class="w-full p-2 border rounded">
                  <option value="" ${!compliancePrefill.gender ? 'selected' : ''}>Prefer not to say</option>
                  <option value="female" ${compliancePrefill.gender === 'female' ? 'selected' : ''}>Female</option>
                  <option value="male" ${compliancePrefill.gender === 'male' ? 'selected' : ''}>Male</option>
                  <option value="nonbinary" ${compliancePrefill.gender === 'nonbinary' ? 'selected' : ''}>Non-binary</option>
                  <option value="other" ${compliancePrefill.gender === 'other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="block text-sm font-semibold">Race/Ethnicity (optional)</label>
                <select name="compliance_race" class="w-full p-2 border rounded">
                  <option value="" ${!compliancePrefill.race ? 'selected' : ''}>Prefer not to say</option>
                  <option value="asian" ${compliancePrefill.race === 'asian' ? 'selected' : ''}>Asian</option>
                  <option value="black" ${compliancePrefill.race === 'black' ? 'selected' : ''}>Black or African American</option>
                  <option value="hispanic" ${compliancePrefill.race === 'hispanic' ? 'selected' : ''}>Hispanic or Latino</option>
                  <option value="white" ${compliancePrefill.race === 'white' ? 'selected' : ''}>White</option>
                  <option value="native" ${compliancePrefill.race === 'native' ? 'selected' : ''}>Native American or Alaska Native</option>
                  <option value="pacific" ${compliancePrefill.race === 'pacific' ? 'selected' : ''}>Native Hawaiian or Pacific Islander</option>
                  <option value="other" ${compliancePrefill.race === 'other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
            ` : ''}
            ${complianceBlocks.includes('disability') ? `
              <div class="mb-3">
                <label class="block text-sm font-semibold">Disability status (optional)</label>
                <select name="compliance_disability" class="w-full p-2 border rounded">
                  <option value="" ${!compliancePrefill.disability ? 'selected' : ''}>Prefer not to say</option>
                  <option value="yes" ${compliancePrefill.disability === 'yes' ? 'selected' : ''}>Yes</option>
                  <option value="no" ${compliancePrefill.disability === 'no' ? 'selected' : ''}>No</option>
                </select>
              </div>
            ` : ''}
            ${complianceBlocks.includes('veteran') ? `
              <div class="mb-3">
                <label class="block text-sm font-semibold">Veteran status (optional)</label>
                <select name="compliance_veteran" class="w-full p-2 border rounded">
                  <option value="" ${!compliancePrefill.veteran ? 'selected' : ''}>Prefer not to say</option>
                  <option value="protected_veteran" ${compliancePrefill.veteran === 'protected_veteran' ? 'selected' : ''}>Protected Veteran</option>
                  <option value="not_protected" ${compliancePrefill.veteran === 'not_protected' ? 'selected' : ''}>Not a Protected Veteran</option>
                </select>
              </div>
            ` : ''}
            ${complianceBlocks.includes('work_auth') ? `
              <div class="mb-3">
                <label class="block text-sm font-semibold">Work authorization</label>
                <select name="compliance_work_auth" class="w-full p-2 border rounded">
                  <option value="" ${!compliancePrefill.work_auth ? 'selected' : ''}>Prefer not to say</option>
                  <option value="authorized" ${compliancePrefill.work_auth === 'authorized' ? 'selected' : ''}>Authorized to work in the U.S.</option>
                  <option value="not_authorized" ${compliancePrefill.work_auth === 'not_authorized' ? 'selected' : ''}>Not authorized</option>
                </select>
              </div>
            ` : ''}
            ${complianceBlocks.includes('prior_employment') ? `
              <div class="mb-3">
                <label class="block text-sm font-semibold">Have you worked here before?</label>
                <select name="compliance_prior_employment" class="w-full p-2 border rounded">
                  <option value="" ${!compliancePrefill.prior_employment ? 'selected' : ''}>Prefer not to say</option>
                  <option value="yes" ${compliancePrefill.prior_employment === 'yes' ? 'selected' : ''}>Yes</option>
                  <option value="no" ${compliancePrefill.prior_employment === 'no' ? 'selected' : ''}>No</option>
                </select>
              </div>
            ` : ''}
            ${complianceBlocks.includes('background_check') ? `
              <div class="mb-3">
                <label class="block text-sm font-semibold">Background check consent</label>
                <select name="compliance_background_check" class="w-full p-2 border rounded">
                  <option value="" ${!compliancePrefill.background_check ? 'selected' : ''}>Prefer not to say</option>
                  <option value="yes" ${compliancePrefill.background_check === 'yes' ? 'selected' : ''}>I consent</option>
                  <option value="no" ${compliancePrefill.background_check === 'no' ? 'selected' : ''}>I do not consent</option>
                </select>
              </div>
            ` : ''}
            ${complianceBlocks.includes('age_minimum') ? `
              <div class="mb-3">
                <label class="block text-sm font-semibold">Age confirmation (required)</label>
                <select name="compliance_age_minimum" class="w-full p-2 border rounded" required>
                  <option value="">Select...</option>
                  <option value="yes" ${compliancePrefill.age_minimum === 'yes' ? 'selected' : ''}>I am at least 18 years old</option>
                  <option value="no" ${compliancePrefill.age_minimum === 'no' ? 'selected' : ''}>I am under 18</option>
                </select>
              </div>
            ` : ''}
            <label class="flex items-center gap-2 text-xs text-slate-600 mt-2">
              <input type="checkbox" name="save_compliance" value="1" checked />
              <span>Save these responses to my profile for next time</span>
            </label>
          </div>
          ` : ''}
          <label class="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" name="tos_accept" value="1" required class="mt-1" />
            <span>I agree to the <a href="/#terms" class="underline">Terms & Disclaimer</a>.</span>
          </label>
          <button type="submit" class="text-purple px-4 py-2 rounded hover:bg-indigo-700">
            Submit Application
          </button>
        </form>
  

        <p class="mt-2">
          <a href="/#list-detail?id=${jobId}" class="text-blue-600 hover:underline">${CONFIG.JOB_COPY?.BACK_TO_DETAIL || '← Back to Job Detail'}</a>
        </p>
      `;
  
      // --- Handle checkbox limit (only one resume + one cover) ---
      function enforceSingleSelection(name) {
        document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
          cb.addEventListener("change", (e) => {
            if (e.target.checked) {
              document.querySelectorAll(`input[name="${name}"]`).forEach(other => {
                if (other !== e.target) other.checked = false;
              });
            }
          });
        });
      }
      enforceSingleSelection("resume");
      enforceSingleSelection("cover_letter");
  
      // --- Handle submission ---
      const applyForm = document.getElementById("applyForm");
      attachFieldHints(applyForm);
      applyForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const messageEl = document.getElementById("applyMessage");
        const formData = new FormData(e.target);
        const selectedResume = formData.get("resume") || formData.get("resume_link");
        const selectedCover = formData.get("cover_letter") || "";
        const compliance = {
          gender: formData.get('compliance_gender') || '',
          race: formData.get('compliance_race') || '',
          disability: formData.get('compliance_disability') || '',
          veteran: formData.get('compliance_veteran') || '',
          work_auth: formData.get('compliance_work_auth') || '',
          prior_employment: formData.get('compliance_prior_employment') || '',
          background_check: formData.get('compliance_background_check') || '',
          age_minimum: formData.get('compliance_age_minimum') || '',
        };
        const saveCompliance = formData.get('save_compliance') === '1';
        if (saveCompliance) {
          const fd = new FormData();
          Object.entries({
            compliance_gender: compliance.gender,
            compliance_race: compliance.race,
            compliance_disability: compliance.disability,
            compliance_veteran: compliance.veteran,
            compliance_work_auth: compliance.work_auth,
            compliance_prior_employment: compliance.prior_employment,
            compliance_background_check: compliance.background_check,
            compliance_age_minimum: compliance.age_minimum,
          }).forEach(([k, v]) => fd.append(k, v));
          fetch('/api/user-profile-update', { method: 'POST', body: fd, credentials: 'include' }).catch(() => {});
        }
        const resumeRequired = true;

        if (resumeRequired && !selectedResume) {
          if (messageEl) {
            messageEl.className = "mb-4 text-sm text-amber-700";
            messageEl.textContent = CONFIG.JOB_COPY?.RESUME_REQUIRED_MSG || "Please provide a resume link or select a resume.";
          }
          const resumeLink = document.getElementById("resume-link");
          markInvalidField(resumeLink, "Resume is required.");
          return;
        }
  
        try {
          const response = await fetch("/api/submit-application", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId, resume: selectedResume, cover_letter: selectedCover, compliance, tos_accept: formData.get('tos_accept') ? 1 : 0 }),
            credentials: "include"
          });

          const result = await response.json();
          if (response.status === 401) {
            window.location.hash = "#login";
            return;
          }
          if (!response.ok) throw new Error(result.message || "Failed to submit application");

      container.innerHTML = `<p class="text-green-600">✅ Application submitted successfully!</p>
            <div class="mt-4 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
              If you experience any issues with an employer, you can <a class="text-blue-600 hover:underline" href="/#support?subject=Report%20Abuse&context=apply:${jobId}">report abuse</a>.
            </div>
            <p><a href="/#list-detail?id=${jobId}" class="text-blue-600 hover:underline">${CONFIG.JOB_COPY?.BACK_TO_DETAIL || '← Back to Job Detail'}</a></p>`;
        } catch (err) {
          container.innerHTML += `<p class="text-red-600">❌ Error: ${err.message}</p>`;
        }
      });
    } catch (err) {
      container.innerHTML = `<p class="text-red-600">❌ Error: ${err.message}</p>`;
    }
  }
  
