<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\RateLimiter;
use App\Services\SiteNotificationService;
use App\Models\SettingsModel;
use App\Models\AuditLogModel;

class SupportController {
  private SettingsModel $settings;
  private AuditLogModel $audit;
  private SiteNotificationService $notify;

  public function __construct() {
    $this->settings = new SettingsModel();
    $this->audit = new AuditLogModel();
    $this->notify = new SiteNotificationService($GLOBALS['DB_PDO']);
  }

  private function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  private function rateLimit(string $action, int $limit, int $windowSeconds): ?array {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $key = "{$action}:{$ip}";
    $limiter = new RateLimiter($GLOBALS['DB_PDO']);
    if (!$limiter->check($key, $limit, $windowSeconds)) {
      http_response_code(429);
      return ['error' => 'Too many requests. Please try again later.'];
    }
    return null;
  }

  private function passesTurnstile(array $data): bool {
    $devMode = ($_ENV['DEV_MODE'] ?? '') === '1' || ($this->settings->get('dev_mode') === '1');
    if ($devMode) return true;
    $siteKey = $_ENV['TURNSTILE_SITE_KEY'] ?? '';
    $secret = $_ENV['TURNSTILE_SECRET_KEY'] ?? '';
    if (!$siteKey || !$secret) return true;
    $token = (string) ($data['turnstile_token'] ?? '');
    if ($token === '') return true; // keep support form usable without widget
    $payload = http_build_query([
      'secret' => $secret,
      'response' => $token,
      'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    $context = stream_context_create([
      'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => $payload,
        'timeout' => 6,
      ],
    ]);
    $resp = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $context);
    if ($resp === false) return false;
    $json = json_decode($resp, true);
    return !empty($json['success']);
  }

  public function contact(): array {
    if ($blocked = $this->rateLimit('support_contact', 6, 600)) {
      return $blocked;
    }
    $data = $this->jsonInput();
    if (!$this->passesTurnstile($data)) {
      http_response_code(403);
      return ['error' => 'Captcha required'];
    }

    $name = trim((string) ($data['name'] ?? ''));
    $email = trim((string) ($data['email'] ?? ''));
    $subject = trim((string) ($data['subject'] ?? ''));
    $message = trim((string) ($data['message'] ?? ''));
    $context = trim((string) ($data['context'] ?? ''));
    $type = trim((string) ($data['type'] ?? 'contact'));

    if ($name === '' || $email === '' || $message === '') {
      http_response_code(422);
      return ['error' => 'Missing required fields'];
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      http_response_code(422);
      return ['error' => 'Invalid email'];
    }

    $payload = [
      'name' => substr($name, 0, 120),
      'email' => substr($email, 0, 255),
      'subject' => substr($subject !== '' ? $subject : 'Support', 0, 200),
      'message' => substr($message, 0, 5000),
      'context' => substr($context, 0, 120),
      'type' => substr($type, 0, 60),
    ];

    $sentAdmins = $this->notify->sendSupportToAdmins($payload);
    $sentUser = $this->notify->sendSupportConfirmation($payload['email'], $payload['name'], $payload['subject']);

    $this->audit->log(null, 'support_contact', 'Support form submitted', [
      'email' => $payload['email'],
      'subject' => $payload['subject'],
      'context' => $payload['context'],
      'type' => $payload['type'],
      'admin_recipients' => $sentAdmins,
      'user_confirmation' => $sentUser ? 1 : 0,
    ]);

    return [
      'ok' => true,
      'message' => 'Message sent. A confirmation email has been sent to you.',
    ];
  }
}
