// config.js

const APP_DOMAIN = 'jobs.stephenbreighner.com';

export const CONFIG = {
    COMPANY_NAME: 'JobBoard', // or "PetFinder", etc.
    COMPANY_BUSINESS_THING: 'Job', // or "Pet", etc.
    COMPANY_BUSINESS_THING_PLURAL: 'Jobs', // or "Pets"
    APP_DOMAIN,
    WEBSITE_URL: `https://${APP_DOMAIN}`, // or "Pets"
    COMPANY_SUPPORT_EMAIL: `support@${APP_DOMAIN}`, // or "Pets"
    SUBMIT_LABEL: 'Apply Now', // or 'Submit Offer', etc.
    TURNSTILE_SITE_KEY: '0x4AAAAAACXQm_OHceB7I6bi',
  
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'field', label: 'Field (e.g. Tech, Auto)', type: 'text', required: true },
      { name: 'street1', label: 'Street Address (optional)', type: 'text', required: false },
      { name: 'street2', label: 'Unit/Suite (optional)', type: 'text', required: false },
      { name: 'city', label: 'City', type: 'text', required: true },
      { name: 'state', label: 'State (2-letter)', type: 'text', required: true },
      { name: 'zip', label: 'ZIP Code', type: 'text', required: true },
      { name: 'country', label: 'Country (USA only)', type: 'text', required: true },
      { name: 'rate', label: 'Rate', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
    ],
  
    filters: [
      { name: 'field', label: 'Field', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
      { name: 'zip', label: 'ZIP', type: 'text' },
    ],
  };
  
 
