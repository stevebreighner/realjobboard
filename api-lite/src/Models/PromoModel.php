<?php
declare(strict_types=1);

namespace App\Models;

class PromoModel {
  public function findByCode(string $code): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_promo_codes WHERE code = :code LIMIT 1");
    $stmt->execute([':code' => strtoupper(trim($code))]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function isValid(array $promo): bool {
    if (empty($promo)) return false;
    if (!empty($promo['expires_at'])) {
      $expires = strtotime($promo['expires_at']);
      if ($expires && $expires < time()) return false;
    }
    if (!empty($promo['max_uses']) && (int) $promo['uses'] >= (int) $promo['max_uses']) {
      return false;
    }
    return true;
  }

  public function incrementUses(int $promoId): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("UPDATE jb_promo_codes SET uses = uses + 1 WHERE id = :id");
    $stmt->execute([':id' => $promoId]);
  }

  public function create(array $data): array {
    $pdo = $GLOBALS['DB_PDO'];
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("
      INSERT INTO jb_promo_codes (code, percent_off, is_free, max_uses, uses, expires_at, created_at, created_by)
      VALUES (:code, :percent_off, :is_free, :max_uses, 0, :expires_at, :created_at, :created_by)
    ");
    $stmt->execute([
      ':code' => strtoupper(trim($data['code'])),
      ':percent_off' => (int) ($data['percent_off'] ?? 0),
      ':is_free' => (int) ($data['is_free'] ?? 0),
      ':max_uses' => $data['max_uses'] ?? null,
      ':expires_at' => $data['expires_at'] ?? null,
      ':created_at' => $now,
      ':created_by' => $data['created_by'] ?? null,
    ]);
    $id = (int) $pdo->lastInsertId();
    $stmt = $pdo->prepare("SELECT * FROM jb_promo_codes WHERE id = :id");
    $stmt->execute([':id' => $id]);
    return $stmt->fetch() ?: [];
  }
}
