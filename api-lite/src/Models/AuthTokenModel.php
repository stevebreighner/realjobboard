<?php
declare(strict_types=1);

namespace App\Models;

class AuthTokenModel {
  public function __construct() {
    $this->ensureTables();
  }

  private function ensureTables(): void {
    $pdo = $GLOBALS['DB_PDO'];
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_magic_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_email_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_pending_2fa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS jb_2fa_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        code_hash VARCHAR(128) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
  }

  public function createToken(string $table, int $userId, int $ttlMinutes): string {
    $pdo = $GLOBALS['DB_PDO'];
    $token = bin2hex(random_bytes(24));
    $expires = (new \DateTimeImmutable())->modify("+{$ttlMinutes} minutes");
    $stmt = $pdo->prepare("INSERT INTO {$table} (user_id, token, expires_at, created_at) VALUES (:user_id, :token, :expires, :created)");
    $stmt->execute([
      ':user_id' => $userId,
      ':token' => $token,
      ':expires' => $expires->format('Y-m-d H:i:s'),
      ':created' => date('Y-m-d H:i:s'),
    ]);
    return $token;
  }

  public function findValidToken(string $table, string $token): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM {$table} WHERE token = :token AND expires_at >= NOW() LIMIT 1");
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function consumeToken(string $table, string $token): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("DELETE FROM {$table} WHERE token = :token");
    $stmt->execute([':token' => $token]);
  }

  public function createPending2fa(int $userId, int $ttlMinutes = 10): string {
    return $this->createToken('jb_pending_2fa', $userId, $ttlMinutes);
  }

  public function findPending2fa(string $token): ?array {
    return $this->findValidToken('jb_pending_2fa', $token);
  }

  public function consumePending2fa(string $token): void {
    $this->consumeToken('jb_pending_2fa', $token);
  }

  public function createTwoFactorCode(int $userId, string $code, int $ttlMinutes = 10): void {
    $pdo = $GLOBALS['DB_PDO'];
    $hash = hash('sha256', $code);
    $expires = (new \DateTimeImmutable())->modify("+{$ttlMinutes} minutes");
    $stmt = $pdo->prepare("INSERT INTO jb_2fa_codes (user_id, code_hash, expires_at, created_at) VALUES (:user_id, :hash, :expires, :created)");
    $stmt->execute([
      ':user_id' => $userId,
      ':hash' => $hash,
      ':expires' => $expires->format('Y-m-d H:i:s'),
      ':created' => date('Y-m-d H:i:s'),
    ]);
  }

  public function verifyTwoFactorCode(int $userId, string $code): bool {
    $pdo = $GLOBALS['DB_PDO'];
    $hash = hash('sha256', $code);
    $stmt = $pdo->prepare("SELECT id FROM jb_2fa_codes WHERE user_id = :user_id AND code_hash = :hash AND expires_at >= NOW() LIMIT 1");
    $stmt->execute([':user_id' => $userId, ':hash' => $hash]);
    $id = $stmt->fetchColumn();
    if ($id) {
      $del = $pdo->prepare("DELETE FROM jb_2fa_codes WHERE user_id = :user_id");
      $del->execute([':user_id' => $userId]);
      return true;
    }
    return false;
  }
}
