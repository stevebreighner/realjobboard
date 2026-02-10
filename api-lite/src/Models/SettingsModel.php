<?php
declare(strict_types=1);

namespace App\Models;

class SettingsModel {
  public function __construct() {
    $this->ensureTable();
  }

  private function ensureTable(): void {
    $pdo = $GLOBALS['DB_PDO'];
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(191) NOT NULL UNIQUE,
        setting_value TEXT NULL,
        updated_at DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
  }

  public function get(string $key): ?string {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT setting_value FROM jb_settings WHERE setting_key = :key LIMIT 1");
    $stmt->execute([':key' => $key]);
    $val = $stmt->fetchColumn();
    return $val !== false ? (string) $val : null;
  }

  public function set(string $key, ?string $value): void {
    $pdo = $GLOBALS['DB_PDO'];
    $existing = $this->get($key);
    if ($existing === null) {
      $stmt = $pdo->prepare("INSERT INTO jb_settings (setting_key, setting_value, updated_at) VALUES (:key, :val, :updated)");
      $stmt->execute([':key' => $key, ':val' => $value, ':updated' => date('Y-m-d H:i:s')]);
      return;
    }
    $stmt = $pdo->prepare("UPDATE jb_settings SET setting_value = :val, updated_at = :updated WHERE setting_key = :key");
    $stmt->execute([':key' => $key, ':val' => $value, ':updated' => date('Y-m-d H:i:s')]);
  }
}
