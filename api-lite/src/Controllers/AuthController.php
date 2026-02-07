<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Services\RateLimiter;
use App\Services\Mailer;
use App\Models\CompanyModel;
use App\Models\UserMetaModel;
use App\Models\AuthTokenModel;
use App\Models\SettingsModel;

class AuthController {
  private AuthService $auth;
  private AuthTokenModel $tokens;
  private SettingsModel $settings;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->tokens = new AuthTokenModel();
    $this->settings = new SettingsModel();
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
    $token = $data['turnstile_token'] ?? '';
    if (!$token) return false;
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

  public function register(): array {
    if ($blocked = $this->rateLimit('register', 5, 600)) {
      return $blocked;
    }
    $data = $this->jsonInput();
    if (!$this->passesTurnstile($data)) {
      http_response_code(403);
      return ['error' => 'Captcha required'];
    }
    $username = trim($data['username'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = (string) ($data['password'] ?? '');
    $role = $data['role'] === 'employer' ? 'employer' : 'employee';
    $companyName = trim($data['company'] ?? $data['company_name'] ?? '');
    $companySite = trim($data['company_site'] ?? '');
    $companyEmail = trim($data['company_email'] ?? '');

    if (!$username || !$email || !$password) {
      http_response_code(422);
      return ['error' => 'Missing required fields'];
    }

    $devMode = ($_ENV['DEV_MODE'] ?? '') === '1' || ($this->settings->get('dev_mode') === '1');
    if (!$devMode) {
      $strongEnough =
        strlen($password) >= 10 &&
        preg_match('/[a-z]/', $password) &&
        preg_match('/[A-Z]/', $password) &&
        preg_match('/\\d/', $password) &&
        preg_match('/[^A-Za-z0-9]/', $password);
      if (!$strongEnough) {
        http_response_code(422);
        return ['error' => 'Password must be at least 10 characters and include uppercase, lowercase, number, and symbol.'];
      }
    }

    $existing = $this->auth->getUserByEmailOrUsername($email);
    if (!empty($existing)) {
      http_response_code(409);
      return ['error' => 'Email already exists'];
    }
    $existing = $this->auth->getUserByEmailOrUsername($username);
    if (!empty($existing)) {
      http_response_code(409);
      return ['error' => 'Username already exists'];
    }

    $user = $this->auth->createUser([
      'username' => $username,
      'email' => $email,
      'password' => $password,
      'role' => $role,
      'email_verified' => 1,
      'employer_verified' => $role === 'employer' ? 0 : 1,
      'company_name' => $companyName ?: null,
      'company_email' => $companyEmail ?: null,
      'company_site' => $companySite ?: null,
    ]);

    $this->auth->createSession((int) $user['id']);

    if ($role === 'employer' && $companyName) {
      $companyModel = new CompanyModel();
      $userMeta = new UserMetaModel();
      $existingCompany = $companyModel->findByName($companyName);
      $company = $existingCompany;
      if (!$company) {
        $domain = '';
        if ($companyEmail && strpos($companyEmail, '@') !== false) {
          $domain = explode('@', $companyEmail)[1] ?? '';
        } elseif ($companySite) {
          $host = parse_url($companySite, PHP_URL_HOST);
          $domain = $host ? preg_replace('/^www\\./', '', $host) : '';
        }
        $company = $companyModel->create([
          'name' => $companyName,
          'slug' => $companyModel->slugify($companyName),
          'code' => $companyModel->generateCode(),
          'domain' => $domain ?: null,
        ]);
      }
      if ($company) {
        $userMeta->setMeta((int) $user['id'], 'company_id', (string) $company['id']);
        $userMeta->setMeta((int) $user['id'], 'company_code', (string) $company['code']);
        $userMeta->setMeta((int) $user['id'], 'company_name', (string) $company['name']);
        $companyModel->addMember((int) $company['id'], (int) $user['id'], 'owner');
      }
    }

    return [
      'message' => 'Registered',
      'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'roles' => [$user['role']],
      ]
    ];
  }

  public function login(): array {
    if ($blocked = $this->rateLimit('login', 8, 300)) {
      return $blocked;
    }
    $data = $this->jsonInput();
    if (!$this->passesTurnstile($data)) {
      http_response_code(403);
      return ['error' => 'Captcha required'];
    }
    $login = trim($data['email'] ?? '');
    $password = (string) ($data['password'] ?? '');
    if (!$login || !$password) {
      http_response_code(422);
      return ['error' => 'Missing credentials'];
    }

    $user = $this->auth->getUserByEmailOrUsername($login);
    if (empty($user)) {
      $wpUser = $this->auth->getWpUserByEmailOrUsername($login);
      if (!empty($wpUser) && $this->auth->validatePassword($wpUser, $password)) {
        $user = $this->auth->createUserFromWp($wpUser);
      }
    }
    if (empty($user) || !$this->auth->validatePassword($user, $password)) {
      http_response_code(401);
      return ['error' => 'Invalid credentials'];
    }
    $meta = new UserMetaModel();
    $twofaEnabled = $meta->getMeta((int) $user['id'], 'twofa_enabled') === '1';
    if ($twofaEnabled) {
      $pending = $this->tokens->createPending2fa((int) $user['id']);
      $this->setPendingCookie($pending);
      return [
        'twoFARequired' => true,
        'message' => '2FA required',
      ];
    }

    $this->auth->createSession((int) $user['id']);
    return [
      'message' => 'Login successful',
      'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'roles' => [$user['role']],
      ],
    ];
  }

