<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\SettingsModel;

class DevFlagController {
  private AuthService $auth;
  private SettingsModel $settings;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->settings = new SettingsModel();
  }

  private function requireAdmin(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return [];
    }
    $role = $user['role'] ?? '';
    if (!in_array($role, ['site_admin', 'administrator'], true)) {
      http_response_code(403);
      return [];
    }
    return $user;
  }

  public function getFlags(): array {
    $val = $this->settings->get('dev_mode') ?? '0';
    $payment = $this->settings->get('jobs_require_payment') ?? '0';
    return ['dev_mode' => $val === '1', 'jobs_require_payment' => $payment === '1'];
  }

  public function adminFlags(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
      $val = $this->settings->get('dev_mode') ?? '0';
      $payment = $this->settings->get('jobs_require_payment') ?? '0';
    return ['dev_mode' => $val === '1', 'jobs_require_payment' => $payment === '1'];
    }
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $dev = !empty($data['dev_mode']);
    $payment = !empty($data['jobs_require_payment']);
    $this->settings->set('dev_mode', $dev ? '1' : '0');
    $this->settings->set('jobs_require_payment', $payment ? '1' : '0');
    return ['dev_mode' => $dev, 'jobs_require_payment' => $payment];
  }
}
