<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\PromoModel;

class AdminController {
  private AuthService $auth;
  private PromoModel $promos;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->promos = new PromoModel();
  }

  private function requireAdmin(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return [];
    }
    $role = $user['role'] ?? '';
    if (!in_array($role, ['site_admin', 'administrator'], true)) {
      http_response_code(403);
      return [];
    }
    return $user;
  }

  private function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  public function promoList(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $pdo = $GLOBALS['DB_PDO'];
    $rows = $pdo->query("SELECT * FROM jb_promo_codes ORDER BY created_at DESC LIMIT 200")->fetchAll();
    return $rows ?: [];
  }

  public function promoCreate(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $discount = (int) ($data['discount'] ?? 0);
    $maxUses = isset($data['max_uses']) ? (int) $data['max_uses'] : null;
    $expiresAt = $data['expires_at'] ?? null;

    $percentOff = 0;
    $isFree = 0;
    if ($discount >= 100) {
      $isFree = 1;
      $percentOff = 100;
    } elseif ($discount > 0) {
      $percentOff = min(100, $discount);
    }

    $code = $data['code'] ?? null;
    if (!$code) {
      $code = $this->generateCode();
    }

    $promo = $this->promos->create([
      'code' => $code,
      'percent_off' => $percentOff,
      'is_free' => $isFree,
      'max_uses' => $maxUses,
      'expires_at' => $expiresAt,
      'created_by' => $user['id'] ?? null,
    ]);

    return ['promo' => $promo];
  }

  private function generateCode(): string {
    $suffix = strtoupper(bin2hex(random_bytes(3)));
    return 'EARLY-' . $suffix;
  }

  public function jobsList(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $pdo = $GLOBALS['DB_PDO'];
    $rows = $pdo->query("SELECT id, title, status, created_at FROM jb_jobs ORDER BY created_at DESC LIMIT 200")->fetchAll();
    return $rows ?: [];
  }

  public function jobUpdate(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $id = (int) ($data['id'] ?? 0);
    if (!$id) {
      http_response_code(422);
      return ['error' => 'Missing id'];
    }
    $title = trim((string) ($data['title'] ?? ''));
    $status = trim((string) ($data['status'] ?? ''));
    if ($status !== 'publish' && $status !== 'draft') {
      $status = 'draft';
    }
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("UPDATE jb_jobs SET title = :title, status = :status, updated_at = :now WHERE id = :id");
    $stmt->execute([
      ':title' => $title ?: 'Untitled',
      ':status' => $status,
      ':now' => date('Y-m-d H:i:s'),
      ':id' => $id,
    ]);
    return ['ok' => true];
  }

  public function jobDelete(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $id = (int) ($data['id'] ?? 0);
    if (!$id) {
      http_response_code(422);
      return ['error' => 'Missing id'];
    }
    $pdo = $GLOBALS['DB_PDO'];
    $stmt = $pdo->prepare("DELETE FROM jb_jobs WHERE id = :id");
    $stmt->execute([':id' => $id]);
    return ['ok' => true];
  }

  public function errorLog(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $logFile = __DIR__ . '/../../logs/api-error.log';
    if (!file_exists($logFile)) {
      return ['lines' => []];
    }
    $lines = @file($logFile, FILE_IGNORE_NEW_LINES);
    if ($lines === false) {
      return ['lines' => []];
    }
    $tail = array_slice($lines, -200);
    return ['lines' => $tail];
  }

  public function errorLogDownload(): void {
    $user = $this->requireAdmin();
    if (empty($user)) {
      http_response_code(403);
      echo json_encode(['error' => 'Access denied']);
      return;
    }
    $logFile = __DIR__ . '/../../logs/api-error.log';
    if (!file_exists($logFile)) {
      http_response_code(404);
      echo 'Log not found';
      return;
    }
    header('Content-Type: text/plain; charset=utf-8');
    header('Content-Disposition: attachment; filename="api-error.log"');
    readfile($logFile);
  }

  public function exportJobs(): void {
    $user = $this->requireAdmin();
    if (empty($user)) {
      http_response_code(403);
      echo 'Access denied';
      return;
    }
    $pdo = $GLOBALS['DB_PDO'];
    $rows = $pdo->query("SELECT id, title, status, created_at FROM jb_jobs ORDER BY created_at DESC")->fetchAll();
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename=\"jobs.csv\"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['id','title','status','created_at']);
    foreach ($rows as $row) {
      fputcsv($out, $row);
    }
    fclose($out);
  }
}
