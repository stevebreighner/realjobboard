<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;

class AuthController {
  private AuthService $auth;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
  }

  private function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  public function register(): array {
    $data = $this->jsonInput();
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = (string) ($data['password'] ?? '');
    $role = $data['role'] === 'employer' ? 'employer' : 'employee';

    if (!$username || !$email || !$password) {
      http_response_code(422);
      return ['error' => 'Missing required fields'];
    }

    $existing = $this->auth->getUserByEmailOrUsername($email);
    if (!empty($existing)) {
      http_response_code(409);
      return ['error' => 'Email already exists'];
    }
    $existing = $this->auth->getUserByEmailOrUsername($username);
    if (!empty($existing)) {
      http_response_code(409);
      return ['error' => 'Username already exists'];
    }

    $user = $this->auth->createUser([
      'username' => $username,
      'email' => $email,
      'password' => $password,
      'role' => $role,
      'email_verified' => 1,
      'employer_verified' => $role === 'employer' ? 0 : 1,
      'company_name' => $data['company_name'] ?? null,
      'company_email' => $data['company_email'] ?? null,
      'company_site' => $data['company_site'] ?? null,
    ]);

    $this->auth->createSession((int) $user['id']);

    return [
      'message' => 'Registered',
      'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'roles' => [$user['role']],
      ]
    ];
  }

  public function login(): array {
    $data = $this->jsonInput();
    $login = trim($data['email'] ?? '');
    $password = (string) ($data['password'] ?? '');
    if (!$login || !$password) {
      http_response_code(422);
      return ['error' => 'Missing credentials'];
    }

    $user = $this->auth->getUserByEmailOrUsername($login);
    if (empty($user) || !$this->auth->validatePassword($user, $password)) {
      http_response_code(401);
      return ['error' => 'Invalid credentials'];
    }

    $this->auth->createSession((int) $user['id']);
    return [
      'message' => 'Login successful',
      'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'roles' => [$user['role']],
      ],
    ];
  }

  public function logout(): array {
    $this->auth->clearSession();
    return ['message' => 'Logged out'];
  }

  public function session(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    return [
      'id' => $user['id'],
      'username' => $user['username'],
      'email' => $user['email'],
      'roles' => [$user['role']],
    ];
  }
}
