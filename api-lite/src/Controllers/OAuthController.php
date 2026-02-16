<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\OAuthService;
use App\Services\AuthService;
use App\Services\AdminNotificationService;
use App\Services\SiteNotificationService;
use App\Services\DeviceTrustService;
use App\Models\UserMetaModel;

class OAuthController {
  private OAuthService $oauth;
  private AuthService $auth;
  private UserMetaModel $meta;
  private SiteNotificationService $notify;
  private DeviceTrustService $devices;

  public function __construct() {
    $this->oauth = new OAuthService();
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->meta = new UserMetaModel();
    $this->notify = new SiteNotificationService($GLOBALS['DB_PDO']);
    $this->devices = new DeviceTrustService();
  }

  public function startGoogle(): void {
    if (!$this->oauth->isConfigured()) {
      http_response_code(500);
      echo 'Google OAuth not configured';
      return;
    }
    $state = bin2hex(random_bytes(16));
    $nonce = bin2hex(random_bytes(16));
    $this->setCookie('oauth_state', $state, 600);
    $this->setCookie('oauth_nonce', $nonce, 600);
    $url = $this->oauth->getAuthUrl($state, $nonce);
    header('Location: ' . $url);
    exit;
  }

  public function statusGoogle(): array {
    return [
      'configured' => $this->oauth->isConfigured(),
      'redirect_uri' => rtrim($this->getBaseUrl(), '/') . '/api/oauth/google/callback',
    ];
  }

  public function callbackGoogle(): void {
    $code = $_GET['code'] ?? '';
    $state = $_GET['state'] ?? '';
    $expected = $_COOKIE['oauth_state'] ?? '';
    if (!$code || !$state || !hash_equals((string) $expected, (string) $state)) {
      http_response_code(400);
      echo 'Invalid OAuth state';
      return;
    }
    $token = $this->oauth->exchangeCode((string) $code);
    $accessToken = $token['access_token'] ?? '';
    if (!$accessToken) {
      $devMode = ($_ENV['DEV_MODE'] ?? '') === '1';
      $err = $token['error_description'] ?? $token['error'] ?? 'OAuth token error';
      $redirectUri = $this->oauth->getRedirectUri();
      $clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? '';
      http_response_code(400);
      if ($devMode) {
        header('Content-Type: text/plain; charset=utf-8');
        echo "OAuth token error: {$err}\n";
        echo "redirect_uri={$redirectUri}\n";
        echo "client_id_set=" . (!empty($clientId) ? 'yes' : 'no') . "\n";
        echo "raw=" . json_encode($token);
      } else {
        echo 'OAuth token error';
      }
      return;
    }
    $info = $this->oauth->fetchUserInfo($accessToken);
    $email = $info['email'] ?? '';
    if (!$email) {
      http_response_code(400);
      echo 'OAuth email missing';
      return;
    }
    $user = $this->auth->getUserByEmailOrUsername($email);
    $isNew = false;
    if (empty($user)) {
      $username = $this->generateUsername((string) ($info['name'] ?? ''), $email);
      $user = $this->auth->createUser([
        'username' => $username,
        'email' => $email,
        'password' => bin2hex(random_bytes(8)),
        'role' => 'employee',
        'email_verified' => 1,
        'employer_verified' => 0,
      ]);
      $isNew = true;
      try {
        $notifier = new AdminNotificationService($GLOBALS['DB_PDO']);
        $notifier->notifyNewUser($user, 'oauth_google', [
          'provider' => 'google',
          'email_verified' => 1,
        ]);
      } catch (\Throwable $e) {
      }
      $this->notify->sendAccountCreated($user, null, 'oauth_google');
    }
    $this->meta->setMeta((int) $user['id'], 'oauth_google', '1');
    if ($isNew) {
      $this->meta->setMeta((int) $user['id'], 'needs_profile', '1');
    }
    $this->maybeStoreGoogleAvatar($info, (int) $user['id']);
    $this->auth->createSession((int) $user['id']);
    try {
      $device = $this->devices->registerLoginDevice((int) $user['id']);
      if (!empty($device['is_new'])) {
        $this->notify->sendNewDeviceSignIn($user, $device);
      }
    } catch (\Throwable $e) {
    }
    $this->clearCookie('oauth_state');
    $this->clearCookie('oauth_nonce');
    header('Location: ' . ($isNew ? '/#complete-profile' : '/#home'));
    exit;
  }

