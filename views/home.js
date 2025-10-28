//home.js

import { CONFIG } from '../config.js';
export function renderHome(container) {
    container.innerHTML = `
      <!-- Hero Section -->
      <div class="flex flex-col items-center justify-center text-center min-h-screen bg-gradient-to-br from-indigo-600 to-purple-500 text-white p-8">
        <h1 class="text-4xl md:text-6xl font-bold mb-4">Welcome to ${CONFIG.COMPANY_NAME}</h1>
        <p class="text-xl md:text-2xl mb-6">Find the best talent. Post a ${CONFIG.COMPANY_BUSINESS_THING} Get hired.</p>
        <div class="flex gap-4">
          <a href="/#post" class="bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl shadow hover:bg-gray-100 transition">Post a ${CONFIG.COMPANY_BUSINESS_THING}</a>
          <a href="/#list" class="border border-white px-6 py-3 rounded-xl hover:bg-white hover:text-indigo-600 transition">Browse ${CONFIG.COMPANY_BUSINESS_THING_PLURAL}</a>
        </div>
      </div>
  
      <!-- What We Do Section -->
      <section class="bg-white text-gray-800 py-16 px-6 md:px-12">
        <h2 class="text-4xl font-bold text-center mb-12">What We Do</h2>
        <div class="max-w-6xl mx-auto grid gap-12 md:grid-cols-3 text-center">
          <div class="p-6 shadow-md rounded-2xl hover:shadow-xl transition">
            <div class="mx-auto h-12 w-12 text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 7V3h12v4M6 7h12M6 7l-1 14h14l-1-14M6 7h12M9 11h6m-6 4h6" /></svg>
            </div>
            <h3 class="text-2xl font-semibold mb-2">For Employers</h3>
            <p class="text-gray-600">Post ${CONFIG.COMPANY_BUSINESS_THING_PLURAL} quickly, track applicants, and find the right talent without noise or clutter.</p>
          </div>
          <div class="p-6 shadow-md rounded-2xl hover:shadow-xl transition">
            <div class="mx-auto h-12 w-12 text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 12a4 4 0 00-8 0m8 0a4 4 0 01-8 0m8 0H5m14 0a2 2 0 00-2-2h-3.5m-1 4H7m0 0v2m0-2h10" /></svg>
            </div>
            <h3 class="text-2xl font-semibold mb-2">For Job Seekers</h3>
            <p class="text-gray-600">Search and apply to ${CONFIG.COMPANY_BUSINESS_THING} easily. No ads, no spam. Just real opportunities.</p>
          </div>
          <div class="p-6 shadow-md rounded-2xl hover:shadow-xl transition">
            <div class="mx-auto h-12 w-12 text-indigo-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" /></svg>
            </div>
            <h3 class="text-2xl font-semibold mb-2">Built for Speed</h3>
            <p class="text-gray-600">Our platform is lightning fast, optimized for simplicity, and built with modern tech.</p>
          </div>
        </div>
      </section>
    `;
  }
  