  public function logout(): array {
    $this->auth->clearSession();
    return ['message' => 'Logged out'];
  }

  public function session(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    return [
      'id' => $user['id'],
      'username' => $user['username'],
      'email' => $user['email'],
      'roles' => [$user['role']],
    ];
  }

  public function updatePassword(): array {
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    $data = $this->jsonInput();
    $current = (string) ($data['current_password'] ?? '');
    $new = (string) ($data['new_password'] ?? '');
    if (!$current || !$new) {
      http_response_code(422);
      return ['error' => 'Missing fields'];
    }
    if (!$this->auth->validatePassword($user, $current)) {
      http_response_code(401);
      return ['error' => 'Invalid current password'];
    }
    $devMode = ($_ENV['DEV_MODE'] ?? '') === '1' || ($this->settings->get('dev_mode') === '1');
    if (!$devMode) {
      $strongEnough =
        strlen($new) >= 10 &&
        preg_match('/[a-z]/', $new) &&
        preg_match('/[A-Z]/', $new) &&
        preg_match('/\\d/', $new) &&
        preg_match('/[^A-Za-z0-9]/', $new);
      if (!$strongEnough) {
        http_response_code(422);
        return ['error' => 'Password must be at least 10 characters and include uppercase, lowercase, number, and symbol.'];
      }
    }
    $hash = password_hash($new, PASSWORD_BCRYPT);
    $stmt = $GLOBALS['DB_PDO']->prepare("UPDATE jb_users SET password_hash = :hash WHERE id = :id");
    $stmt->execute([':hash' => $hash, ':id' => (int) $user['id']]);
    return ['message' => 'Password updated'];
  }

  public function forgotPassword(): array {
    if ($blocked = $this->rateLimit('forgot', 5, 600)) {
      return $blocked;
    }
    $data = $this->jsonInput();
    if (!$this->passesTurnstile($data)) {
      http_response_code(403);
      return ['error' => 'Captcha required'];
    }
    $email = trim($data['email'] ?? '');
    if (!$email) {
      http_response_code(422);
      return ['error' => 'Email required'];
    }

    $user = $this->auth->getUserByEmailOrUsername($email);
    if (empty($user)) {
      $wpUser = $this->auth->getWpUserByEmailOrUsername($email);
      if (!empty($wpUser)) {
        $user = $this->auth->createUserFromWp($wpUser);
      }
    }
    if (empty($user)) {
      return ['message' => 'If that email exists, a reset link has been sent.'];
    }

    $token = $this->tokens->createToken('jb_password_resets', (int) $user['id'], 30);
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $link = "https://{$host}/#reset-password?token={$token}";
    $mailer = new Mailer();
    $subject = 'Reset your password';
    $html = "<p>Use the link below to reset your password:</p><p><a href=\"{$link}\">Reset Password</a></p>";
    $mailer->send($user['email'], $subject, $html, "Reset password: {$link}");
    return ['message' => 'If that email exists, a reset link has been sent.'];
  }

