<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;

class TrackingController {
  private AuthService $auth;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->ensureSchema();
  }

  private function ensureSchema(): void {
    $pdo = $GLOBALS['DB_PDO'];
    $table = $pdo->query("SHOW TABLES LIKE 'jb_tracking_events'")->fetch();
    if ($table) return;
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_tracking_events (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        event VARCHAR(64) NOT NULL,
        path VARCHAR(255) NOT NULL,
        referrer VARCHAR(255) DEFAULT NULL,
        user_id INT UNSIGNED DEFAULT NULL,
        ip VARCHAR(64) DEFAULT NULL,
        user_agent VARCHAR(255) DEFAULT NULL,
        created_at DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
  }

  public function track(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) $data = [];
    $event = trim((string) ($data['event'] ?? 'pageview'));
    $path = trim((string) ($data['path'] ?? ''));
    if ($path === '') {
      http_response_code(422);
      return ['error' => 'Missing path'];
    }
    $referrer = trim((string) ($data['referrer'] ?? ''));
    $user = $this->auth->getSessionUser();
    $userId = $user ? (int) $user['id'] : null;
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      INSERT INTO jb_tracking_events (event, path, referrer, user_id, ip, user_agent, created_at)
      VALUES (:event, :path, :referrer, :user_id, :ip, :user_agent, :created_at)
    ");
    $stmt->execute([
      ':event' => $event ?: 'pageview',
      ':path' => $path,
      ':referrer' => $referrer ?: null,
      ':user_id' => $userId,
      ':ip' => $ip ?: null,
      ':user_agent' => $ua ? substr($ua, 0, 255) : null,
      ':created_at' => date('Y-m-d H:i:s'),
    ]);

    return ['ok' => true];
  }

  public function list(): array {
    $auth = $this->auth->getSessionUser();
    if (empty($auth)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    $role = $auth['role'] ?? '';
    if (!in_array($role, ['site_admin', 'administrator'], true)) {
      http_response_code(403);
      return ['error' => 'Access denied'];
    }
    $pdo = $GLOBALS['DB_PDO'];
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 200;
    if ($limit < 1) $limit = 200;
    if ($limit > 2000) $limit = 2000;

    $rows = $pdo->query("
      SELECT id, event, path, referrer, user_id, created_at
      FROM jb_tracking_events
      ORDER BY created_at DESC
      LIMIT {$limit}
    ")->fetchAll();
    return $rows ?: [];
  }
}
