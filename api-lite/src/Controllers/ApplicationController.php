<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\ApplicationModel;
use App\Models\JobModel;
use App\Services\RateLimiter;
use App\Services\EncryptionService;
use App\Models\AuditLogModel;

class ApplicationController {
  private AuthService $auth;
  private ApplicationModel $applications;
  private JobModel $jobs;
  private EncryptionService $crypto;
  private AuditLogModel $audit;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->applications = new ApplicationModel();
    $this->jobs = new JobModel();
    $this->crypto = new EncryptionService();
    $this->audit = new AuditLogModel();
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

  public function check(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
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
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
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
      $ciphertext = base64_encode($enc['ciphertext']);
      $this->applications->setMeta($appId, 'compliance', $ciphertext, $enc['iv'], $enc['tag']);
    }
    $this->audit->log((int) $user['id'], 'application_submitted', 'Applied to job', [
      'job_id' => $jobId,
      'application_id' => $appId,
    ]);

    return [
      'message' => 'Application submitted',
      'application_id' => $appId,
    ];
  }
}
