<?php
declare(strict_types=1);

namespace App\Models;

class JobModel {
  public function list(int $limit = 50): array {
    $pdo = $GLOBALS['DB_PDO'];
    $sql = "SELECT ID, post_title, post_date 
            FROM wp_posts 
            WHERE post_type IN ('post','job') AND post_status = 'publish' 
            ORDER BY post_date DESC 
            LIMIT :limit";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll();
  }
}
