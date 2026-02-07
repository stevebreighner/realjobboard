<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\JobModel;
use App\Models\UserMetaModel;
use App\Models\ApplicationModel;
use App\Models\UserProfileModel;
use App\Models\CompanyModel;
use App\Models\UserFileModel;
use App\Services\RateLimiter;
use App\Services\Mailer;

class JobPostController {
  private AuthService $auth;
  private JobModel $jobs;
  private UserMetaModel $userMeta;
  private ApplicationModel $applications;
  private UserProfileModel $profiles;
  private UserFileModel $files;
  private CompanyModel $companies;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->jobs = new JobModel();
    $this->userMeta = new UserMetaModel();
    $this->applications = new ApplicationModel();
    $this->profiles = new UserProfileModel();
    $this->files = new UserFileModel();
    $this->companies = new CompanyModel();
  }

  private function requireEmployer(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return [];
    }
    $role = $user['role'] ?? '';
    if ($role !== 'employer' && $role !== 'site_admin' && $role !== 'administrator') {
      http_response_code(403);
      return [];
    }
    return $user;
  }

  private function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  public function listUserJobs(): array {
    $user = $this->requireEmployer();
    if (empty($user)) return ['error' => 'Not logged in'];
    $jobs = $this->jobs->listByOwner((int) $user['id']);
    return $jobs;
  }

  public function detail(): array {
    $user = $this->requireEmployer();
    if (empty($user)) return ['error' => 'Not logged in'];
    $jobId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    if ($jobId <= 0) {
      http_response_code(422);
      return ['error' => 'Missing job id'];
    }
    $job = $this->jobs->getById($jobId);
    if (empty($job)) {
      http_response_code(404);
      return ['error' => 'Job not found'];
    }
    $ownerId = $job['meta']['owner_id'] ?? null;
    if ($ownerId && (int) $ownerId !== (int) $user['id'] && !in_array($user['role'], ['site_admin','administrator'], true)) {
      http_response_code(403);
      return ['error' => 'Access denied'];
    }

    $apps = $this->applications->listByJob($jobId);
    $applicants = [];
    foreach ($apps as $app) {
      $appUserId = (int) $app['user_id'];
      $meta = $this->profiles->getMeta($appUserId, ['first_name','last_name','city','state','zip','hide_email']);
      $u = $this->auth->getUserById($appUserId);
      $name = trim(($meta['first_name'] ?? '') . ' ' . ($meta['last_name'] ?? ''));
      if (!$name) $name = $u['username'] ?? 'Applicant';
      $applicants[] = [
        'id' => $appUserId,
        'name' => $name,
        'email' => $u['email'] ?? '',
        'hide_email' => ($meta['hide_email'] ?? '') === '1',
        'resume' => $app['resume_url'] ?? '',
        'cover' => $app['cover_url'] ?? '',
        'status' => $app['status'] ?? 'new',
        'rank' => (int) ($app['rank'] ?? 0),
        'match_score' => (int) ($app['match_score'] ?? 0),
        'pref_score' => (int) ($app['pref_score'] ?? 0),
        'resume_text' => $app['resume_text'] ?? '',
        'city' => $meta['city'] ?? '',
        'state' => $meta['state'] ?? '',
        'zip' => $meta['zip'] ?? '',
      ];
    }

    return array_merge($job, [
      'applicants' => $applicants,
      'raw_content' => $job['meta']['description'] ?? $job['description'] ?? '',
    ]);
  }

  public function update(): array {
    $user = $this->requireEmployer();
    if (empty($user)) return ['error' => 'Not logged in'];
    $data = $this->jsonInput();
    $jobId = (int) ($data['id'] ?? 0);
    if (!$jobId) {
      http_response_code(422);
      return ['error' => 'Missing job id'];
    }
    $job = $this->jobs->getById($jobId);
    if (empty($job)) {
      http_response_code(404);
      return ['error' => 'Job not found'];
    }
    $ownerId = $job['meta']['owner_id'] ?? null;
    if ($ownerId && (int) $ownerId !== (int) $user['id'] && !in_array($user['role'], ['site_admin','administrator'], true)) {
      http_response_code(403);
      return ['error' => 'Access denied'];
    }
    $title = trim((string) ($data['title'] ?? $job['title']));
    $status = trim((string) ($data['status'] ?? 'draft'));
    if (!in_array($status, ['draft','publish'], true)) $status = 'draft';
    $this->jobs->updateJob($jobId, $title ?: 'Untitled', $status);
    $meta = $data['meta'] ?? $data;
    $allowed = ['description','field','street1','street2','city','state','zip','country','rate_type','rate_min','rate_max','job_type','company','company_site','job_featured','job_payment_status','job_tier','job_tier_label'];
    $update = [];
    foreach ($allowed as $key) {
      if (array_key_exists($key, $meta)) {
        $update[$key] = $meta[$key];
      }
    }
    $this->jobs->updateMeta($jobId, $update);
    return ['ok' => true];
  }

  public function create(): array {
    $user = $this->requireEmployer();
    if (empty($user)) return ['error' => 'Not logged in'];
    $data = $this->jsonInput();
    $title = trim((string) ($data['title'] ?? 'Untitled'));
    $status = trim((string) ($data['status'] ?? 'draft'));
    if (!in_array($status, ['draft','publish'], true)) $status = 'draft';
    $meta = $data['meta'] ?? $data;
    $companyId = (int) ($this->userMeta->getMeta((int) $user['id'], 'company_id') ?? 0);
    if ($companyId) {
      $company = $this->companies->findById($companyId);
      if ($company) {
        $meta['company'] = $meta['company'] ?? $company['name'];
        $meta['company_slug'] = $meta['company_slug'] ?? $company['slug'];
      }
    }
    $meta['owner_id'] = (string) $user['id'];
    $meta['owner_email'] = $user['email'] ?? '';
    $jobId = $this->jobs->createDraft($title, [], $status);
    $this->jobs->updateMeta($jobId, $meta);
    return ['id' => $jobId];
  }

  public function delete(): array {
    $user = $this->requireEmployer();
    if (empty($user)) return ['error' => 'Not logged in'];
    $data = $this->jsonInput();
    $jobId = (int) ($data['id'] ?? 0);
    if (!$jobId) {
      http_response_code(422);
      return ['error' => 'Missing job id'];
    }
    $job = $this->jobs->getById($jobId);
    if (empty($job)) {
      http_response_code(404);
      return ['error' => 'Job not found'];
    }
    $ownerId = $job['meta']['owner_id'] ?? null;
    if ($ownerId && (int) $ownerId !== (int) $user['id'] && !in_array($user['role'], ['site_admin','administrator'], true)) {
      http_response_code(403);
      return ['error' => 'Access denied'];
    }
    $this->jobs->deleteJob($jobId);
    return ['ok' => true];
  }

  public function updateApplicationStatus(): array {
    $user = $this->requireEmployer();
    if (empty($user)) return ['error' => 'Not logged in'];
    $data = $this->jsonInput();
    $jobId = (int) ($data['job_id'] ?? 0);
    $userId = (int) ($data['user_id'] ?? 0);
    if (!$jobId || !$userId) {
      http_response_code(422);
      return ['error' => 'Missing job/user'];
    }
    $status = $data['status'] ?? null;
    $rank = (int) ($data['rank'] ?? 0);
    $this->applications->updateStatus($jobId, $userId, $status ? (string) $status : null, $rank);
    return ['ok' => true];
  }

  public function removeApplication(): array {
    $user = $this->requireEmployer();
    if (empty($user)) return ['error' => 'Not logged in'];
    $data = $this->jsonInput();
    $jobId = (int) ($data['job_id'] ?? 0);
    $userId = (int) ($data['user_id'] ?? 0);
    if (!$jobId || !$userId) {
      http_response_code(422);
      return ['error' => 'Missing job/user'];
    }
    $this->applications->remove($jobId, $userId);
    return ['ok' => true];
  }

  public function employerClick(): array {
    // placeholder for learning
    return ['ok' => true];
  }

  public function resetLearning(): array {
    return ['ok' => true, 'message' => 'Learning reset'];
  }

  public function contactApplicant(): array {
    $user = $this->requireEmployer();
    if (empty($user)) return ['error' => 'Not logged in'];
    $data = $this->jsonInput();
    $applicantId = (int) ($data['user_id'] ?? 0);
    $message = trim((string) ($data['message'] ?? ''));
    if (!$applicantId || !$message) {
      http_response_code(422);
      return ['error' => 'Missing fields'];
    }
    $app = $this->auth->getUserById($applicantId);
    if (empty($app)) {
      http_response_code(404);
      return ['error' => 'Applicant not found'];
    }
    $mailer = new Mailer();
    $subject = 'Message from employer';
    $mailer->send($app['email'], $subject, nl2br(htmlspecialchars($message, ENT_QUOTES)), $message);
    return ['ok' => true];
  }
}
