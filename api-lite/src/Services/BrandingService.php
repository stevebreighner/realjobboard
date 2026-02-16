<?php
declare(strict_types=1);

namespace App\Services;

class BrandingService {
  public function siteName(): string {
    $name = trim((string) ($_ENV['SITE_NAME'] ?? ($_ENV['EMAIL_FROM_NAME'] ?? '')));
    if ($name !== '') return $name;
    $host = $this->host();
    $label = explode('.', $host)[0] ?? 'Site';
    $label = trim((string) $label);
    if ($label === '') return 'Site';
    return ucfirst($label);
  }

  public function fromName(): string {
    $name = trim((string) ($_ENV['EMAIL_FROM_NAME'] ?? ''));
    if ($name !== '') return $name;
    return $this->siteName();
  }

  public function host(): string {
    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    return $host !== '' ? $host : 'localhost';
  }

  public function siteUrl(): string {
    $url = trim((string) ($_ENV['SITE_URL'] ?? ''));
    if ($url !== '') return rtrim($url, '/');
    return $this->scheme() . '://' . $this->host();
  }

  public function supportEmail(): string {
    $email = trim((string) ($_ENV['COMPANY_SUPPORT_EMAIL'] ?? ''));
    if ($email !== '') return $email;
    $fallback = trim((string) ($_ENV['EMAIL_FROM_ADDRESS'] ?? ''));
    if ($fallback !== '') return $fallback;
    return 'support@' . $this->host();
  }

  public function adminUrl(): string {
    return $this->siteUrl() . '/#admin';
  }

  private function scheme(): string {
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
      return strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https' ? 'https' : 'http';
    }
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
      return 'https';
    }
    return 'http';
  }
}
