# QA Checklist

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