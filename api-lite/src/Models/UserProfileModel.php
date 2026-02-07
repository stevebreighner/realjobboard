<?php
declare(strict_types=1);

namespace App\Models;

class UserProfileModel {
  public function findWpUserId(string $email, string $username): ?int {
    $pdo = $GLOBALS['DB_PDO'];
    $prefix = $GLOBALS['DB_PREFIX'] ?? 'wp_';
    $usersTable = "{$prefix}users";
    $stmt = $pdo->prepare("SELECT ID FROM {$usersTable} WHERE user_email = :email OR user_login = :username LIMIT 1");
    $stmt->execute([':email' => $email, ':username' => $username]);
    $id = $stmt->fetchColumn();
    return $id ? (int) $id : null;
  }

  public function getResumes(int $wpUserId): array {
    $pdo = $GLOBALS['DB_PDO'];
    $prefix = $GLOBALS['DB_PREFIX'] ?? 'wp_';
    $table = "{$prefix}user_resumes";
    $stmt = $pdo->prepare("SELECT id, file_name, file_url, created_at FROM {$table} WHERE user_id = :user_id ORDER BY created_at DESC");
    $stmt->execute([':user_id' => $wpUserId]);
    $rows = $stmt->fetchAll();
    return array_map(function (array $row): array {
      $time = $row['created_at'] ? strtotime($row['created_at']) : null;
      return [
        'id' => (int) $row['id'],
        'name' => $row['file_name'] ?: 'Resume',
        'url' => $row['file_url'] ?: '',
        'time' => $time ?: time(),
      ];
    }, $rows);
  }

  public function getMeta(int $userId, array $keys): array {
    if (empty($keys)) return [];
    $pdo = $GLOBALS['DB_PDO'];
    $placeholders = [];
    $params = [':user_id' => $userId];
    foreach ($keys as $i => $key) {
      $ph = ':k' . $i;
      $placeholders[] = $ph;
      $params[$ph] = $key;
    }
    $table = 'jb_user_meta';
    $sql = "SELECT meta_key, meta_value FROM {$table} WHERE user_id = :user_id AND meta_key IN (" . implode(',', $placeholders) . ")";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    $meta = [];
    foreach ($rows as $row) {
      $meta[$row['meta_key']] = $row['meta_value'];
    }
    return $meta;
  }

  public function setMeta(int $userId, string $key, ?string $value): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT id FROM jb_user_meta WHERE user_id = :user_id AND meta_key = :key LIMIT 1");
    $stmt->execute([':user_id' => $userId, ':key' => $key]);
    $exists = $stmt->fetchColumn();
    if ($exists) {
      $update = $pdo->prepare("UPDATE jb_user_meta SET meta_value = :val WHERE user_id = :user_id AND meta_key = :key");
      $update->execute([':val' => $value, ':user_id' => $userId, ':key' => $key]);
      return;
    }
    $insert = $pdo->prepare("INSERT INTO jb_user_meta (user_id, meta_key, meta_value) VALUES (:user_id, :key, :val)");
    $insert->execute([':user_id' => $userId, ':key' => $key, ':val' => $value]);
  }
}
