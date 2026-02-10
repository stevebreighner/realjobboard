<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\UserMetaModel;

class AdminUserController {
  private AuthService $auth;
  private UserMetaModel $meta;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->meta = new UserMetaModel();
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

  private function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  private function tableExists(string $table): bool {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare('SHOW TABLES LIKE :t');
    $stmt->execute([':t' => $table]);
    return (bool) $stmt->fetchColumn();
  }

  public function list(): array {
    $admin = $this->requireAdmin();
    if (empty($admin)) return ['error' => 'Access denied'];
    $pdo = $GLOBALS['DB_PDO'];
    $rows = $pdo->query("SELECT id, username, email, role, employer_verified FROM jb_users ORDER BY created_at DESC LIMIT 500")->fetchAll() ?: [];
    $result = [];
    foreach ($rows as $row) {
      $companyKey = $this->meta->getMeta((int) $row['id'], 'company_code') ?? '';
      $result[] = [
        'id' => (int) $row['id'],
        'username' => $row['username'],
        'email' => $row['email'],
        'roles' => [$row['role']],
        'employer_verified' => (int) ($row['employer_verified'] ?? 0) === 1,
        'company_key' => $companyKey,
      ];
    }
    return $result;
  }

  public function detail(): array {
    $admin = $this->requireAdmin();
    if (empty($admin)) return ['error' => 'Access denied'];
    $userId = (int) ($_GET['userId'] ?? 0);
    if (!$userId) {
      http_response_code(422);
      return ['error' => 'Missing userId'];
    }
    $user = $this->auth->getUserById($userId);
    if (empty($user)) {
      http_response_code(404);
      return ['error' => 'User not found'];
    }
    $metaKeys = ['company_code','company_id','company_name','company_site','company_email','temp_password'];
    $meta = [];
    foreach ($metaKeys as $k) {
      $meta[$k] = $this->meta->getMeta($userId, $k);
    }
    return [
      'id' => (int) $user['id'],
      'username' => $user['username'],
      'email' => $user['email'],
      'role' => $user['role'],
      'employer_verified' => (int) ($user['employer_verified'] ?? 0) === 1,
      'company' => $user['company_name'] ?? '',
      'company_email' => $user['company_email'] ?? '',
      'company_site' => $user['company_site'] ?? '',
      'meta' => $meta,
    ];
  }

