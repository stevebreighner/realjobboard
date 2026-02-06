<?php
declare(strict_types=1);

namespace App\Services;

use PDO;

class AuthService {
  private PDO $pdo;
  private string $sessionCookie;
  private int $sessionHours;

  public function __construct(PDO $pdo, string $sessionCookie = 'jb_session', int $sessionHours = 72) {
    $this->pdo = $pdo;
    $this->sessionCookie = $sessionCookie;
    $this->sessionHours = $sessionHours;
  }

  public function createUser(array $data): array {
    $now = date('Y-m-d H:i:s');
    $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);

    $stmt = $this->pdo->prepare("
      INSERT INTO jb_users (username, email, password_hash, role, email_verified, employer_verified, company_name, company_email, company_site, created_at, updated_at)
      VALUES (:username, :email, :password_hash, :role, :email_verified, :employer_verified, :company_name, :company_email, :company_site, :created_at, :updated_at)
    ");
    $stmt->execute([
      ':username' => $data['username'],
      ':email' => $data['email'],
      ':password_hash' => $passwordHash,
      ':role' => $data['role'],
      ':email_verified' => $data['email_verified'] ?? 0,
      ':employer_verified' => $data['employer_verified'] ?? 0,
      ':company_name' => $data['company_name'] ?? null,
      ':company_email' => $data['company_email'] ?? null,
      ':company_site' => $data['company_site'] ?? null,
      ':created_at' => $now,
      ':updated_at' => $now,
    ]);

    $id = (int) $this->pdo->lastInsertId();
    return $this->getUserById($id);
  }

  public function getUserById(int $userId): array {
    $stmt = $this->pdo->prepare("SELECT * FROM jb_users WHERE id = :id");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ?: [];
  }

  public function getUserByEmailOrUsername(string $value): array {
    $stmt = $this->pdo->prepare("SELECT * FROM jb_users WHERE email = :val OR username = :val");
    $stmt->execute([':val' => $value]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ?: [];
  }

  public function validatePassword(array $user, string $password): bool {
    if (!isset($user['password_hash'])) return false;
    $hash = $user['password_hash'];
    if ($this->startsWith($hash, '$2y$') || $this->startsWith($hash, '$2a$') || $this->startsWith($hash, '$2b$')) {
      return password_verify($password, $hash);
    }
    if ($this->startsWith($hash, '$P$') || $this->startsWith($hash, '$H$')) {
      return $this->verifyWpHash($password, $hash);
    }
    return password_verify($password, $hash);
  }

  private function startsWith(string $haystack, string $needle): bool {
    if ($needle === '') return true;
    return strncmp($haystack, $needle, strlen($needle)) === 0;
  }

  private function verifyWpHash(string $password, string $storedHash): bool {
    $itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    if (strlen($storedHash) < 34) return false;

    $countLog2 = strpos($itoa64, $storedHash[3]);
    if ($countLog2 < 7 || $countLog2 > 30) return false;
    $count = 1 << $countLog2;
    $salt = substr($storedHash, 4, 8);
    if (strlen($salt) !== 8) return false;

    $hash = md5($salt . $password, true);
    do {
      $hash = md5($hash . $password, true);
    } while (--$count);

    $encoded = $this->encode64($hash, 16, $itoa64);
    $check = substr($storedHash, 0, 12) . $encoded;
    return hash_equals($storedHash, $check);
  }

  private function encode64(string $input, int $count, string $itoa64): string {
    $output = '';
    $i = 0;
    do {
      $value = ord($input[$i++]);
      $output .= $itoa64[$value & 0x3f];
      if ($i < $count) $value |= ord($input[$i]) << 8;
      $output .= $itoa64[($value >> 6) & 0x3f];
      if ($i++ >= $count) break;
      if ($i < $count) $value |= ord($input[$i]) << 16;
      $output .= $itoa64[($value >> 12) & 0x3f];
      if ($i++ >= $count) break;
      $output .= $itoa64[($value >> 18) & 0x3f];
    } while ($i < $count);
    return $output;
  }

  public function createSession(int $userId): string {
    $sessionId = bin2hex(random_bytes(32));
    $now = new \DateTimeImmutable();
    $expires = $now->modify('+' . $this->sessionHours . ' hours');

    $stmt = $this->pdo->prepare("
      INSERT INTO jb_sessions (user_id, session_id, created_at, expires_at)
      VALUES (:user_id, :session_id, :created_at, :expires_at)
    ");
    $stmt->execute([
      ':user_id' => $userId,
      ':session_id' => $sessionId,
      ':created_at' => $now->format('Y-m-d H:i:s'),
      ':expires_at' => $expires->format('Y-m-d H:i:s'),
    ]);

    setcookie($this->sessionCookie, $sessionId, [
      'expires' => $expires->getTimestamp(),
      'path' => '/',
      'secure' => isset($_SERVER['HTTPS']),
      'httponly' => true,
      'samesite' => 'Lax',
    ]);

    return $sessionId;
  }

  public function clearSession(): void {
    if (!empty($_COOKIE[$this->sessionCookie])) {
      $stmt = $this->pdo->prepare("DELETE FROM jb_sessions WHERE session_id = :sid");
      $stmt->execute([':sid' => $_COOKIE[$this->sessionCookie]]);
    }
    setcookie($this->sessionCookie, '', [
      'expires' => time() - 3600,
      'path' => '/',
      'secure' => isset($_SERVER['HTTPS']),
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
  }

  public function getSessionUser(): array {
    $sid = $_COOKIE[$this->sessionCookie] ?? '';
    if (!$sid) return [];

    $stmt = $this->pdo->prepare("
      SELECT u.*
      FROM jb_sessions s
      JOIN jb_users u ON u.id = s.user_id
      WHERE s.session_id = :sid AND s.expires_at >= NOW()
      LIMIT 1
    ");
    $stmt->execute([':sid' => $sid]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    return $user ?: [];
  }
}
