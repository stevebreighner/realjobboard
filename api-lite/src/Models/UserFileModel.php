<?php
declare(strict_types=1);

namespace App\Models;

class UserFileModel {
  public function __construct() {
    $this->ensureTable();
  }

  private function ensureTable(): void {
    $pdo = $GLOBALS['DB_PDO'];
    $sql = "
      CREATE TABLE IF NOT EXISTS jb_user_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        kind VARCHAR(20) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(120) NOT NULL,
        file_size INT NOT NULL,
        storage_path VARCHAR(255) NOT NULL,
        iv VARCHAR(64) NOT NULL,
        tag VARCHAR(64) NOT NULL,
        access_token VARCHAR(64) NOT NULL,
        created_at DATETIME NOT NULL,
        INDEX (user_id),
        INDEX (access_token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    $pdo->exec($sql);
  }

  public function create(array $data): int {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      INSERT INTO jb_user_files
        (user_id, kind, file_name, mime_type, file_size, storage_path, iv, tag, access_token, created_at)
      VALUES
        (:user_id, :kind, :file_name, :mime_type, :file_size, :storage_path, :iv, :tag, :access_token, :created_at)
    ");
    $stmt->execute([
      ':user_id' => $data['user_id'],
      ':kind' => $data['kind'],
      ':file_name' => $data['file_name'],
      ':mime_type' => $data['mime_type'],
      ':file_size' => $data['file_size'],
      ':storage_path' => $data['storage_path'],
      ':iv' => $data['iv'],
      ':tag' => $data['tag'],
      ':access_token' => $data['access_token'],
      ':created_at' => $data['created_at'],
    ]);
    return (int) $pdo->lastInsertId();
  }

  public function listByUser(int $userId, string $kind): array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("
      SELECT id, file_name, mime_type, file_size, access_token, created_at
      FROM jb_user_files
      WHERE user_id = :user_id AND kind = :kind
      ORDER BY created_at DESC
    ");
    $stmt->execute([':user_id' => $userId, ':kind' => $kind]);
    return $stmt->fetchAll() ?: [];
  }

  public function findByToken(string $token): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_user_files WHERE access_token = :token LIMIT 1");
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function findById(int $id): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_user_files WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function deleteById(int $id, int $userId): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_user_files WHERE id = :id AND user_id = :user_id LIMIT 1");
    $stmt->execute([':id' => $id, ':user_id' => $userId]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $del = $pdo->prepare("DELETE FROM jb_user_files WHERE id = :id");
    $del->execute([':id' => $id]);
    return $row;
  }
}
