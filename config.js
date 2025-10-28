// config.js

export const CONFIG = {
    COMPANY_NAME: 'JobBoard', // or "PetFinder", etc.
    COMPANY_BUSINESS_THING: 'Job', // or "Pet", etc.
    COMPANY_BUSINESS_THING_PLURAL: 'Jobs', // or "Pets"
    WEBSITE_URL: 'jobs.stephenbreighner.com', // or "Pets"
    COMPANY_SUPPORT_EMAIL: 'support@jobs.stephenbreighner.com', // or "Pets"
    SUBMIT_LABEL: 'Apply Now', // or 'Submit Offer', etc.
  
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'rate', label: 'rate', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
    ],
  
    filters: [
      { name: 'location', label: 'Location', type: 'text' },
      // More filters can be added here
    ],
  };
  
 