  public function create(): array {
    $admin = $this->requireAdmin();
    if (empty($admin)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $username = trim((string) ($data['username'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $password = (string) ($data['password'] ?? '');
    $role = in_array($data['role'] ?? '', ['employee','employer','site_admin'], true) ? $data['role'] : 'employee';
    if (!$username || !$email || !$password) {
      http_response_code(422);
      return ['error' => 'Missing fields'];
    }
    $user = $this->auth->createUser([
      'username' => $username,
      'email' => $email,
      'password' => $password,
      'role' => $role,
      'email_verified' => 1,
      'employer_verified' => $role === 'employer' ? 0 : 1,
    ]);
    $this->meta->setMeta((int) $user['id'], 'temp_password', $password);
    return ['user' => $user];
  }

  public function update(): array {
    $admin = $this->requireAdmin();
    if (empty($admin)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $userId = (int) ($data['id'] ?? 0);
    if (!$userId) {
      http_response_code(422);
      return ['error' => 'Missing id'];
    }
    $pdo = $GLOBALS['DB_PDO'];
    $role = $data['role'] ?? null;
    $employerVerified = isset($data['employer_verified']) ? (int) !!$data['employer_verified'] : null;
    $companyName = isset($data['company']) ? trim((string) $data['company']) : null;
    $companySite = isset($data['company_site']) ? trim((string) $data['company_site']) : null;
    $companyKey = isset($data['company_key']) ? trim((string) $data['company_key']) : null;
    if ($employerVerified === 1 && !$companyName) {
      $employerVerified = 0;
    }
    $fields = [];
    $params = [':id' => $userId];
    if ($role && in_array($role, ['employee','employer','site_admin','administrator'], true)) {
      $fields[] = 'role = :role';
      $params[':role'] = $role;
    }
    if ($employerVerified !== null) {
      $fields[] = 'employer_verified = :ev';
      $params[':ev'] = $employerVerified;
    }
    if ($companyName !== null) {
      $fields[] = 'company_name = :company_name';
      $params[':company_name'] = $companyName;
    }
    if ($companySite !== null) {
      $fields[] = 'company_site = :company_site';
      $params[':company_site'] = $companySite;
    }
    if ($fields) {
      $sql = "UPDATE jb_users SET " . implode(', ', $fields) . " WHERE id = :id";
      $stmt = $pdo->prepare($sql);
      $stmt->execute($params);
    }
    if ($companyKey !== null) {
      $this->meta->setMeta($userId, 'company_code', $companyKey);
    }
    return ['ok' => true];
  }

  public function delete(): array {
    $admin = $this->requireAdmin();
    if (empty($admin)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $userId = (int) ($data['id'] ?? 0);
    if (!$userId) {
      http_response_code(422);
      return ['error' => 'Missing id'];
    }
    $pdo = $GLOBALS['DB_PDO'];
    $pdo->beginTransaction();
    try {
      if ($this->tableExists('jb_user_meta')) {
        $stmt = $pdo->prepare("DELETE FROM jb_user_meta WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
      }
      if ($this->tableExists('jb_sessions')) {
        $stmt = $pdo->prepare("DELETE FROM jb_sessions WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
      }
      if ($this->tableExists('jb_auth_tokens')) {
        $stmt = $pdo->prepare("DELETE FROM jb_auth_tokens WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
      }
      if ($this->tableExists('jb_user_files')) {
        $stmt = $pdo->prepare("DELETE FROM jb_user_files WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
      }
      $appIds = [];
      if ($this->tableExists('jb_job_applications')) {
        $stmt = $pdo->prepare("SELECT id FROM jb_job_applications WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
        $appIds = array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN));
      }
      if ($appIds && $this->tableExists('jb_job_application_meta')) {
        $in = implode(',', array_fill(0, count($appIds), '?'));
        $stmt = $pdo->prepare("DELETE FROM jb_job_application_meta WHERE application_id IN ({$in})");
        $stmt->execute($appIds);
      }
      if ($this->tableExists('jb_job_applications')) {
        $stmt = $pdo->prepare("DELETE FROM jb_job_applications WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
      }
      if ($this->tableExists('jb_saved_jobs')) {
        $stmt = $pdo->prepare("DELETE FROM jb_saved_jobs WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
      }
      if ($this->tableExists('jb_job_alerts')) {
        $stmt = $pdo->prepare("DELETE FROM jb_job_alerts WHERE user_id = :id");
        $stmt->execute([':id' => $userId]);
      }
      $ownedJobIds = [];
      if ($this->tableExists('jb_job_meta')) {
        $stmt = $pdo->prepare("SELECT job_id FROM jb_job_meta WHERE meta_key = 'owner_id' AND meta_value = :id");
        $stmt->execute([':id' => (string) $userId]);
        $ownedJobIds = array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN));
      }
      if ($ownedJobIds && $this->tableExists('jb_jobs')) {
        $in = implode(',', array_fill(0, count($ownedJobIds), '?'));
        $stmt = $pdo->prepare("DELETE FROM jb_jobs WHERE id IN ({$in})");
        $stmt->execute($ownedJobIds);
      }
      if ($this->tableExists('jb_job_meta')) {
        $stmt = $pdo->prepare("DELETE FROM jb_job_meta WHERE meta_key = 'owner_id' AND meta_value = :id");
        $stmt->execute([':id' => (string) $userId]);
      }
      $stmt = $pdo->prepare("DELETE FROM jb_users WHERE id = :id");
      $stmt->execute([':id' => $userId]);
      $pdo->commit();
    } catch (\Throwable $e) {
      $pdo->rollBack();
      http_response_code(500);
      return ['error' => 'Delete failed'];
    }
    return ['ok' => true];
  }

  public function exportUsers(): void {
    $admin = $this->requireAdmin();
    if (empty($admin)) {
      http_response_code(403);
      echo 'Access denied';
      return;
    }
    $pdo = $GLOBALS['DB_PDO'];
    $rows = $pdo->query("SELECT id, username, email, role, employer_verified, created_at FROM jb_users ORDER BY created_at DESC")->fetchAll();
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename=\"users.csv\"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['id','username','email','role','employer_verified','created_at']);
    foreach ($rows as $row) {
      fputcsv($out, $row);
    }
    fclose($out);
  }
}
