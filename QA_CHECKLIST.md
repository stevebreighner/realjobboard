# QA Checklist

## Latest Run
- Date: 2026-02-12
- Scope: authenticated API flow smoke (employee, employer, admin), job lifecycle, applications, files, alerts

### Results
- `/api/ping` OK (`200`)
- `/api/session` unauthenticated path OK (`403`)
- Session/auth via cookie OK for employee, employer, and site_admin test users
- Employee profile update/show OK (`/api/user-profile-update`, `/api/user-profile`)
- Employer create job OK (`/api/create-post`, publish status), and public retrieval OK (`/api/job`, `/api/jobs`)
- Saved jobs toggle/list OK (`/api/saved-jobs`)
- Job alerts create/list/delete OK (`/api/job-alerts`, `/api/job-alerts-delete`)
- Resume text upload/list OK (`/api/user-files-upload-text`, `/api/resumes`)
- Application flow OK:
  - check eligibility (`/api/check-application`)
  - submit (`/api/submit-application`)
  - employer review detail (`/api/user-job-detail`)
  - status update (`/api/update-application-status`)
  - applicant withdraw (`/api/withdraw-application`)
- Contact endpoints OK in dev mode (`/api/contact-employer`, `/api/contact-applicant`)
- Employer job update/delete OK (`/api/user-job-update`, `/api/user-job-delete`)
- Admin users list/create/delete OK (`/api/admin/users`, `/api/admin/user-create`, `/api/admin/user-delete`)
- Fixed `GET /api/admin/flags` 404 by adding route
- Hardened admin delete: now returns `404 User not found` for invalid IDs (instead of false positive `ok`)

### Remaining
- Browser/UI pass still needed for visual regressions and route transition behavior
- Stripe checkout live-flow remains phase 2

## Backlog Input
- [ ] Add new item here (quick scratchpad line)
- [ ] SEO launch step: switch `robots.txt` from `Disallow: /` (dev) to production crawl policy
- [ ] SEO launch step: expand `sitemap.xml` once path-based routes (non-hash) are available
- [ ] Performance pass: extract critical above-the-fold CSS and move remaining CSS to deferred stylesheet

## Phase 1 Close-Out TODOs
- [ ] Run final end-to-end smoke pass (logged-out, employee, employer, admin)
- [ ] Fix any final UI regressions discovered in smoke pass
- [ ] Freeze phase 1 config values (copy, flags, free-post mode)
- [ ] Tag phase 1 release and add brief deployment/runbook notes

## Latest Run
- Date: 2026-02-07
- Scope: login/session, create job w/ compliance, applicant submit, employer view

### Results
- API ping OK
- Jobs list OK (55 jobs)
- Job detail OK (id 68)
- Employee login/session OK (test_qc_user@example.com)
- Employer login/session OK (employer_qc@example.com)
- Apply w/ compliance OK after fix (application_id 3)
- Employer job detail shows compliance answers OK
- Saved jobs toggle/list OK
- Job alerts create/list OK
- Contact employer OK
- Contact applicant OK
- Update application status OK
- Withdraw application OK

## Post‑WP Sanity
- Verify .env DB connection only (no wp-config fallback)
- /api/ping responds 200
- /api/jobs returns list
- Login/register/session OK
- File uploads: resume + avatar save to /uploads

## Latest Run (Post-WP Cutover)
- Date: 2026-02-07
- Scope: ping/jobs/company endpoints + role check

### Results
- /api/ping OK
- /api/jobs OK
- /api/companies OK
- steve.breighner@gmail.com role set to employer
