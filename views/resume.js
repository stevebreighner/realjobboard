export async function renderResume(container) {
    try {
      // Fetch user profile
      const profileRes = await fetch("/wp-json/customapi/v1/user-profile?_=" + Date.now(), {
        credentials: "include"
      });
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.message || "Failed to fetch profile");
  
      container.innerHTML = `
        <h1 class="text-2xl font-bold mb-4">Manage Your Documents</h1>
    <italic>Save Word files in proper Word format</italic>
        <section class="mb-8">
          <h2 class="text-xl font-semibold mb-2">Resumes</h2>
          <ul id="resumeList" class="space-y-2">
            ${profileData.resumes?.map(r => `
              <li class="flex items-center justify-between border rounded px-3 py-2">
                <a href="${r.url}" target="_blank" class="text-blue-600 hover:underline">${r.name}</a>
                <button data-time="${r.time}" class="deleteResume text-red-600 hover:underline text-sm">Delete</button>
              </li>
            `).join("") || `<p class="text-gray-500">No resumes uploaded yet.</p>`}
          </ul>
          <form id="resumeUpload" class="mt-4 flex items-center space-x-2">
            <input type="file" name="resume" accept=".pdf,.doc,.docx" required />
            <button type="submit" class="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">
              Upload Resume
            </button>
          </form>
        </section>
  
        <section>
          <h2 class="text-xl font-semibold mb-2">Cover Letters</h2>
          <ul id="coverList" class="space-y-2">
            ${profileData.cover_letters?.map(c => `
              <li class="flex items-center justify-between border rounded px-3 py-2">
                <a href="${c.url}" target="_blank" class="text-blue-600 hover:underline">${c.name}</a>
                <button data-time="${c.time}" class="deleteCover text-red-600 hover:underline text-sm">Delete</button>
              </li>
            `).join("") || `<p class="text-gray-500">No cover letters uploaded yet.</p>`}
          </ul>
          <form id="coverUpload" class="mt-4 flex items-center space-x-2">
            <input type="file" name="cover_letter" accept=".pdf,.doc,.docx" required />
            <button type="submit" class="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">
              Upload Cover Letter
            </button>
          </form>
        </section>
      `;
  
      // --- Resume Upload ---
      document.getElementById("resumeUpload")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("resume", e.target.querySelector('input[name="resume"]').files[0]);
  
        try {
          const res = await fetch("/wp-json/customapi/v1/user-profile-update", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
          if (!res.ok) throw new Error("Failed to upload resume");
          location.reload(); // refresh list
        } catch (err) {
          alert("❌ " + err.message);
        }
      });
  
      // --- Cover Upload ---
      document.getElementById("coverUpload")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("cover_letter", e.target.querySelector('input[name="cover_letter"]').files[0]);
  
        try {
          const res = await fetch("/wp-json/customapi/v1/user-profile-update", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
          if (!res.ok) throw new Error("Failed to upload cover letter");
          location.reload();
        } catch (err) {
          alert("❌ " + err.message);
        }
      });
  
      // --- Resume Delete ---
      container.querySelectorAll(".deleteResume")?.forEach(btn =>
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this resume?")) return;
          try {
            const res = await fetch("/wp-json/customapi/v1/delete-resume/" + btn.dataset.time, {
              method: "DELETE",
              credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to delete resume");
            location.reload();
          } catch (err) {
            alert("❌ " + err.message);
          }
        })
      );
  
      // --- Cover Delete ---
      container.querySelectorAll(".deleteCover")?.forEach(btn =>
        btn.addEventListener("click", async () => {
          if (!confirm("Delete this cover letter?")) return;
          try {
            const res = await fetch("/wp-json/customapi/v1/delete-cover/" + btn.dataset.time, {
              method: "DELETE",
              credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to delete cover letter");
            location.reload();
          } catch (err) {
            alert("❌ " + err.message);
          }
        })
      );
  
    } catch (err) {
      container.innerHTML = `<p class="text-red-600">❌ Error: ${err.message}</p>`;
    }
  }
  