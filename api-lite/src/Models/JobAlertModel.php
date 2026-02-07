<?php
declare(strict_types=1);

namespace App\Models;

class JobAlertModel {
  public function __construct() {
    $this->ensureTable();
  }

  private function ensureTable(): void {
    $pdo = $GLOBALS['DB_PDO'];
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_job_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        label VARCHAR(191) NOT NULL,
        criteria_json TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
  }

  public function listByUser(int $userId): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT id, label, criteria_json, created_at FROM jb_job_alerts WHERE user_id = :uid ORDER BY created_at DESC");
    $stmt->execute([':uid' => $userId]);
    $rows = $stmt->fetchAll() ?: [];
    return array_map(function (array $row): array {
      return [
        'id' => (int) $row['id'],
        'label' => $row['label'] ?? '',
        'criteria' => json_decode($row['criteria_json'] ?? '{}', true) ?: [],
        'created_at' => $row['created_at'] ?? '',
      ];
    }, $rows);
  }

  public function create(int $userId, string $label, array $criteria): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("INSERT INTO jb_job_alerts (user_id, label, criteria_json, created_at) VALUES (:uid, :label, :criteria, :created)");
    $stmt->execute([
      ':uid' => $userId,
      ':label' => $label,
      ':criteria' => json_encode($criteria),
      ':created' => date('Y-m-d H:i:s'),
    ]);
    return $this->listByUser($userId);
  }

  public function delete(int $userId, int $alertId): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("DELETE FROM jb_job_alerts WHERE id = :id AND user_id = :uid");
    $stmt->execute([':id' => $alertId, ':uid' => $userId]);
    return $this->listByUser($userId);
  }
}
