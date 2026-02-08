<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\PromoModel;
use App\Models\EmailSubscriberModel;
use App\Models\JobModel;
use App\Services\Mailer;
use App\Models\AuditLogModel;
use App\Models\SettingsModel;

class AdminController {
  private AuthService $auth;
  private PromoModel $promos;
  private EmailSubscriberModel $subscribers;
  private JobModel $jobs;
  private AuditLogModel $audit;
  private SettingsModel $settings;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->promos = new PromoModel();
    $this->subscribers = new EmailSubscriberModel();
    $this->jobs = new JobModel();
    $this->audit = new AuditLogModel();
    $this->settings = new SettingsModel();
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

  public function subscribersList(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    return $this->subscribers->list(200);
  }

  public function bizDevList(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $raw = $this->settings->get('biz_dev_targets') ?? '[]';
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
  }

  public function bizDevCreate(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $data = $this->jsonInput();
    $name = trim((string) ($data['name'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $notes = trim((string) ($data['notes'] ?? ''));
    $freePosts = max(1, (int) ($data['free_posts'] ?? 5));
    if (!$name && !$email) {
      http_response_code(422);
      return ['error' => 'Missing name or email'];
    }

    $code = $this->generateCode();
    $promo = $this->promos->create([
      'code' => $code,
      'percent_off' => 100,
      'is_free' => 1,
      'max_uses' => $freePosts,
      'expires_at' => null,
      'created_by' => $user['id'] ?? null,
    ]);

    $raw = $this->settings->get('biz_dev_targets') ?? '[]';
    $list = json_decode($raw, true);
    if (!is_array($list)) $list = [];
    $entry = [
      'id' => uniqid('bd_', true),
      'name' => $name,
      'email' => $email,
      'notes' => $notes,
      'promo_code' => $promo['code'] ?? $code,
      'free_posts' => $freePosts,
      'created_at' => date('c'),
    ];
    $list[] = $entry;
    $this->settings->set('biz_dev_targets', json_encode($list));

    return ['entry' => $entry];
  }

  public function sendDigest(): array {
    $user = $this->requireAdmin();
    if (empty($user)) return ['error' => 'Access denied'];
    $subscribers = $this->subscribers->list(1000);
    if (empty($subscribers)) {
      return ['sent' => 0];
    }
    $jobs = $this->jobs->list(10);
    $baseUrl = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
    $siteName = $_ENV['EMAIL_FROM_NAME'] ?? 'JobBoard';
    $mailer = new Mailer();
    $sent = 0;
    foreach ($subscribers as $sub) {
      if (($sub['status'] ?? '') !== 'subscribed') continue;
      $email = $sub['email'] ?? '';
      if (!$email) continue;
      $token = $this->subscribers->getOrCreateToken($email);
      $unsubscribeUrl = $baseUrl . '/api/unsubscribe?token=' . urlencode($token);
      $items = '';
      foreach ($jobs as $job) {
        $title = htmlspecialchars($job['title'] ?? 'Job', ENT_QUOTES);
        $jobUrl = $baseUrl . '/#list-detail?id=' . urlencode((string) ($job['id'] ?? ''));
        $items .= '<li style="margin:0 0 6px 0;"><a href="' . $jobUrl . '" style="color:#4f46e5;text-decoration:none;">' . $title . '</a></li>';
      }
      $html = '
        <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
            <h2 style="margin:0 0 12px 0;color:#0f172a;">New jobs this week</h2>
            <p style="margin:0 0 12px 0;color:#475569;">Here are a few fresh listings on ' . htmlspecialchars($siteName, ENT_QUOTES) . '.</p>
            <ul style="padding-left:18px;color:#0f172a;">' . $items . '</ul>
            <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">Unsubscribe: <a href="' . htmlspecialchars($unsubscribeUrl, ENT_QUOTES) . '" style="color:#64748b;">' . htmlspecialchars($unsubscribeUrl, ENT_QUOTES) . '</a></p>
          </div>
        </div>
      ';
      if ($mailer->send($email, $siteName . ' — Weekly job digest', $html)) {
        $sent++;
      }
    }
    $this->audit->log((int) ($user['id'] ?? 0), 'digest_sent', 'Weekly digest sent', [
      'count' => $sent,
    ]);
    return ['sent' => $sent];
  }
}
