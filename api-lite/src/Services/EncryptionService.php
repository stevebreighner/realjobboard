<?php
declare(strict_types=1);

namespace App\Services;

class EncryptionService {
  private string $key;

  public function __construct() {
    $raw = $_ENV['FILE_ENCRYPTION_KEY'] ?? '';
    if (!$raw) {
      throw new \RuntimeException('FILE_ENCRYPTION_KEY is not set');
    }
    $this->key = $this->deriveKey($raw);
  }

  private function deriveKey(string $raw): string {
    if ($this->startsWith($raw, 'base64:')) {
      $decoded = base64_decode(substr($raw, 7), true);
      if ($decoded !== false && strlen($decoded) >= 32) {
        return substr($decoded, 0, 32);
      }
    }
    $decoded = base64_decode($raw, true);
    if ($decoded !== false && strlen($decoded) >= 32) {
      return substr($decoded, 0, 32);
    }
    return hash('sha256', $raw, true);
  }

  private function startsWith(string $value, string $prefix): bool {
    if ($prefix === '') return true;
    return strncmp($value, $prefix, strlen($prefix)) === 0;
  }

  public function encrypt(string $plaintext): array {
    $iv = random_bytes(12);
    $tag = '';
    $ciphertext = openssl_encrypt(
      $plaintext,
      'aes-256-gcm',
      $this->key,
      OPENSSL_RAW_DATA,
      $iv,
      $tag
    );
    if ($ciphertext === false) {
      throw new \RuntimeException('Encryption failed');
    }
    return [
      'ciphertext' => $ciphertext,
      'iv' => base64_encode($iv),
      'tag' => base64_encode($tag),
    ];
  }

  public function decrypt(string $ciphertext, string $ivB64, string $tagB64): string {
    $iv = base64_decode($ivB64, true);
    $tag = base64_decode($tagB64, true);
    if ($iv === false || $tag === false) {
      throw new \RuntimeException('Invalid encryption metadata');
    }
    $plaintext = openssl_decrypt(
      $ciphertext,
      'aes-256-gcm',
      $this->key,
      OPENSSL_RAW_DATA,
      $iv,
      $tag
    );
    if ($plaintext === false) {
      throw new \RuntimeException('Decryption failed');
    }
    return $plaintext;
  }
}
