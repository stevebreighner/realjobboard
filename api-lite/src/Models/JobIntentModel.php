<?php
declare(strict_types=1);

namespace App\Models;

class JobIntentModel {
  public function create(array $data): array {
    $pdo = $GLOBALS['DB_PDO'];
    $now = date('Y-m-d H:i:s');
    $stmt = $pdo->prepare("
      INSERT INTO jb_job_intents (company_id, user_id, payload_json, tier, promo_code_id, stripe_session_id, status, created_at, updated_at)
      VALUES (:company_id, :user_id, :payload_json, :tier, :promo_code_id, :stripe_session_id, :status, :created_at, :updated_at)
    ");
    $stmt->execute([
      ':company_id' => $data['company_id'],
      ':user_id' => $data['user_id'],
      ':payload_json' => $data['payload_json'],
      ':tier' => $data['tier'],
      ':promo_code_id' => $data['promo_code_id'] ?? null,
      ':stripe_session_id' => $data['stripe_session_id'] ?? null,
      ':status' => $data['status'] ?? 'pending',
      ':created_at' => $now,
      ':updated_at' => $now,
    ]);
    return $this->findById((int) $pdo->lastInsertId());
  }

  public function updateSession(int $intentId, string $sessionId): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("UPDATE jb_job_intents SET stripe_session_id = :sid, updated_at = :now WHERE id = :id");
    $stmt->execute([':sid' => $sessionId, ':id' => $intentId, ':now' => date('Y-m-d H:i:s')]);
  }

  public function markCompleted(int $intentId): void {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("UPDATE jb_job_intents SET status = 'completed', updated_at = :now WHERE id = :id");
    $stmt->execute([':id' => $intentId, ':now' => date('Y-m-d H:i:s')]);
  }

  public function findById(int $id): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_job_intents WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function findBySession(string $sessionId): ?array {
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("SELECT * FROM jb_job_intents WHERE stripe_session_id = :sid LIMIT 1");
    $stmt->execute([':sid' => $sessionId]);
    $row = $stmt->fetch();
    return $row ?: null;
  }
}
