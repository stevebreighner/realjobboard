<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\JobAlertModel;

class JobAlertController {
  private AuthService $auth;
  private JobAlertModel $alerts;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->alerts = new JobAlertModel();
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
    return $this->alerts->listByUser((int) $user['id']);
  }

  public function create(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $label = trim((string) ($data['label'] ?? 'Alert'));
    $criteria = is_array($data['criteria'] ?? null) ? $data['criteria'] : [];
    $alerts = $this->alerts->create((int) $user['id'], $label, $criteria);
    return ['alerts' => $alerts];
  }

  public function delete(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $alertId = (int) ($data['alert_id'] ?? 0);
    if (!$alertId) {
      http_response_code(422);
      return ['error' => 'Missing alert_id'];
    }
    $alerts = $this->alerts->delete((int) $user['id'], $alertId);
    return ['alerts' => $alerts];
  }
}
