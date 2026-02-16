<?php
declare(strict_types=1);

namespace App\Services;

use PDO;

class SiteNotificationService {
  private Mailer $mailer;
  private BrandingService $brand;
  private PDO $pdo;

  public function __construct(PDO $pdo) {
    $this->mailer = new Mailer();
    $this->brand = new BrandingService();
    $this->pdo = $pdo;
  }

  public function sendAccountCreated(array $user, ?string $verifyLink = null, string $source = 'register'): bool {
    $to = trim((string) ($user['email'] ?? ''));
    if ($to === '') return false;
    $siteName = $this->brand->siteName();
    $support = $this->brand->supportEmail();
    $subject = $siteName . ' - Account created';
    $username = htmlspecialchars((string) ($user['username'] ?? ''), ENT_QUOTES);
    $src = htmlspecialchars($source, ENT_QUOTES);
    $html = '<p>Your account was created successfully.</p>
      <ul>
        <li><strong>Username:</strong> ' . $username . '</li>
        <li><strong>Source:</strong> ' . $src . '</li>
      </ul>';
    if ($verifyLink) {
      $safe = htmlspecialchars($verifyLink, ENT_QUOTES);
      $html .= '<p>Please verify your email to unlock all features:</p>
        <p><a href="' . $safe . '">Verify Email</a></p>';
    }
    $html .= '<p>If this was not you, reset your password immediately and contact support at '
      . htmlspecialchars($support, ENT_QUOTES) . '.</p>';
    return $this->mailer->send($to, $subject, $html);
  }

  public function sendVerificationEmail(array $user, string $verifyLink): bool {
    $to = trim((string) ($user['email'] ?? ''));
    if ($to === '') return false;
    $siteName = $this->brand->siteName();
    $support = $this->brand->supportEmail();
    $subject = $siteName . ' - Verify your email';
    $safe = htmlspecialchars($verifyLink, ENT_QUOTES);
    $html = '<p>Verify your email address to continue:</p>
      <p><a href="' . $safe . '">Verify Email</a></p>
      <p>If this was not you, ignore this email or contact support at ' . htmlspecialchars($support, ENT_QUOTES) . '.</p>';
    return $this->mailer->send($to, $subject, $html);
  }

  public function sendForgotPassword(array $user, string $resetLink): bool {
    $to = trim((string) ($user['email'] ?? ''));
    if ($to === '') return false;
    $siteName = $this->brand->siteName();
    $support = $this->brand->supportEmail();
    $subject = $siteName . ' - Password reset requested';
    $safe = htmlspecialchars($resetLink, ENT_QUOTES);
    $html = '<p>We received a password reset request for your account.</p>
      <p><a href="' . $safe . '">Reset Password</a></p>
      <p>If this was not you, ignore this email. Your password will stay unchanged.</p>
      <p>Need help? ' . htmlspecialchars($support, ENT_QUOTES) . '</p>';
    return $this->mailer->send($to, $subject, $html);
  }

  public function sendPasswordChanged(array $user): bool {
    $to = trim((string) ($user['email'] ?? ''));
    if ($to === '') return false;
    $siteName = $this->brand->siteName();
    $support = $this->brand->supportEmail();
    $resetUrl = $this->brand->siteUrl() . '/#forgot-password';
    $subject = $siteName . ' - Password changed';
    $html = '<p>Your password was changed successfully.</p>
      <p>If this was not you, reset your password immediately: <a href="' . htmlspecialchars($resetUrl, ENT_QUOTES) . '">Reset now</a></p>
      <p>Contact support at ' . htmlspecialchars($support, ENT_QUOTES) . '.</p>';
    return $this->mailer->send($to, $subject, $html);
  }

  public function sendTwoFactorCode(array $user, string $code): bool {
    $to = trim((string) ($user['email'] ?? ''));
    if ($to === '') return false;
    $siteName = $this->brand->siteName();
    $subject = $siteName . ' - Your login code';
    $safeCode = htmlspecialchars($code, ENT_QUOTES);
    $html = '<p>Your 2FA code is:</p><h2>' . $safeCode . '</h2><p>This code expires in 10 minutes.</p>';
    return $this->mailer->send($to, $subject, $html);
  }

  public function sendMagicLink(array $user, string $link): bool {
    $to = trim((string) ($user['email'] ?? ''));
    if ($to === '') return false;
    $siteName = $this->brand->siteName();
    $support = $this->brand->supportEmail();
    $subject = $siteName . ' - Magic login link';
    $safe = htmlspecialchars($link, ENT_QUOTES);
    $html = '<p>Use this one-time link to sign in:</p>
      <p><a href="' . $safe . '">Log in now</a></p>
      <p>If this was not you, ignore this email and contact support at ' . htmlspecialchars($support, ENT_QUOTES) . '.</p>';
    return $this->mailer->send($to, $subject, $html);
  }

