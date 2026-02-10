<?php
declare(strict_types=1);

namespace App\Models;

class UserMetaModel {
  public function getMeta(int $userId, string $key): ?string {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT meta_value FROM jb_user_meta WHERE user_id = :user_id AND meta_key = :key LIMIT 1");
    $stmt->execute([':user_id' => $userId, ':key' => $key]);
    $val = $stmt->fetchColumn();
    return $val !== false ? (string) $val : null;
  }

  public function setMeta(int $userId, string $key, ?string $value): void {
    $pdo = $GLOBALS['DB_PDO'];
    $existing = $this->getMeta($userId, $key);
    if ($existing === null) {
      $stmt = $pdo->prepare("INSERT INTO jb_user_meta (user_id, meta_key, meta_value) VALUES (:user_id, :key, :val)");
      $stmt->execute([':user_id' => $userId, ':key' => $key, ':val' => $value]);
      return;
    }
    $stmt = $pdo->prepare("UPDATE jb_user_meta SET meta_value = :val WHERE user_id = :user_id AND meta_key = :key");
    $stmt->execute([':user_id' => $userId, ':key' => $key, ':val' => $value]);
  }
}
