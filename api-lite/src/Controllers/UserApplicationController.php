<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\ApplicationModel;
use App\Models\JobModel;
use App\Models\UserProfileModel;
use App\Services\Mailer;

class UserApplicationController {
  private AuthService $auth;
  private ApplicationModel $applications;
  private JobModel $jobs;
  private UserProfileModel $profiles;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->applications = new ApplicationModel();
    $this->jobs = new JobModel();
    $this->profiles = new UserProfileModel();
  }

  private function requireUser(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
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

  public function list(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $apps = $this->applications->listByUser((int) $user['id']);
    $results = [];
    foreach ($apps as $app) {
      $job = $this->jobs->getById((int) $app['job_id']);
      $meta = $job['meta'] ?? [];
      $city = $meta['city'] ?? '';
      $state = $meta['state'] ?? '';
      $zip = $meta['zip'] ?? '';
      $location = trim(implode(' ', array_filter([trim($city . ($state ? ',' : '')), $state, $zip])));
      $results[] = [
        'job_id' => (int) $app['job_id'],
        'job_title' => $job['title'] ?? 'Job',
        'company' => $meta['company'] ?? 'Employer',
        'location' => $location,
        'rate_type' => $meta['rate_type'] ?? '',
        'rate_min' => $meta['rate_min'] ?? '',
        'rate_max' => $meta['rate_max'] ?? '',
        'status' => $app['status'] ?? 'new',
        'applied_time' => $app['created_at'] ? strtotime($app['created_at']) : time(),
        'resume' => $app['resume_url'] ?? '',
        'cover_letter' => $app['cover_url'] ?? '',
      ];
    }
    return $results;
  }

  public function withdraw(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $data = $this->jsonInput();
    $jobId = (int) ($data['job_id'] ?? 0);
    if (!$jobId) {
      http_response_code(422);
      return ['error' => 'Missing job id'];
    }
    $this->applications->withdraw($jobId, (int) $user['id']);
    return ['ok' => true];
  }

  public function contactEmployer(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $data = $this->jsonInput();
    $jobId = (int) ($data['job_id'] ?? 0);
    $message = trim((string) ($data['message'] ?? ''));
    if (!$jobId || !$message) {
      http_response_code(422);
      return ['error' => 'Missing fields'];
    }
    $job = $this->jobs->getById($jobId);
    if (empty($job)) {
      http_response_code(404);
      return ['error' => 'Job not found'];
    }
    $ownerEmail = $job['meta']['owner_email'] ?? '';
    if (!$ownerEmail) {
      http_response_code(404);
      return ['error' => 'Employer email not available'];
    }
    $mailer = new Mailer();
    $subject = 'Message from applicant';
    $body = "From: {$user['email']}\n\n" . $message;
    $mailer->send($ownerEmail, $subject, nl2br(htmlspecialchars($body, ENT_QUOTES)), $body);
    return ['ok' => true];
  }
}
