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
    if ($fields) {
      $sql = "UPDATE jb_users SET " . implode(', ', $fields) . " WHERE id = :id";
      $stmt = $pdo->prepare($sql);
      $stmt->execute($params);
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
    $stmt = $pdo->prepare("DELETE FROM jb_users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
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
