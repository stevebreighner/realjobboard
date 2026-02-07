<?php
declare(strict_types=1);

use App\Controllers\HealthController;
use App\Controllers\JobsController;
use App\Controllers\AuthController;
use App\Controllers\ProfileController;
use App\Controllers\ApplicationController;
use App\Controllers\StripeWebhookController;
use App\Controllers\StripeController;
use App\Controllers\CompanyController;
use App\Controllers\AdminController;
use App\Controllers\UserFileController;
use App\Controllers\SavedJobController;
use App\Controllers\JobAlertController;
use App\Controllers\DevFlagController;
use App\Controllers\JobPostController;
use App\Controllers\UserApplicationController;
use App\Controllers\AdminUserController;
use App\Controllers\AdminAuditController;
use App\Controllers\EmailTemplateController;
use App\Controllers\AdminCompanyController;

return [
  'GET' => [
    '/api/ping' => [new HealthController(), 'ping'],
    '/api/jobs' => [new JobsController(), 'index'],
    '/api/job' => [new JobsController(), 'detail'],
    '/api/session' => [new AuthController(), 'session'],
    '/api/verify-email' => [new AuthController(), 'verifyEmail'],
    '/api/user-profile' => [new ProfileController(), 'show'],
    '/api/check-application' => [new ApplicationController(), 'check'],
    '/api/stripe-config' => [new StripeController(), 'config'],
    '/api/companies' => [new CompanyController(), 'search'],
    '/api/company' => [new CompanyController(), 'show'],
    '/api/company-owner' => [new CompanyController(), 'owner'],
    '/api/admin/promos' => [new AdminController(), 'promoList'],
    '/api/admin/jobs' => [new AdminController(), 'jobsList'],
    '/api/admin/error-log' => [new AdminController(), 'errorLog'],
    '/api/admin/error-log-download' => [new AdminController(), 'errorLogDownload'],
    '/api/admin/export-users' => [new AdminUserController(), 'exportUsers'],
    '/api/admin/export-jobs' => [new AdminController(), 'exportJobs'],
    '/api/dev-flags' => [new DevFlagController(), 'getFlags'],
    '/api/saved-jobs' => [new SavedJobController(), 'list'],
    '/api/job-alerts' => [new JobAlertController(), 'list'],
    '/api/user-jobs' => [new JobPostController(), 'listUserJobs'],
    '/api/user-job-detail' => [new JobPostController(), 'detail'],
    '/api/user-applications' => [new UserApplicationController(), 'list'],
    '/api/admin/users' => [new AdminUserController(), 'list'],
    '/api/admin/user' => [new AdminUserController(), 'detail'],
    '/api/admin/audit' => [new AdminAuditController(), 'list'],
    '/api/admin/email-templates' => [new EmailTemplateController(), 'adminList'],
    '/api/email-templates' => [new EmailTemplateController(), 'publicList'],
    '/api/admin/companies' => [new AdminCompanyController(), 'list'],
    '/api/admin/company' => [new AdminCompanyController(), 'detail'],
    '/api/user-files' => [new UserFileController(), 'list'],
    '/api/user-file' => [new UserFileController(), 'download'],
    // Legacy aliases
    '/wp-json/customapi/v1/dev-flags' => [new DevFlagController(), 'getFlags'],
    '/wp-json/customapi/v1/saved-jobs' => [new SavedJobController(), 'list'],
    '/wp-json/customapi/v1/job-alerts' => [new JobAlertController(), 'list'],
    '/wp-json/customapi/v1/user-jobs' => [new JobPostController(), 'listUserJobs'],
    '/wp-json/customapi/v1/user-job-detail' => [new JobPostController(), 'detail'],
    '/wp-json/customapi/v1/user-applications' => [new UserApplicationController(), 'list'],
    '/wp-json/customapi/v1/admin/users' => [new AdminUserController(), 'list'],
    '/wp-json/customapi/v1/admin/user' => [new AdminUserController(), 'detail'],
    '/wp-json/customapi/v1/admin/audit' => [new AdminAuditController(), 'list'],
    '/wp-json/customapi/v1/admin/email-templates' => [new EmailTemplateController(), 'adminList'],
    '/wp-json/customapi/v1/email-templates' => [new EmailTemplateController(), 'publicList'],
    '/wp-json/customapi/v1/admin/export-users' => [new AdminUserController(), 'exportUsers'],
    '/wp-json/customapi/v1/admin/export-jobs' => [new AdminController(), 'exportJobs'],
    '/wp-json/customapi/v1/admin/companies' => [new AdminCompanyController(), 'list'],
    '/wp-json/customapi/v1/admin/company' => [new AdminCompanyController(), 'detail'],
  ],
  'POST' => [
    '/api/register' => [new AuthController(), 'register'],
    '/api/login' => [new AuthController(), 'login'],
    '/api/logout' => [new AuthController(), 'logout'],
    '/api/forgot-password' => [new AuthController(), 'forgotPassword'],
    '/api/reset-password' => [new AuthController(), 'resetPassword'],
    '/api/resend-verification' => [new AuthController(), 'resendVerification'],
    '/api/2fa-start' => [new AuthController(), 'start2fa'],
    '/api/2fa-verify' => [new AuthController(), 'verify2fa'],
    '/api/magic-link' => [new AuthController(), 'magicLink'],
    '/api/magic-login' => [new AuthController(), 'magicLogin'],
    '/api/update-password' => [new AuthController(), 'updatePassword'],
    '/api/submit-application' => [new ApplicationController(), 'submit'],
    '/api/stripe-webhook' => [new StripeWebhookController(), 'handle'],
    '/api/stripe-checkout' => [new StripeController(), 'checkout'],
    '/api/company-owner' => [new CompanyController(), 'updateOwner'],
    '/api/admin/promos' => [new AdminController(), 'promoCreate'],
    '/api/admin/job-update' => [new AdminController(), 'jobUpdate'],
    '/api/admin/job-delete' => [new AdminController(), 'jobDelete'],
    '/api/user-profile-update' => [new ProfileController(), 'update'],
    '/api/admin/flags' => [new DevFlagController(), 'adminFlags'],
    '/api/saved-jobs' => [new SavedJobController(), 'toggle'],
    '/api/job-alerts' => [new JobAlertController(), 'create'],
    '/api/job-alerts-delete' => [new JobAlertController(), 'delete'],
    '/api/user-job-update' => [new JobPostController(), 'update'],
    '/api/user-job-delete' => [new JobPostController(), 'delete'],
    '/api/create-post' => [new JobPostController(), 'create'],
    '/api/update-application-status' => [new JobPostController(), 'updateApplicationStatus'],
    '/api/remove-application' => [new JobPostController(), 'removeApplication'],
    '/api/employer-click' => [new JobPostController(), 'employerClick'],
    '/api/employer-reset-learning' => [new JobPostController(), 'resetLearning'],
    '/api/contact-applicant' => [new JobPostController(), 'contactApplicant'],
    '/api/withdraw-application' => [new UserApplicationController(), 'withdraw'],
    '/api/contact-employer' => [new UserApplicationController(), 'contactEmployer'],
    '/api/admin/user-create' => [new AdminUserController(), 'create'],
    '/api/admin/user-update' => [new AdminUserController(), 'update'],
    '/api/admin/user-delete' => [new AdminUserController(), 'delete'],
    '/api/admin/email-templates' => [new EmailTemplateController(), 'adminSave'],
    '/api/admin/company-verify' => [new AdminCompanyController(), 'verify'],
    '/api/admin/company-member' => [new AdminCompanyController(), 'setMember'],
    '/api/admin/company-member-remove' => [new AdminCompanyController(), 'removeMember'],
    '/api/user-files-upload' => [new UserFileController(), 'upload'],
    '/api/user-files-delete' => [new UserFileController(), 'delete'],
    // Legacy aliases
    '/wp-json/customapi/v1/admin/flags' => [new DevFlagController(), 'adminFlags'],
    '/wp-json/customapi/v1/saved-jobs' => [new SavedJobController(), 'toggle'],
    '/wp-json/customapi/v1/job-alerts' => [new JobAlertController(), 'create'],
    '/wp-json/customapi/v1/job-alerts-delete' => [new JobAlertController(), 'delete'],
    '/wp-json/customapi/v1/update-password' => [new AuthController(), 'updatePassword'],
    '/wp-json/customapi/v1/user-job-update' => [new JobPostController(), 'update'],
    '/wp-json/customapi/v1/user-job-delete' => [new JobPostController(), 'delete'],
    '/wp-json/customapi/v1/create-post' => [new JobPostController(), 'create'],
    '/wp-json/customapi/v1/update-application-status' => [new JobPostController(), 'updateApplicationStatus'],
    '/wp-json/customapi/v1/remove-application' => [new JobPostController(), 'removeApplication'],
    '/wp-json/customapi/v1/admin/company-verify' => [new AdminCompanyController(), 'verify'],
    '/wp-json/customapi/v1/admin/company-member' => [new AdminCompanyController(), 'setMember'],
    '/wp-json/customapi/v1/admin/company-member-remove' => [new AdminCompanyController(), 'removeMember'],
    '/wp-json/customapi/v1/employer-click' => [new JobPostController(), 'employerClick'],
    '/wp-json/customapi/v1/employer-reset-learning' => [new JobPostController(), 'resetLearning'],
    '/wp-json/customapi/v1/contact-applicant' => [new JobPostController(), 'contactApplicant'],
    '/wp-json/customapi/v1/withdraw-application' => [new UserApplicationController(), 'withdraw'],
    '/wp-json/customapi/v1/contact-employer' => [new UserApplicationController(), 'contactEmployer'],
    '/wp-json/customapi/v1/admin/user-create' => [new AdminUserController(), 'create'],
    '/wp-json/customapi/v1/admin/user-update' => [new AdminUserController(), 'update'],
    '/wp-json/customapi/v1/admin/user-delete' => [new AdminUserController(), 'delete'],
    '/wp-json/customapi/v1/admin/email-templates' => [new EmailTemplateController(), 'adminSave'],
  ],
];
