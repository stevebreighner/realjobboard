<?php
declare(strict_types=1);

namespace App\Models;

class JobModel {
  private function tableExists(string $table): bool {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare('SHOW TABLES LIKE :t');
    $stmt->execute([':t' => $table]);
    return (bool) $stmt->fetchColumn();
  }

  public function list(int $limit = 50): array {
    $pdo = $GLOBALS['DB_PDO'];
    $prefix = $GLOBALS['DB_PREFIX'] ?? 'wp_';
    if ($this->tableExists('jb_jobs')) {
      $sql = "SELECT id, title, created_at 
              FROM jb_jobs 
              WHERE status = 'publish'
              ORDER BY created_at DESC
              LIMIT :limit";
      $stmt = $pdo->prepare($sql);
      $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
      $stmt->execute();
      $rows = $stmt->fetchAll();
      if (!empty($rows)) {
        return $rows;
      }
    }

    $sql = "SELECT ID, post_title, post_date 
            FROM {$prefix}posts 
            WHERE post_type IN ('post','job') AND post_status = 'publish' 
            ORDER BY post_date DESC 
            LIMIT :limit";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
  }
}
