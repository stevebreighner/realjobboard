<?php
declare(strict_types=1);

namespace App\Models;

class AuditLogModel {
  public function __construct() {
    $this->ensureSchema();
  }

  private function ensureSchema(): void {
    $pdo = $GLOBALS['DB_PDO'];
    $table = $pdo->query("SHOW TABLES LIKE 'jb_audit_log'")->fetch();
    if ($table) return;
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_audit_log (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED DEFAULT NULL,
        event_type VARCHAR(64) NOT NULL,
        label VARCHAR(255) DEFAULT NULL,
        meta_json TEXT DEFAULT NULL,
        ip VARCHAR(64) DEFAULT NULL,
        user_agent VARCHAR(255) DEFAULT NULL,
        created_at DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
  }

  public function log(?int $userId, string $eventType, ?string $label = null, array $meta = []): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      INSERT INTO jb_audit_log (user_id, event_type, label, meta_json, ip, user_agent, created_at)
      VALUES (:user_id, :event_type, :label, :meta_json, :ip, :user_agent, :created_at)
    ");
    $json = $meta ? json_encode($meta) : null;
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? null;
    $stmt->execute([
      ':user_id' => $userId,
      ':event_type' => $eventType,
      ':label' => $label,
      ':meta_json' => $json,
      ':ip' => $ip ?: null,
      ':user_agent' => $ua ? substr($ua, 0, 255) : null,
      ':created_at' => date('Y-m-d H:i:s'),
    ]);
  }

  public function list(int $limit = 200): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      SELECT id, user_id, event_type, label, meta_json, ip, created_at
      FROM jb_audit_log
      ORDER BY created_at DESC
      LIMIT :limit
    ");
    $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();
    if (!$rows) return [];
    return array_map(function($row) {
      $meta = [];
      if (!empty($row['meta_json'])) {
        $decoded = json_decode((string) $row['meta_json'], true);
        if (is_array($decoded)) $meta = $decoded;
      }
      $row['meta'] = $meta;
      unset($row['meta_json']);
      return $row;
    }, $rows);
  }
}

