<?php
declare(strict_types=1);

namespace App\Models;

class ApplicationModel {
  public function __construct() {
    $this->ensureTable();
  }

  private function ensureTable(): void {
    $pdo = $GLOBALS['DB_PDO'];
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_job_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id INT NOT NULL,
        user_id INT NOT NULL,
        resume_url TEXT NULL,
        cover_url TEXT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'submitted',
        rank INT NOT NULL DEFAULT 0,
        match_score INT NOT NULL DEFAULT 0,
        pref_score INT NOT NULL DEFAULT 0,
        resume_text LONGTEXT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX (job_id),
        INDEX (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_job_application_meta (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NOT NULL,
        meta_key VARCHAR(120) NOT NULL,
        meta_value LONGTEXT NULL,
        iv VARCHAR(64) NULL,
        tag VARCHAR(64) NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        INDEX (application_id),
        INDEX (meta_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
  }

  public function countByJob(int $jobId): int {
    $pdo = $GLOBALS['DB_PDO'];
    $table = "jb_job_applications";
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM {$table} WHERE job_id = :job_id");
    $stmt->execute([':job_id' => $jobId]);
    return (int) $stmt->fetchColumn();
  }

  public function hasApplied(int $jobId, int $userId): bool {
    $pdo = $GLOBALS['DB_PDO'];
    $table = "jb_job_applications";
    $stmt = $pdo->prepare("SELECT id FROM {$table} WHERE job_id = :job_id AND user_id = :user_id LIMIT 1");
    $stmt->execute([':job_id' => $jobId, ':user_id' => $userId]);
    return (bool) $stmt->fetchColumn();
  }

  public function createApplication(int $jobId, int $userId, ?string $resumeUrl, ?string $coverUrl): int {
    $pdo = $GLOBALS['DB_PDO'];
    $table = "jb_job_applications";
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("
      INSERT INTO {$table} (job_id, user_id, resume_url, cover_url, status, created_at, updated_at)
      VALUES (:job_id, :user_id, :resume_url, :cover_url, 'submitted', :created_at, :updated_at)
    ");
    $stmt->execute([
      ':job_id' => $jobId,
      ':user_id' => $userId,
      ':resume_url' => $resumeUrl,
      ':cover_url' => $coverUrl,
      ':created_at' => $now,
      ':updated_at' => $now,
    ]);
    return (int) $pdo->lastInsertId();
  }

  public function listByUser(int $userId): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_job_applications WHERE user_id = :uid ORDER BY created_at DESC");
    $stmt->execute([':uid' => $userId]);
    return $stmt->fetchAll() ?: [];
  }

  public function listByJob(int $jobId): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_job_applications WHERE job_id = :job_id ORDER BY created_at DESC");
    $stmt->execute([':job_id' => $jobId]);
    return $stmt->fetchAll() ?: [];
  }

  public function markReviewingByJob(int $jobId): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("UPDATE jb_job_applications SET status = 'reviewing', updated_at = :updated WHERE job_id = :job_id AND status = 'submitted'");
    $stmt->execute([
      ':updated' => date('Y-m-d H:i:s'),
      ':job_id' => $jobId,
    ]);
  }

  public function updateStatus(int $jobId, int $userId, ?string $status, int $rank): void {
    $pdo = $GLOBALS['DB_PDO'];
    $status = $status ?: null;
    $stmt = $pdo->prepare("UPDATE jb_job_applications SET status = COALESCE(:status, status), rank = :rank, updated_at = :updated WHERE job_id = :job_id AND user_id = :user_id");
    $stmt->execute([
      ':status' => $status,
      ':rank' => $rank,
      ':updated' => date('Y-m-d H:i:s'),
      ':job_id' => $jobId,
      ':user_id' => $userId,
    ]);
  }

  public function remove(int $jobId, int $userId): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("DELETE FROM jb_job_applications WHERE job_id = :job_id AND user_id = :user_id");
    $stmt->execute([':job_id' => $jobId, ':user_id' => $userId]);
  }

  public function withdraw(int $jobId, int $userId): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("UPDATE jb_job_applications SET status = 'withdrawn', updated_at = :updated WHERE job_id = :job_id AND user_id = :user_id");
    $stmt->execute([':updated' => date('Y-m-d H:i:s'), ':job_id' => $jobId, ':user_id' => $userId]);
  }

  public function setMeta(int $appId, string $key, ?string $value, ?string $iv, ?string $tag): void {
    $pdo = $GLOBALS['DB_PDO'];
    $existing = $pdo->prepare("SELECT id FROM jb_job_application_meta WHERE application_id = :aid AND meta_key = :key LIMIT 1");
    $existing->execute([':aid' => $appId, ':key' => $key]);
    $id = $existing->fetchColumn();
    $now = date('Y-m-d H:i:s');
    if ($id) {
      $stmt = $pdo->prepare("UPDATE jb_job_application_meta SET meta_value = :val, iv = :iv, tag = :tag, updated_at = :updated WHERE id = :id");
      $stmt->execute([
        ':val' => $value,
        ':iv' => $iv,
        ':tag' => $tag,
        ':updated' => $now,
        ':id' => $id,
      ]);
      return;
    }
    $stmt = $pdo->prepare("INSERT INTO jb_job_application_meta (application_id, meta_key, meta_value, iv, tag, created_at, updated_at)
      VALUES (:aid, :key, :val, :iv, :tag, :created, :updated)");
    $stmt->execute([
      ':aid' => $appId,
      ':key' => $key,
      ':val' => $value,
      ':iv' => $iv,
      ':tag' => $tag,
      ':created' => $now,
      ':updated' => $now,
    ]);
  }

  public function getMetaByApplications(array $appIds, string $key): array {
    if (empty($appIds)) return [];
    $pdo = $GLOBALS['DB_PDO'];
    $placeholders = implode(',', array_fill(0, count($appIds), '?'));
    $stmt = $pdo->prepare("SELECT application_id, meta_value, iv, tag FROM jb_job_application_meta WHERE meta_key = ? AND application_id IN ({$placeholders})");
    $stmt->execute(array_merge([$key], $appIds));
    $rows = $stmt->fetchAll() ?: [];
    $byId = [];
    foreach ($rows as $row) {
      $byId[(int) $row['application_id']] = [
        'value' => $row['meta_value'] ?? '',
        'iv' => $row['iv'] ?? '',
        'tag' => $row['tag'] ?? '',
      ];
    }
    return $byId;
  }
}
