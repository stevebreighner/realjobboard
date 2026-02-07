<?php
declare(strict_types=1);

namespace App\Models;

class EmailSubscriberModel {
  public function __construct() {
    $this->ensureTable();
  }

  private function ensureTable(): void {
    $pdo = $GLOBALS['DB_PDO'];
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_email_subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        email VARCHAR(191) NOT NULL,
        status VARCHAR(32) DEFAULT 'subscribed',
        subscribed_at DATETIME NOT NULL,
        last_activity DATETIME NOT NULL,
        UNIQUE KEY uniq_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
  }

  public function upsert(?int $userId, string $email): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      INSERT INTO jb_email_subscribers (user_id, email, status, subscribed_at, last_activity)
      VALUES (:user_id, :email, 'subscribed', :now, :now)
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        status = 'subscribed',
        last_activity = VALUES(last_activity)
    ");
    $now = date('Y-m-d H:i:s');
    $stmt->execute([
      ':user_id' => $userId,
      ':email' => $email,
      ':now' => $now,
    ]);
  }

  public function list(int $limit = 200): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      SELECT id, user_id, email, status, subscribed_at, last_activity
      FROM jb_email_subscribers
      ORDER BY last_activity DESC
      LIMIT :limit
    ");
    $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll() ?: [];
  }
}

