// config.js

const APP_DOMAIN = 'jobs.stephenbreighner.com';
// const JOB_PRICE_STANDARD = 149;
// const JOB_PRICE_PREMIUM = 299;
const JOB_PRICE_STANDARD = 0.01;
const JOB_PRICE_PREMIUM = 0.02;

export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export const CONFIG = {
    COMPANY_NAME: 'JobBoard', // or "PetFinder", etc.
    COMPANY_BUSINESS_THING: 'Job', // or "Pet", etc.
    COMPANY_BUSINESS_THING_PLURAL: 'Jobs', // or "Pets"
    LOGO_URL: '/logo.svg',
    APP_DOMAIN,
    WEBSITE_URL: `https://${APP_DOMAIN}`, // or "Pets"
    COMPANY_SUPPORT_EMAIL: `support@${APP_DOMAIN}`, // or "Pets"
    API_BASE: '',
    SUBMIT_LABEL: 'Apply Now', // or 'Submit Offer', etc.
    TURNSTILE_SITE_KEY: '0x4AAAAAACXQm_OHceB7I6bi',
    JOB_POSTING_TIERS: [
      {
        id: 'standard',
        label: 'Standard',
        price: JOB_PRICE_STANDARD,
        durationDays: 30,
        featured: false,
        blurb: 'Great for most openings.',
      },
      {
        id: 'premium',
        label: 'Premium',
        price: JOB_PRICE_PREMIUM,
        durationDays: 60,
        featured: true,
        blurb: 'Featured placement + verified badge.',
      },
    ],
  
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'field', label: 'Field (e.g. Tech, Auto)', type: 'text', required: true },
      { name: 'street1', label: 'Street Address (optional)', type: 'text', required: false },
      { name: 'street2', label: 'Unit/Suite (optional)', type: 'text', required: false },
      { name: 'city', label: 'City', type: 'text', required: true },
      { name: 'state', label: 'State', type: 'select', required: true, options: US_STATES },
      { name: 'zip', label: 'ZIP Code', type: 'text', required: true },
      { name: 'country', label: 'Country (USA only)', type: 'text', required: true },
      { name: 'rate_type', label: 'Rate Type', type: 'select', required: true, options: [
        { value: 'hourly', label: 'Hourly' },
        { value: 'salary', label: 'Salary' },
        { value: 'contract', label: 'Contract' },
        { value: 'commission', label: 'Commission' },
      ] },
      { name: 'rate_min', label: 'Rate Min', type: 'text', required: true },
      { name: 'rate_max', label: 'Rate Max', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
    ],
  
    filters: [
      { name: 'field', label: 'Field', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
      { name: 'zip', label: 'ZIP', type: 'text' },
      { name: 'rate_type', label: 'Rate Type', type: 'text' },
      { name: 'rate_min', label: 'Min Rate', type: 'text' },
      { name: 'rate_max', label: 'Max Rate', type: 'text' },
    ],
  };
  
 