  public function resetPassword(): array {
    if ($blocked = $this->rateLimit('reset', 5, 600)) {
      return $blocked;
    }
    $data = $this->jsonInput();
    if (!$this->passesTurnstile($data)) {
      http_response_code(403);
      return ['error' => 'Captcha required'];
    }
    $token = trim($data['token'] ?? '');
    $password = (string) ($data['password'] ?? '');
    if (!$token || !$password) {
      http_response_code(422);
      return ['error' => 'Missing token or password'];
    }

    $devMode = ($_ENV['DEV_MODE'] ?? '') === '1' || ($this->settings->get('dev_mode') === '1');
    if (!$devMode) {
      $strongEnough =
        strlen($password) >= 10 &&
        preg_match('/[a-z]/', $password) &&
        preg_match('/[A-Z]/', $password) &&
        preg_match('/\\d/', $password) &&
        preg_match('/[^A-Za-z0-9]/', $password);
      if (!$strongEnough) {
        http_response_code(422);
        return ['error' => 'Password must be at least 10 characters and include uppercase, lowercase, number, and symbol.'];
      }
    }

    $row = $this->tokens->findValidToken('jb_password_resets', $token);
    if (!$row) {
      http_response_code(400);
      return ['error' => 'Invalid or expired token'];
    }
    $userId = (int) $row['user_id'];
    $user = $this->auth->getUserById($userId);
    if ($user && !empty($user['password_hash']) && password_verify($password, $user['password_hash'])) {
      http_response_code(422);
      return ['error' => 'New password must be different from your current password'];
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $GLOBALS['DB_PDO']->prepare("UPDATE jb_users SET password_hash = :hash WHERE id = :id");
    $stmt->execute([':hash' => $hash, ':id' => $userId]);
    $this->tokens->consumeToken('jb_password_resets', $token);
    return ['message' => 'Password reset successfully'];
  }

  public function resendVerification(): array {
    if ($blocked = $this->rateLimit('verify_email', 5, 600)) {
      return $blocked;
    }
    $data = $this->jsonInput();
    if (!$this->passesTurnstile($data)) {
      http_response_code(403);
      return ['error' => 'Captcha required'];
    }
    $email = trim($data['email'] ?? '');
    if (!$email) {
      http_response_code(422);
      return ['error' => 'Email required'];
    }
    $user = $this->auth->getUserByEmailOrUsername($email);
    if (empty($user)) {
      return ['message' => 'If that email exists, a verification link has been sent.'];
    }
    $token = $this->tokens->createToken('jb_email_verifications', (int) $user['id'], 60);
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $link = "https://{$host}/#verify-email?token={$token}";
    $mailer = new Mailer();
    $subject = 'Verify your email';
    $html = "<p>Verify your email by clicking this link:</p><p><a href=\"{$link}\">Verify Email</a></p>";
    $mailer->send($user['email'], $subject, $html, "Verify email: {$link}");
    return ['message' => 'If that email exists, a verification link has been sent.'];
  }

  public function verifyEmail(): array {
    $token = trim($_GET['token'] ?? '');
    if (!$token) {
      http_response_code(422);
      return ['error' => 'Missing token'];
    }
    $row = $this->tokens->findValidToken('jb_email_verifications', $token);
    if (!$row) {
      http_response_code(400);
      return ['error' => 'Invalid or expired token'];
    }
    $userId = (int) $row['user_id'];
    $stmt = $GLOBALS['DB_PDO']->prepare("UPDATE jb_users SET email_verified = 1 WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $this->tokens->consumeToken('jb_email_verifications', $token);
    return ['message' => 'Email verified'];
  }

  public function start2fa(): array {
    if ($blocked = $this->rateLimit('2fa_start', 5, 600)) {
      return $blocked;
    }
    $pendingToken = $_COOKIE['jb_pending_2fa'] ?? '';
    if (!$pendingToken) {
      http_response_code(403);
      return ['error' => 'No pending 2FA session'];
    }
    $pending = $this->tokens->findPending2fa($pendingToken);
    if (!$pending) {
      http_response_code(403);
      return ['error' => 'Expired 2FA session'];
    }
    $userId = (int) $pending['user_id'];
    $user = $this->auth->getUserById($userId);
    if (empty($user)) {
      http_response_code(404);
      return ['error' => 'User not found'];
    }
    $code = (string) random_int(100000, 999999);
    $this->tokens->createTwoFactorCode($userId, $code, 10);
    $mailer = new Mailer();
    $subject = 'Your login code';
    $html = "<p>Your 2FA code is:</p><h2>{$code}</h2><p>This code expires in 10 minutes.</p>";
    $mailer->send($user['email'], $subject, $html, "Your 2FA code: {$code}");
    return ['message' => '2FA code sent'];
  }

  public function verify2fa(): array {
    if ($blocked = $this->rateLimit('2fa_verify', 10, 600)) {
      return $blocked;
    }
    $data = $this->jsonInput();
    $code = trim($data['code'] ?? '');
    if (!$code) {
      http_response_code(422);
      return ['error' => 'Code required'];
    }
    $pendingToken = $_COOKIE['jb_pending_2fa'] ?? '';
    if (!$pendingToken) {
      http_response_code(403);
      return ['error' => 'No pending 2FA session'];
    }
    $pending = $this->tokens->findPending2fa($pendingToken);
    if (!$pending) {
      http_response_code(403);
      return ['error' => 'Expired 2FA session'];
    }
    $userId = (int) $pending['user_id'];
    if (!$this->tokens->verifyTwoFactorCode($userId, $code)) {
      http_response_code(401);
      return ['error' => 'Invalid code'];
    }
    $this->tokens->consumePending2fa($pendingToken);
    $this->clearPendingCookie();
    $this->auth->createSession($userId);
    $user = $this->auth->getUserById($userId);
    return [
      'message' => '2FA verified',
      'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'roles' => [$user['role']],
      ],
    ];
  }

  public function magicLink(): array {
    if ($blocked = $this->rateLimit('magic_link', 5, 600)) {
      return $blocked;
    }
    $data = $this->jsonInput();
    if (!$this->passesTurnstile($data)) {
      http_response_code(403);
      return ['error' => 'Captcha required'];
    }
    $email = trim($data['email'] ?? '');
    if (!$email) {
      http_response_code(422);
      return ['error' => 'Email required'];
    }
    $user = $this->auth->getUserByEmailOrUsername($email);
    if (empty($user)) {
      $wpUser = $this->auth->getWpUserByEmailOrUsername($email);
      if (!empty($wpUser)) {
        $user = $this->auth->createUserFromWp($wpUser);
      }
    }
    if (empty($user)) {
      return ['message' => 'If that email exists, a link has been sent.'];
    }
    $token = $this->tokens->createToken('jb_magic_links', (int) $user['id'], 20);
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $link = "https://{$host}/#magic-login?token={$token}";
    $mailer = new Mailer();
    $subject = 'Your magic login link';
    $html = "<p>Click to log in:</p><p><a href=\"{$link}\">Log in</a></p>";
    $mailer->send($user['email'], $subject, $html, "Magic link: {$link}");
    return ['message' => 'If that email exists, a link has been sent.'];
  }

  public function magicLogin(): array {
    $data = $this->jsonInput();
    $token = trim($data['token'] ?? ($_GET['token'] ?? ''));
    if (!$token) {
      http_response_code(422);
      return ['error' => 'Missing token'];
    }
    $row = $this->tokens->findValidToken('jb_magic_links', $token);
    if (!$row) {
      http_response_code(400);
      return ['error' => 'Invalid or expired token'];
    }
    $userId = (int) $row['user_id'];
    $this->tokens->consumeToken('jb_magic_links', $token);
    $this->auth->createSession($userId);
    $user = $this->auth->getUserById($userId);
    return [
      'message' => 'Logged in',
      'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'roles' => [$user['role']],
      ],
    ];
  }

  private function setPendingCookie(string $token): void {
    $secure = false;
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
      $secure = true;
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
      $secure = true;
    }
    setcookie('jb_pending_2fa', $token, [
      'expires' => time() + 900,
      'path' => '/',
      'secure' => $secure,
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
  }

  private function clearPendingCookie(): void {
    $secure = false;
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
      $secure = true;
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
      $secure = true;
    }
    setcookie('jb_pending_2fa', '', [
      'expires' => time() - 3600,
      'path' => '/',
      'secure' => $secure,
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
  }
}
