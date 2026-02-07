<?php
declare(strict_types=1);

namespace App\Services;

class RateLimiter {
  private \PDO $pdo;

  public function __construct(\PDO $pdo) {
    $this->pdo = $pdo;
    $this->ensureTable();
  }

  private function ensureTable(): void {
    $sql = "
      CREATE TABLE IF NOT EXISTS jb_rate_limits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rl_key VARCHAR(191) NOT NULL UNIQUE,
        rl_window INT NOT NULL,
        rl_count INT NOT NULL DEFAULT 0,
        rl_reset_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $this->pdo->exec($sql);
  }

  public function check(string $key, int $limit, int $windowSeconds): bool {
    $now = new \DateTimeImmutable();
    $resetAt = $now->modify("+{$windowSeconds} seconds");

    $stmt = $this->pdo->prepare("SELECT rl_count, rl_reset_at FROM jb_rate_limits WHERE rl_key = :key LIMIT 1");
    $stmt->execute([':key' => $key]);
    $row = $stmt->fetch(\PDO::FETCH_ASSOC);

    if (!$row) {
      $insert = $this->pdo->prepare("
        INSERT INTO jb_rate_limits (rl_key, rl_window, rl_count, rl_reset_at, created_at, updated_at)
        VALUES (:key, :window, 1, :reset_at, :created_at, :updated_at)
      ");
      $insert->execute([
        ':key' => $key,
        ':window' => $windowSeconds,
        ':reset_at' => $resetAt->format('Y-m-d H:i:s'),
        ':created_at' => $now->format('Y-m-d H:i:s'),
        ':updated_at' => $now->format('Y-m-d H:i:s'),
      ]);
      return true;
    }

    $resetTime = new \DateTimeImmutable($row['rl_reset_at']);
    if ($resetTime <= $now) {
      $update = $this->pdo->prepare("
        UPDATE jb_rate_limits
        SET rl_count = 1, rl_reset_at = :reset_at, rl_window = :window, updated_at = :updated_at
        WHERE rl_key = :key
      ");
      $update->execute([
        ':reset_at' => $resetAt->format('Y-m-d H:i:s'),
        ':window' => $windowSeconds,
        ':updated_at' => $now->format('Y-m-d H:i:s'),
        ':key' => $key,
      ]);
      return true;
    }

    $count = (int) $row['rl_count'];
    if ($count >= $limit) {
      return false;
    }

    $update = $this->pdo->prepare("
      UPDATE jb_rate_limits
      SET rl_count = rl_count + 1, updated_at = :updated_at
      WHERE rl_key = :key
    ");
    $update->execute([
      ':updated_at' => $now->format('Y-m-d H:i:s'),
      ':key' => $key,
    ]);
    return true;
  }
}
