<?php
declare(strict_types=1);

namespace App\Services;

use PDO;

class AdminNotificationService {
  private PDO $pdo;
  private Mailer $mailer;
  private BrandingService $brand;

  public function __construct(PDO $pdo) {
    $this->pdo = $pdo;
    $this->mailer = new Mailer();
    $this->brand = new BrandingService();
  }

  private function adminEmails(): array {
    $rows = $this->pdo->query("SELECT email FROM jb_users WHERE role IN ('site_admin','administrator')")->fetchAll() ?: [];
    $emails = array_values(array_filter(array_map(fn($r) => $r['email'] ?? '', $rows)));
    return array_values(array_unique($emails));
  }

  public function notifyNewUser(array $user, string $source = 'register', array $context = []): void {
    $emails = $this->adminEmails();
    if (!$emails) return;

    $siteName = $this->brand->siteName();
    $subject = $siteName . ' - New account created';

    $adminUrl = $this->brand->adminUrl();

    $username = htmlspecialchars((string) ($user['username'] ?? ''), ENT_QUOTES);
    $email = htmlspecialchars((string) ($user['email'] ?? ''), ENT_QUOTES);
    $role = htmlspecialchars((string) ($user['role'] ?? ''), ENT_QUOTES);
    $userId = (int) ($user['id'] ?? 0);
    $createdAt = htmlspecialchars((string) ($user['created_at'] ?? ''), ENT_QUOTES);

    $ip = htmlspecialchars((string) ($_SERVER['REMOTE_ADDR'] ?? ''), ENT_QUOTES);
    $ua = htmlspecialchars((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), ENT_QUOTES);
    $sourceSafe = htmlspecialchars($source, ENT_QUOTES);
    $ctxJson = $context ? htmlspecialchars(json_encode($context, JSON_UNESCAPED_SLASHES), ENT_QUOTES) : '';

    $html = '
      <p>A new account was created.</p>
      <ul>
        <li><strong>ID:</strong> ' . $userId . '</li>
        <li><strong>Username:</strong> ' . $username . '</li>
        <li><strong>Email:</strong> ' . $email . '</li>
        <li><strong>Role:</strong> ' . $role . '</li>
        <li><strong>Created:</strong> ' . ($createdAt ?: date('Y-m-d H:i:s')) . '</li>
        <li><strong>Source:</strong> ' . $sourceSafe . '</li>
      </ul>
      <p style="margin-top:12px;"><strong>Request info</strong></p>
      <ul>
        <li><strong>IP:</strong> ' . ($ip ?: '(unknown)') . '</li>
        <li><strong>User agent:</strong> ' . ($ua ?: '(unknown)') . '</li>
      </ul>
      ' . ($ctxJson ? '<p style="margin-top:12px;"><strong>Context</strong><br><code style="font-size:12px;">' . $ctxJson . '</code></p>' : '') . '
      <p style="margin-top:12px;">Review in admin: <a href="' . htmlspecialchars($adminUrl, ENT_QUOTES) . '">' . htmlspecialchars($adminUrl, ENT_QUOTES) . '</a></p>
    ';

    foreach ($emails as $to) {
      $this->mailer->send($to, $subject, $html);
    }
  }
}