  private function setCookie(string $name, string $value, int $ttlSeconds): void {
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
      $secure = true;
    }
    setcookie($name, $value, [
      'expires' => time() + $ttlSeconds,
      'path' => '/',
      'secure' => $secure,
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
  }

  private function getBaseUrl(): string {
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $scheme = 'http';
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
      $scheme = 'https';
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
      $scheme = $_SERVER['HTTP_X_FORWARDED_PROTO'];
    }
    return $scheme . '://' . $host;
  }

  private function clearCookie(string $name): void {
    setcookie($name, '', [
      'expires' => time() - 3600,
      'path' => '/',
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
  }

  private function generateUsername(string $name, string $email): string {
    $base = trim($name);
    if ($base === '') {
      $base = strstr($email, '@', true) ?: 'user';
    }
    $slug = preg_replace('/[^a-z0-9]+/i', '.', strtolower($base));
    $slug = trim($slug ?? '', '.');
    if ($slug === '') $slug = 'user';
    $candidate = $slug;
    $i = 1;
    while (!empty($this->auth->getUserByEmailOrUsername($candidate))) {
      $candidate = $slug . $i;
      $i++;
      if ($i > 50) break;
    }
    return $candidate;
  }

  private function maybeStoreGoogleAvatar(array $info, int $userId): void {
    $picture = (string) ($info['picture'] ?? '');
    if ($picture === '') return;
    $existing = $this->meta->getMeta($userId, 'avatar_url');
    if (!empty($existing)) return;
    if (!preg_match('~^https://~i', $picture)) return;

    $parts = parse_url($picture);
    $host = strtolower((string) ($parts['host'] ?? ''));
    if ($host === '' || !preg_match('~(googleusercontent\.com|ggpht\.com)$~', $host)) {
      return;
    }

    $tmpFile = tempnam(sys_get_temp_dir(), 'gavatar_');
    if ($tmpFile === false) return;

    $maxBytes = 2 * 1024 * 1024;
    $downloaded = 0;
    $ch = curl_init($picture);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $fh = fopen($tmpFile, 'wb');
    if ($fh === false) {
      @curl_close($ch);
      @unlink($tmpFile);
      return;
    }
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function ($ch, $data) use ($fh, &$downloaded, $maxBytes) {
      $len = strlen($data);
      $downloaded += $len;
      if ($downloaded > $maxBytes) {
        return 0;
      }
      return fwrite($fh, $data);
    });
    curl_exec($ch);
    $curlErr = curl_error($ch);
    $contentType = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    fclose($fh);

    if ($curlErr !== '' || !file_exists($tmpFile) || filesize($tmpFile) === 0) {
      @unlink($tmpFile);
      return;
    }
    if (stripos($contentType, 'image/') !== 0) {
      @unlink($tmpFile);
      return;
    }

    $ext = 'jpg';
    if (stripos($contentType, 'png') !== false) $ext = 'png';
    if (stripos($contentType, 'webp') !== false) $ext = 'webp';
    if (stripos($contentType, 'gif') !== false) $ext = 'gif';

    $uploadDir = __DIR__ . '/../../../uploads/avatars';
    if (!is_dir($uploadDir)) {
      @mkdir($uploadDir, 0777, true);
    }
    @chmod($uploadDir, 0777);
    $fileName = 'avatar_' . $userId . '_google_' . time() . '.' . $ext;
    $dest = $uploadDir . '/' . $fileName;
    $moved = @rename($tmpFile, $dest);
    if (!$moved) {
      $moved = @copy($tmpFile, $dest);
      if ($moved) @unlink($tmpFile);
    }
    if (!$moved) {
      @unlink($tmpFile);
      return;
    }
    @chmod($dest, 0644);
    $this->meta->setMeta($userId, 'avatar_url', '/uploads/avatars/' . $fileName);
  }
}
