<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\CompanyModel;
use App\Services\AuthService;

class AdminCompanyController {
  private AuthService $auth;
  private CompanyModel $companies;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->companies = new CompanyModel();
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

  private function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  public function list(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $pdo = $GLOBALS['DB_PDO'];
    $rows = $pdo->query("
      SELECT c.*, COUNT(m.user_id) AS member_count
      FROM jb_companies c
      LEFT JOIN jb_company_members m ON m.company_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 200
    ")->fetchAll();
    return $rows ?: [];
  }

  public function detail(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
      http_response_code(422);
      return ['error' => 'Missing id'];
    }
    $company = $this->companies->findById($id);
    if (!$company) {
      http_response_code(404);
      return ['error' => 'Company not found'];
    }
    $members = $this->companies->listMembers($id);
    return ['company' => $company, 'members' => $members];
  }

  public function verify(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $id = (int) ($data['company_id'] ?? 0);
    $verified = (int) ($data['verified'] ?? 0) === 1;
    if (!$id) {
      http_response_code(422);
      return ['error' => 'Missing company_id'];
    }
    $this->companies->setVerified($id, $verified, (int) $user['id']);
    $company = $this->companies->findById($id);
    return ['company' => $company];
  }

  public function setMember(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $companyId = (int) ($data['company_id'] ?? 0);
    $userId = (int) ($data['user_id'] ?? 0);
    $role = trim((string) ($data['role'] ?? 'member')) ?: 'member';
    if (!$companyId || !$userId) {
      http_response_code(422);
      return ['error' => 'Missing company_id or user_id'];
    }
    $this->companies->setMemberRole($companyId, $userId, $role);
    return ['ok' => true];
  }

  public function removeMember(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $companyId = (int) ($data['company_id'] ?? 0);
    $userId = (int) ($data['user_id'] ?? 0);
    if (!$companyId || !$userId) {
      http_response_code(422);
      return ['error' => 'Missing company_id or user_id'];
    }
    $this->companies->removeMember($companyId, $userId);
    return ['ok' => true];
  }
}
