export async function renderApply(container, jobId) {
    try {
      // --- Fetch job detail (for job title) ---
      const jobRes = await fetch(`/wp-json/customapi/v1/get-list-detail?id=${jobId}`);
      const jobData = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobData.message || "Failed to fetch job details");
      const jobTitle = jobData.title || `Job #${jobId}`;
  
      // --- Check application status ---
      const statusRes = await fetch(`/wp-json/customapi/v1/check-application?jobId=${jobId}`, {
        credentials: "include"
      });
      if (statusRes.status === 401 || statusRes.status === 403) {
        window.location.hash = "#login";
        return;
      }
      const statusData = await statusRes.json();
  
      if (statusData.already_applied) {
        container.innerHTML = `
          <h1 class="text-2xl font-bold mb-4">Apply for: ${jobTitle}</h1>
          <p class="text-red-600 mb-4">⚠️ You have already applied to this job.</p>
          <p><a href="/#resume" class="text-blue-600 hover:underline">Manage resumes/cover letters</a></p>
          <p><a href="/#list-detail?id=${jobId}" class="text-blue-600 hover:underline">← Back to Job Detail</a></p>
        `;
        return;
      }
  
      if (statusData.limit_reached) {
        container.innerHTML = `
          <h1 class="text-2xl font-bold mb-4">Apply for: ${jobTitle}</h1>
          <p class="text-red-600 mb-4">🚫 This job has reached the maximum of 25 applications.</p>
          <p><a href="/#list-detail?id=${jobId}" class="text-blue-600 hover:underline">← Back to Job Detail</a></p>
        `;
        return;
      }
  
      // --- Fetch user profile (for resumes and covers) ---
      const profileRes = await fetch("/wp-json/customapi/v1/user-profile?_=" + Date.now(), {
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
  
      // --- Render form ---
      container.innerHTML = `
        <h1 class="text-2xl font-bold mb-4">Apply for: ${jobTitle}</h1>
        <div id="applyMessage" class="mb-4 text-sm"></div>
        <form id="applyForm" class="space-y-6">
          <div>
                  <p class="mt-4">
          <a href="/#resume" class="text-blue-600 hover:underline">Manage resumes/cover letters</a>
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
                : `<p class="text-gray-500 text-sm">No resumes uploaded. <a href="/#resume" class="text-blue-600 hover:underline">Upload here</a>.</p>`
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
                : `<p class="text-gray-500 text-sm">No cover letters uploaded. <a href="/#resume" class="text-blue-600 hover:underline">Upload here</a>.</p>`
            }
          </div>
  
          <button type="submit" class="text-purple px-4 py-2 rounded hover:bg-indigo-700">
            Submit Application
          </button>
        </form>
  

        <p class="mt-2">
          <a href="/#list-detail?id=${jobId}" class="text-blue-600 hover:underline">← Back to Job Detail</a>
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
      document.getElementById("applyForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const messageEl = document.getElementById("applyMessage");
        const formData = new FormData(e.target);
        const selectedResume = formData.get("resume");
        const selectedCover = formData.get("cover_letter");

        if (!selectedResume || !selectedCover) {
          if (messageEl) {
            messageEl.className = "mb-4 text-sm text-amber-700";
            messageEl.textContent = "Please select both a resume and a cover letter.";
          }
          return;
        }
  
        try {
          const response = await fetch("/wp-json/customapi/v1/submit-application", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobId, resume: selectedResume, cover_letter: selectedCover }),
            credentials: "include"
          });

          const result = await response.json();
          if (response.status === 401) {
            window.location.hash = "#login";
            return;
          }
          if (!response.ok) throw new Error(result.message || "Failed to submit application");

          container.innerHTML = `<p class="text-green-600">✅ Application submitted successfully!</p>
            <p><a href="/#list-detail?id=${jobId}" class="text-blue-600 hover:underline">← Back to Job Detail</a></p>`;
        } catch (err) {
          container.innerHTML += `<p class="text-red-600">❌ Error: ${err.message}</p>`;
        }
      });
    } catch (err) {
      container.innerHTML = `<p class="text-red-600">❌ Error: ${err.message}</p>`;
    }
  }
  
