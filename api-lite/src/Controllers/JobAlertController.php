<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\JobAlertModel;
use App\Models\EmailSubscriberModel;
use App\Services\Mailer;
use App\Models\AuditLogModel;

class JobAlertController {
  private AuthService $auth;
  private JobAlertModel $alerts;
  private EmailSubscriberModel $subscribers;
  private AuditLogModel $audit;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->alerts = new JobAlertModel();
    $this->subscribers = new EmailSubscriberModel();
    $this->audit = new AuditLogModel();
  }

  private function requireUser(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return [];
    }
    return $user;
  }

  public function list(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    return $this->alerts->listByUser((int) $user['id']);
  }

  public function create(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $label = trim((string) ($data['label'] ?? 'Alert'));
    $criteria = is_array($data['criteria'] ?? null) ? $data['criteria'] : [];
    $alerts = $this->alerts->create((int) $user['id'], $label, $criteria);

    $email = $user['email'] ?? '';
    if ($email) {
      $this->subscribers->upsert((int) $user['id'], $email);
      $token = $this->subscribers->getOrCreateToken($email);
      $siteName = $_ENV['SITE_NAME'] ?? ($_ENV['EMAIL_FROM_NAME'] ?? 'Site');
      $baseUrl = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
      $unsubscribeUrl = $baseUrl . '/api/unsubscribe?token=' . urlencode($token);
      $subject = $siteName . ' — Job alert saved';
      $html = '
        <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
            <h2 style="margin:0 0 12px 0;color:#0f172a;">Job alert saved</h2>
            <p style="margin:0 0 12px 0;color:#475569;">We saved your alert <strong>' . htmlspecialchars($label, ENT_QUOTES) . '</strong>.</p>
            <p style="margin:0;color:#64748b;font-size:13px;">You can manage alerts from your profile at any time.</p>
            <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">Unsubscribe: <a href="' . htmlspecialchars($unsubscribeUrl, ENT_QUOTES) . '" style="color:#64748b;">' . htmlspecialchars($unsubscribeUrl, ENT_QUOTES) . '</a></p>
          </div>
        </div>
      ';
      $mailer = new Mailer();
      $mailer->send($email, $subject, $html);
      $this->audit->log((int) $user['id'], 'job_alert_subscribed', 'Saved job alert', [
        'label' => $label,
      ]);
    }

    return ['alerts' => $alerts];
  }

  public function delete(): array {
    $user = $this->requireUser();
    if (empty($user)) return ['error' => 'Not logged in'];
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $alertId = (int) ($data['alert_id'] ?? 0);
    if (!$alertId) {
      http_response_code(422);
      return ['error' => 'Missing alert_id'];
    }
    $alerts = $this->alerts->delete((int) $user['id'], $alertId);
    return ['alerts' => $alerts];
  }
}