  public function sendNewDeviceSignIn(array $user, array $device): bool {
    $to = trim((string) ($user['email'] ?? ''));
    if ($to === '') return false;
    $siteName = $this->brand->siteName();
    $support = $this->brand->supportEmail();
    $resetUrl = $this->brand->siteUrl() . '/#forgot-password';
    $subject = $siteName . ' - New sign-in detected';
    $seenAt = htmlspecialchars((string) ($device['seen_at'] ?? date('c')), ENT_QUOTES);
    $ip = htmlspecialchars((string) ($device['ip'] ?? '(unknown)'), ENT_QUOTES);
    $ua = htmlspecialchars((string) ($device['ua'] ?? '(unknown)'), ENT_QUOTES);
    $html = '<p>We detected a sign-in from a new device.</p>
      <ul>
        <li><strong>Time:</strong> ' . $seenAt . '</li>
        <li><strong>Network:</strong> ' . $ip . '</li>
        <li><strong>Device:</strong> ' . $ua . '</li>
      </ul>
      <p>If this was not you, reset your password now: <a href="' . htmlspecialchars($resetUrl, ENT_QUOTES) . '">Reset Password</a>.</p>
      <p>Need help? ' . htmlspecialchars($support, ENT_QUOTES) . '</p>';
    return $this->mailer->send($to, $subject, $html);
  }

  public function sendApplicationReceived(array $user, int $jobId, string $jobTitle = '', string $company = ''): bool {
    $to = trim((string) ($user['email'] ?? ''));
    if ($to === '') return false;
    $siteName = $this->brand->siteName();
    $subject = $siteName . ' - Application received';
    $jobTitleSafe = htmlspecialchars($jobTitle !== '' ? $jobTitle : 'Job #' . $jobId, ENT_QUOTES);
    $companySafe = htmlspecialchars($company, ENT_QUOTES);
    $html = '<p>We received your application.</p>
      <ul>
        <li><strong>Job:</strong> ' . $jobTitleSafe . '</li>
        ' . ($companySafe !== '' ? '<li><strong>Company:</strong> ' . $companySafe . '</li>' : '') . '
        <li><strong>Reference:</strong> #' . (int) $jobId . '</li>
      </ul>
      <p>If this was not you, contact support right away.</p>';
    return $this->mailer->send($to, $subject, $html);
  }

  public function sendJobCreated(array $user, int $jobId, string $title, string $company = ''): bool {
    $to = trim((string) ($user['email'] ?? ''));
    if ($to === '') return false;
    $siteName = $this->brand->siteName();
    $subject = $siteName . ' - Job post received';
    $jobUrl = $this->brand->siteUrl() . '/#my-job-post-detail?id=' . $jobId;
    $html = '<p>Your job post was received.</p>
      <ul>
        <li><strong>Title:</strong> ' . htmlspecialchars($title, ENT_QUOTES) . '</li>
        ' . ($company !== '' ? '<li><strong>Company:</strong> ' . htmlspecialchars($company, ENT_QUOTES) . '</li>' : '') . '
        <li><strong>Reference:</strong> #' . $jobId . '</li>
      </ul>
      <p>Manage post: <a href="' . htmlspecialchars($jobUrl, ENT_QUOTES) . '">Open job</a></p>';
    return $this->mailer->send($to, $subject, $html);
  }

  public function sendSupportConfirmation(string $email, string $name, string $subjectLine): bool {
    $to = trim($email);
    if ($to === '') return false;
    $siteName = $this->brand->siteName();
    $subject = $siteName . ' - Support request received';
    $safeName = htmlspecialchars($name !== '' ? $name : 'there', ENT_QUOTES);
    $safeSubject = htmlspecialchars($subjectLine !== '' ? $subjectLine : 'Support', ENT_QUOTES);
    $support = $this->brand->supportEmail();
    $html = '<p>Hi ' . $safeName . ',</p>
      <p>We received your support request and will follow up soon.</p>
      <p><strong>Subject:</strong> ' . $safeSubject . '</p>
      <p>If you did not submit this request, please email us at ' . htmlspecialchars($support, ENT_QUOTES) . '.</p>';
    return $this->mailer->send($to, $subject, $html);
  }

  public function sendSupportToAdmins(array $payload): int {
    $emails = $this->adminEmails();
    if (!$emails) return 0;
    $siteName = $this->brand->siteName();
    $subject = $siteName . ' - Support message: ' . (($payload['subject'] ?? '') ?: 'General');
    $html = '<p>New support form submission received.</p><ul>'
      . '<li><strong>Name:</strong> ' . htmlspecialchars((string) ($payload['name'] ?? ''), ENT_QUOTES) . '</li>'
      . '<li><strong>Email:</strong> ' . htmlspecialchars((string) ($payload['email'] ?? ''), ENT_QUOTES) . '</li>'
      . '<li><strong>Subject:</strong> ' . htmlspecialchars((string) ($payload['subject'] ?? ''), ENT_QUOTES) . '</li>'
      . '<li><strong>Context:</strong> ' . htmlspecialchars((string) ($payload['context'] ?? ''), ENT_QUOTES) . '</li>'
      . '<li><strong>Type:</strong> ' . htmlspecialchars((string) ($payload['type'] ?? ''), ENT_QUOTES) . '</li>'
      . '</ul><p><strong>Message</strong><br>'
      . nl2br(htmlspecialchars((string) ($payload['message'] ?? ''), ENT_QUOTES)) . '</p>';
    $sent = 0;
    foreach ($emails as $to) {
      if ($this->mailer->send($to, $subject, $html)) {
        $sent++;
      }
    }
    return $sent;
  }

  private function adminEmails(): array {
    $rows = $this->pdo->query("SELECT email FROM jb_users WHERE role IN ('site_admin','administrator')")->fetchAll() ?: [];
    $emails = array_values(array_filter(array_map(fn($r) => trim((string) ($r['email'] ?? '')), $rows)));
    return array_values(array_unique($emails));
  }
}
