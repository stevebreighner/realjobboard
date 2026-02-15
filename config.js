// config.js

const APP_DOMAIN = (() => {
  if (typeof window !== 'undefined' && window?.location?.hostname) {
    return window.location.hostname.replace(/^www\./, '');
  }
  return 'jobs.stephenbreighner.com';
})();
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
    SITE_TITLE: 'Jabbard',
    SITE_DESCRIPTION: 'A job search site with privacy-first applications and smarter matching.',
    COMPANY_NAME: 'Jabbard', // or "PetFinder", etc.
    COMPANY_BUSINESS_THING: 'Job', // or "Pet", etc.
    COMPANY_BUSINESS_THING_PLURAL: 'Jobs', // or "Pets"
    COMPANY_ENTITY_LABEL: 'Company page',
    LOGO_URL: '/logo.svg',
    EMAIL_FROM_NAME: 'Jabbard', // display name for system emails
    APP_DOMAIN,
    WEBSITE_URL: `https://${APP_DOMAIN}`, // used by frontend links
    COMPANY_SUPPORT_EMAIL: `support@${APP_DOMAIN}`, // or "Pets"
    API_BASE: '',
    SUBMIT_LABEL: 'Apply Now', // or 'Submit Offer', etc.
    TURNSTILE_SITE_KEY: '0x4AAAAAACXQm_OHceB7I6bi',
    SITE_TAGLINE: 'A job search site',
    SITE_STAGE_LABEL: 'Beta',
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
    JOBS_REQUIRE_PAYMENT: false,
    JOB_COPY: {
      SINGULAR: 'Job',
      PLURAL: 'Jobs',
      ROLE_EMPLOYER: 'Employer',
      ROLE_EMPLOYEE: 'Job Seeker',
      ROLE_EMPLOYER_VERIFIED: 'Employer (Verified)',
      ROLE_EMPLOYER_PENDING: 'Employer (Pending Verification)',
      MANAGE_OPENINGS: 'Manage My Openings',
      MANAGE_RESUME: 'Manage Resume & Cover Letter',
      MY_APPLICATIONS: 'My Applications',
      SAVED_JOBS: 'Saved Jobs',
      JOB_ALERTS: 'Job Alerts',
      POST_CTA: 'Post a job',
      SEARCH_CTA: 'Search openings',
      APPLY_FOR_PREFIX: 'Apply for:',
      LIST_TITLE: 'Open Roles',
      LIST_SUBTITLE: 'Curated listings with privacy-first applications.',
      ALERTS_TITLE: 'Job Alerts',
      MY_POSTS_TITLE: 'My Job Posts',
      BACK_TO_DETAIL: '← Back to Job Detail',
      VIEW_JOB: 'View job',
      SORT_TITLE_LABEL: 'Job Title A–Z',
      MY_APPLICATIONS_TITLE: 'My Applications',
      APPLICATION_SEARCH_PLACEHOLDER: 'Search jobs or company...',
      STATUS_ALL: 'All statuses',
      STATUS_NEW: 'New',
      STATUS_REVIEWING: 'Reviewing',
      STATUS_SHORTLISTED: 'Shortlisted',
      STATUS_REJECTED: 'Rejected',
      STATUS_WITHDRAWN: 'Withdrawn',
      SORT_NEWEST: 'Newest first',
      SORT_OLDEST: 'Oldest first',
      SORT_COMPANY: 'Company A–Z',
      WITHDRAW_ACTION: 'Withdraw',
      APPLICATIONS_EMPTY: 'No applications found.',
      JOBS_EMPTY: 'No job posts found.',
      ALREADY_APPLIED: 'You have already applied to this job.',
      MANAGE_RESUMES_LABEL: 'Manage resumes/cover letters',
      PRIVACY_NOTE_APPLY: 'Privacy note: Employers may contact you using the details you provide. If you choose to hide your email, they will only see your resume link.',
      RESUME_REQUIRED_MSG: 'Please provide a resume link or select a resume.',
      POSTED_BY: 'Posted by',
      POSTED_BY_FALLBACK: 'Posted by Employer',
      COMPANY_LABEL: 'Company:',
      WEBSITE_LABEL: 'Website',
      MESSAGE_EMPLOYER_TITLE: 'Message the Employer',
      OPEN_CONTACT_FORM: 'Open contact form',
      CONTACT_EMPLOYER_TITLE: 'Contact Employer',
      CLOSE_LABEL: 'Close',
      SEND_MESSAGE: 'Send Message',
      REPORT_ABUSE: 'Report abuse',
      MESSAGE_SENT: 'Message sent.',
      MAX_APPS_REACHED: 'This job has reached the maximum of 25 applications.',
      DRAFT_CREATED: 'Job draft created. You can publish it from your dashboard.'
    },
    EMPLOYMENT_TYPES: [
      { value: 'full_time', label: 'Full-time' },
      { value: 'part_time', label: 'Part-time' },
      { value: 'temp', label: 'Temp' },
      { value: 'contract', label: 'Contract' },
      { value: 'internship', label: 'Internship' },
      { value: 'seasonal', label: 'Seasonal' },
    ],
    POST_PAGE_COPY: {
      TIER_TITLE: 'Choose a listing tier',
      TIER_FEATURED: 'Featured placement',
      TIER_STANDARD: 'Standard placement',
      PROMO_LABEL: 'Promo code (optional)',
      PROMO_PLACEHOLDER: 'Enter code',
      CONTINUE_PAYMENT: 'Continue to Payment',
      BACK_TO_LIST: 'Back to Jobs'
    },
    EMPLOYERS_PAGE: {
      heroTitle: 'Employer control, without the noise.',
      heroSubtitle: 'Verify your company, filter applicants fast, and keep listings focused.',
      heroSubline: 'Priority placement and transparent matching — no black‑box promises.',
      ctaPrimary: 'Post a job',
      ctaSecondary: 'Manage openings',
      cards: [
        {
          eyebrow: 'No Data Sales',
          title: 'We don’t sell user data',
          body: 'The platform is funded by paid job posts, so applicant data isn’t sold or monetized.'
        },
        {
          eyebrow: 'Smart Matching',
          title: 'Resume relevance scoring',
          body: 'Applicants are scored against the job description using resume text extraction and keyword matching, so you can prioritize stronger matches quickly.'
        },
        {
          eyebrow: 'Applicant Filtering',
          title: 'Find what matters fast',
          body: 'Filter applicants by name, resume filename, location, and extracted resume text.'
        },
        {
          eyebrow: 'Verified Employers',
          title: 'Trust built in',
          body: 'Employer accounts are verified before posting, helping keep the marketplace trustworthy.'
        },
        {
          eyebrow: 'Privacy‑First Contact',
          title: 'Respect applicant privacy',
          body: 'Applicants can hide their email. When hidden, you’ll see “Email hidden — use resume link only.”'
        }
      ],
      founder: {
        eyebrow: 'Founding Employer',
        title: 'Lock in founder pricing',
        body: 'We’re opening early access to the first 10 companies. Founding employers lock in a discounted rate forever and get priority placement, verified badges, and direct founder support.',
        ctaLabel: 'Apply for founding access',
        ctaNote: 'Early access: $49/month (regular $99)'
      }
    },
    EMPLOYEES_PAGE: {
      heroEyebrow: 'Job Seekers',
      heroTitle: 'More signal. Less spam.',
      heroSubtitle: 'Apply once, reuse your resume, and control what employers see.',
      heroSubline: 'Encrypted files and privacy‑first defaults across the board.',
      ctaPrimary: 'Browse jobs',
      ctaSecondary: 'Manage profile',
      cards: [
        {
          eyebrow: 'Privacy‑First',
          title: 'Encrypted by default',
          body: 'Resumes and cover letters are encrypted at rest and only decrypted when you choose to load them.'
        },
        {
          eyebrow: 'Abuse Prevention',
          title: 'Report issues fast',
          body: 'Report abuse directly to admins from any job or application page.'
        },
        {
          eyebrow: 'Email Control',
          title: 'Hide your email',
          body: 'You can hide your email from employers and share only your resume link if you prefer.'
        },
        {
          eyebrow: 'Speed',
          title: 'Fast, lightweight experience',
          body: 'No heavy frameworks — pages are fast and responsive even on slow connections.'
        }
      ]
    },
    HOME_HEROES: [
      {
        key: 'privacy',
        title: 'Not another job board.',
        lines: [
          'Your job search data isn’t tracked, sold, or shared. Period.',
          'Privacy‑first defaults with encrypted files and minimal data collection.',
          'A clean, respectful place to search and hire.'
        ],
        primary: { label: 'Search openings', href: '/#list' },
        secondary: { label: 'How privacy works', href: '/#privacy' }
      },
      {
        key: 'analytics',
        title: 'Self‑hosted analytics. No third‑party trackers.',
        lines: [
          'We keep lightweight, first‑party analytics on our own servers.',
          'No Google Analytics, no ad pixels, and no data resale.',
          'You get insights without sacrificing user privacy.'
        ],
        primary: { label: 'See privacy policy', href: '/#privacy' },
        secondary: { label: 'Browse listings', href: '/#list' }
      },
      {
        key: 'employers',
        title: 'Fewer distractions. Better hires.',
        lines: [
          'Built to reduce noise and improve applicant quality without penalizing great candidates.',
          'Smart matching that’s transparent — no black‑box AI.',
          'Privacy‑first: resumes and files are encrypted by default.'
        ],
        primary: { label: 'Post a job', href: '/#post', id: 'postCta' },
        secondary: { label: 'Browse listings', href: '/#list' }
      },
      {
        key: 'employees',
        title: 'Find real work faster.',
        lines: [
          'Search jobs without spam or tracking.',
          'Apply once, reuse your resume, and control what employers see.',
          'Encrypted by default for safer, cleaner hiring.'
        ],
        primary: { label: 'Search openings', href: '/#list' },
        secondary: { label: 'How privacy works', href: '/#employees' }
      },
      {
        key: 'speed',
        title: 'Encrypted. Still lightning‑fast.',
        lines: [
          'Decryption happens only when needed, then we cache for speed.',
          'Lightweight front end keeps load times low.',
          'Security without the slowdown.'
        ],
        primary: { label: 'See speed details', href: '/#speed' },
        secondary: { label: 'Browse listings', href: '/#list' }
      },
      {
        key: 'multisearch',
        title: 'Multi‑search that actually helps.',
        lines: [
          'Search by multiple terms at once to surface better matches.',
          'Results are ranked by how many terms they match.',
          'Find the right fit without endless scrolling.'
        ],
        primary: { label: 'Try multi‑search', href: '/#list' },
        secondary: { label: 'Employer tools', href: '/#employers' }
      }
    ],
    HOME_HERO_BLURB: 'A privacy‑first job search site with smart matching and verified employers.',
    HOME_INFO_CARDS: [
      {
        title: 'Smart matching, no black‑box AI',
        body: 'Multi‑search ranks results by term matches so you get signal fast.'
      },
      {
        title: 'Privacy‑first by design',
        body: 'Your job search data isn’t tracked, sold, or shared. Files are encrypted by default.'
      },
      {
        title: 'Verified employers only',
        body: 'Company verification and reporting keep listings clean and trustworthy.'
      }
    ],
  
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'field', label: 'Industry', type: 'select', required: false, options: [
        { value: 'tech', label: 'Tech' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'finance', label: 'Finance' },
        { value: 'education', label: 'Education' },
        { value: 'retail', label: 'Retail' },
        { value: 'hospitality', label: 'Hospitality' },
        { value: 'construction', label: 'Construction' },
        { value: 'automotive', label: 'Automotive' },
        { value: 'creative', label: 'Creative' },
        { value: 'logistics', label: 'Logistics' },
        { value: 'public_service', label: 'Public Service' },
        { value: 'other', label: 'Other' },
      ] },
      { name: 'employment_type', label: 'Employment Type', type: 'select', required: true, options: [
        { value: 'full_time', label: 'Full-time' },
        { value: 'part_time', label: 'Part-time' },
        { value: 'temp', label: 'Temp' },
        { value: 'contract', label: 'Contract' },
        { value: 'internship', label: 'Internship' },
        { value: 'seasonal', label: 'Seasonal' },
      ] },
      { name: 'street1', label: 'Street Address (optional)', type: 'text', required: false },
      { name: 'street2', label: 'Unit/Suite (optional)', type: 'text', required: false },
      { name: 'city', label: 'City', type: 'text', required: true },
      { name: 'state', label: 'State', type: 'select', required: true, options: US_STATES },
      { name: 'zip', label: 'ZIP Code', type: 'text', required: true },
      { name: 'country', label: 'Country (USA only)', type: 'text', required: true },
      { name: 'rate_type', label: 'Rate Type', type: 'select', required: false, options: [
        { value: 'undisclosed', label: 'Undisclosed' },
        { value: 'hourly', label: 'Hourly' },
        { value: 'salary', label: 'Salary' },
        { value: 'contract', label: 'Contract' },
        { value: 'commission', label: 'Commission' },
      ] },
      { name: 'rate_min', label: 'Rate Min (optional)', type: 'text', required: false },
      { name: 'rate_max', label: 'Rate Max (optional)', type: 'text', required: false },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
    ],
  
    filters: [
      { name: 'field', label: 'Field', type: 'text' },
      { name: 'city', label: 'City', type: 'text' },
      { name: 'state', label: 'State', type: 'text' },
      { name: 'zip', label: 'ZIP', type: 'text' },
      { name: 'employment_type', label: 'Employment Type', type: 'text' },
      { name: 'rate_type', label: 'Rate Type', type: 'text' },
      { name: 'rate_min', label: 'Min Rate', type: 'text' },
      { name: 'rate_max', label: 'Max Rate', type: 'text' },
    ],
  };
  
 
