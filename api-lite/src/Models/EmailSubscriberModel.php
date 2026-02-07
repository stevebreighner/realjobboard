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
        unsubscribe_token VARCHAR(64) DEFAULT NULL,
        status VARCHAR(32) DEFAULT 'subscribed',
        subscribed_at DATETIME NOT NULL,
        last_activity DATETIME NOT NULL,
        UNIQUE KEY uniq_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    // Add columns if migrating from older table
    try {
      $cols = $pdo->query("SHOW COLUMNS FROM jb_email_subscribers")->fetchAll();
      $colNames = array_map(fn($c) => $c['Field'] ?? '', $cols ?: []);
      if (!in_array('unsubscribe_token', $colNames, true)) {
        $pdo->exec("ALTER TABLE jb_email_subscribers ADD COLUMN unsubscribe_token VARCHAR(64) DEFAULT NULL");
      }
      $indexes = $pdo->query("SHOW INDEX FROM jb_email_subscribers")->fetchAll();
      $hasTokenIndex = false;
      foreach ($indexes as $idx) {
        if (($idx['Column_name'] ?? '') === 'unsubscribe_token') {
          $hasTokenIndex = true;
          break;
        }
      }
      if (!$hasTokenIndex) {
        $pdo->exec("ALTER TABLE jb_email_subscribers ADD UNIQUE KEY uniq_unsub_token (unsubscribe_token)");
      }
    } catch (\Throwable $e) {
      // Ignore migration issues silently
    }
  }

  public function upsert(?int $userId, string $email): void {
    $pdo = $GLOBALS['DB_PDO'];
    $token = $this->getOrCreateToken($email);
    $stmt = $pdo->prepare("
      INSERT INTO jb_email_subscribers (user_id, email, unsubscribe_token, status, subscribed_at, last_activity)
      VALUES (:user_id, :email, :token, 'subscribed', :now, :now)
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        unsubscribe_token = VALUES(unsubscribe_token),
        status = 'subscribed',
        last_activity = VALUES(last_activity)
    ");
    $now = date('Y-m-d H:i:s');
    $stmt->execute([
      ':user_id' => $userId,
      ':email' => $email,
      ':token' => $token,
      ':now' => $now,
    ]);
  }

  public function getOrCreateToken(string $email): string {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT unsubscribe_token FROM jb_email_subscribers WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $token = (string) ($stmt->fetchColumn() ?: '');
    if ($token) return $token;
    $token = bin2hex(random_bytes(16));
    return $token;
  }

  public function findByToken(string $token): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_email_subscribers WHERE unsubscribe_token = :token LIMIT 1");
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function unsubscribeByToken(string $token): bool {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      UPDATE jb_email_subscribers
      SET status = 'unsubscribed', last_activity = :now
      WHERE unsubscribe_token = :token
    ");
    $stmt->execute([
      ':token' => $token,
      ':now' => date('Y-m-d H:i:s'),
    ]);
    return $stmt->rowCount() > 0;
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
