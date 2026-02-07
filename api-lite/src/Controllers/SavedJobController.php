<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\SavedJobModel;

class SavedJobController {
  private AuthService $auth;
  private SavedJobModel $saved;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->saved = new SavedJobModel();
  }

  private function requireUser(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return [];
    }
    return $user;
  }

  public function list(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    return $this->saved->listByUser((int) $user['id']);
  }

  public function toggle(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    $jobId = (int) ($data['job_id'] ?? 0);
    if (!$jobId) {
      http_response_code(422);
      return ['error' => 'Missing job_id'];
    }
    $saved = $this->saved->toggle((int) $user['id'], $jobId);
    return ['saved' => $saved];
  }
}
