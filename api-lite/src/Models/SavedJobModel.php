<?php
declare(strict_types=1);

namespace App\Models;

class SavedJobModel {
  public function __construct() {
    $this->ensureTable();
  }

  private function ensureTable(): void {
    $pdo = $GLOBALS['DB_PDO'];
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_saved_jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        job_id INT NOT NULL,
        created_at DATETIME NOT NULL,
        UNIQUE KEY uniq_saved (user_id, job_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
  }

  public function listByUser(int $userId): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT job_id FROM jb_saved_jobs WHERE user_id = :uid ORDER BY created_at DESC");
    $stmt->execute([':uid' => $userId]);
    return array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN));
  }

  public function toggle(int $userId, int $jobId): bool {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT id FROM jb_saved_jobs WHERE user_id = :uid AND job_id = :jid LIMIT 1");
    $stmt->execute([':uid' => $userId, ':jid' => $jobId]);
    $id = $stmt->fetchColumn();
    if ($id) {
      $del = $pdo->prepare("DELETE FROM jb_saved_jobs WHERE id = :id");
      $del->execute([':id' => $id]);
      return false;
    }
    $ins = $pdo->prepare("INSERT INTO jb_saved_jobs (user_id, job_id, created_at) VALUES (:uid, :jid, :created)");
    $ins->execute([':uid' => $userId, ':jid' => $jobId, ':created' => date('Y-m-d H:i:s')]);
    return true;
  }
}
