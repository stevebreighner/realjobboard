<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\AuditLogModel;

class AdminAuditController {
  private AuthService $auth;
  private AuditLogModel $audit;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->audit = new AuditLogModel();
  }

  private function requireAdmin(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return [];
    }
    $role = $user['role'] ?? '';
    if (!in_array($role, ['site_admin','administrator'], true)) {
      http_response_code(403);
      return [];
    }
    return $user;
  }

  public function list(): array {
    $admin = $this->requireAdmin();
    if (empty($admin)) return ['error' => 'Access denied'];
    return $this->audit->list(200);
  }
}
