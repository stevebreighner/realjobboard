<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\ApplicationModel;
use App\Models\JobModel;
use App\Services\RateLimiter;
use App\Services\EncryptionService;
use App\Models\AuditLogModel;
use App\Services\SiteNotificationService;

class ApplicationController {
  private AuthService $auth;
  private ApplicationModel $applications;
  private JobModel $jobs;
  private EncryptionService $crypto;
  private AuditLogModel $audit;
  private SiteNotificationService $notify;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->applications = new ApplicationModel();
    $this->jobs = new JobModel();
    $this->crypto = new EncryptionService();
    $this->audit = new AuditLogModel();
    $this->notify = new SiteNotificationService($GLOBALS['DB_PDO']);
  }

  private function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  private function rateLimit(string $action, int $limit, int $windowSeconds): ?array {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = "{$action}:{$ip}";
    $limiter = new RateLimiter($GLOBALS['DB_PDO']);
    if (!$limiter->check($key, $limit, $windowSeconds)) {
      http_response_code(429);
      return ['error' => 'Too many requests. Please try again later.'];
    }
    return null;
  }

  private function getCountryCode(): string {
    $candidates = [
      $_SERVER['HTTP_CF_IPCOUNTRY'] ?? '',
      $_SERVER['GEOIP_COUNTRY_CODE'] ?? '',
      $_SERVER['HTTP_X_COUNTRY_CODE'] ?? '',
      $_SERVER['HTTP_X_FORWARDED_COUNTRY'] ?? '',
    ];
    foreach ($candidates as $code) {
      $code = strtoupper(trim((string) $code));
      if ($code !== '') return $code;
    }
    return '';
  }

  private function enforceUsOnly(): ?array {
    $code = $this->getCountryCode();
    if ($code && $code !== 'US') {
      http_response_code(403);
      return ['error' => 'This service is currently available in the United States only.'];
    }
    return null;
  }

  public function check(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    if ((int) ($user['email_verified'] ?? 0) !== 1) {
      http_response_code(403);
      return ['error' => 'Email verification required.'];
    }

    $jobId = isset($_GET['jobId']) ? (int) $_GET['jobId'] : 0;
    if ($jobId <= 0) {
      http_response_code(422);
      return ['error' => 'Missing job id'];
    }

    $job = $this->jobs->getById($jobId);
    if (empty($job)) {
      http_response_code(404);
      return ['error' => 'Job not found'];
    }

    $count = $this->applications->countByJob($jobId);
    $already = $this->applications->hasApplied($jobId, (int) $user['id']);
    return [
      'already_applied' => $already,
      'limit_reached' => $count >= 25,
      'count' => $count,
    ];
  }

  public function submit(): array {
    if ($blocked = $this->rateLimit('submit-application', 10, 300)) {
      return $blocked;
    }
    if ($blocked = $this->enforceUsOnly()) {
      return $blocked;
    }
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    if ((int) ($user['email_verified'] ?? 0) !== 1) {
      http_response_code(403);
      return ['error' => 'Email verification required.'];
    }

    $data = $this->jsonInput();
    $jobId = isset($data['jobId']) ? (int) $data['jobId'] : 0;
    $resumeUrl = trim((string) ($data['resume'] ?? ''));
    $coverUrl = trim((string) ($data['cover_letter'] ?? ''));
    $compliance = $data['compliance'] ?? [];
    $tosAccept = !empty($data['tos_accept']);

    if ($jobId <= 0) {
      http_response_code(422);
      return ['error' => 'Missing job id'];
    }
    if (!$tosAccept) {
      http_response_code(422);
      return ['error' => 'Terms not accepted'];
    }

    $job = $this->jobs->getById($jobId);
    if (empty($job)) {
      http_response_code(404);
      return ['error' => 'Job not found'];
    }

    $count = $this->applications->countByJob($jobId);
    if ($count >= 25) {
      http_response_code(409);
      return ['error' => 'Application limit reached'];
    }

    if ($this->applications->hasApplied($jobId, (int) $user['id'])) {
      http_response_code(409);
      return ['error' => 'Already applied'];
    }

    $appId = $this->applications->createApplication($jobId, (int) $user['id'], $resumeUrl ?: null, $coverUrl ?: null);
    if (!empty($compliance)) {
      $enc = $this->crypto->encrypt(json_encode($compliance));
      $ciphertext = 'b64:' . base64_encode($enc['ciphertext']);
      $this->applications->setMeta($appId, 'compliance', $ciphertext, $enc['iv'], $enc['tag']);
    }
    $this->audit->log((int) $user['id'], 'application_submitted', 'Applied to job', [
      'job_id' => $jobId,
      'application_id' => $appId,
    ]);

    $userEmail = $user['email'] ?? '';
    if ($userEmail) {
      $sent = $this->notify->sendApplicationReceived(
        $user,
        $jobId,
        (string) ($job['title'] ?? ''),
        (string) ($job['meta']['company'] ?? '')
      );
      if (!$sent) {
        $this->audit->log((int) $user['id'], 'application_email_failed', 'Email send failed', [
          'job_id' => $jobId,
          'application_id' => $appId,
          'email' => $userEmail,
        ]);
      }
    }

    return [
      'message' => 'Application submitted',
      'application_id' => $appId,
    ];
  }
}
