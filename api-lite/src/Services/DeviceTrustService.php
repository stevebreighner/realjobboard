<?php
declare(strict_types=1);

namespace App\Services;

use App\Models\UserMetaModel;

class DeviceTrustService {
  private UserMetaModel $meta;

  public function __construct() {
    $this->meta = new UserMetaModel();
  }

  public function registerLoginDevice(int $userId): array {
    $now = date('c');
    $ip = $this->maskedIp((string) ($_SERVER['REMOTE_ADDR'] ?? ''));
    $ua = $this->shortUserAgent((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''));
    $acceptLang = trim((string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''));
    $fingerprint = hash('sha256', strtolower($ua) . '|' . $ip . '|' . strtolower($acceptLang));

    $known = $this->getKnownDevices($userId);
    $isNew = true;
    $deviceId = substr($fingerprint, 0, 16);

    foreach ($known as &$device) {
      if (($device['fp'] ?? '') === $fingerprint) {
        $device['last_seen'] = $now;
        $isNew = false;
        $deviceId = (string) ($device['id'] ?? $deviceId);
        break;
      }
    }
    unset($device);

    if ($isNew) {
      $known[] = [
        'id' => $deviceId,
        'fp' => $fingerprint,
        'first_seen' => $now,
        'last_seen' => $now,
        'ip' => $ip,
        'ua' => $ua,
      ];
    }

    usort($known, fn(array $a, array $b) => strcmp((string) ($b['last_seen'] ?? ''), (string) ($a['last_seen'] ?? '')));
    $known = array_slice($known, 0, 20);
    $this->meta->setMeta($userId, 'trusted_devices_v1', json_encode($known, JSON_UNESCAPED_SLASHES));

    return [
      'is_new' => $isNew,
      'device_id' => $deviceId,
      'ip' => $ip,
      'ua' => $ua,
      'seen_at' => $now,
    ];
  }

  private function getKnownDevices(int $userId): array {
    $raw = $this->meta->getMeta($userId, 'trusted_devices_v1');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? array_values(array_filter($decoded, 'is_array')) : [];
  }

  private function maskedIp(string $ip): string {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
      $parts = explode('.', $ip);
      if (count($parts) === 4) {
        return $parts[0] . '.' . $parts[1] . '.' . $parts[2] . '.0';
      }
      return $ip;
    }
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
      $parts = explode(':', $ip);
      $prefix = array_slice($parts, 0, 4);
      return implode(':', $prefix) . '::';
    }
    return '(unknown)';
  }

  private function shortUserAgent(string $ua): string {
    $ua = trim(preg_replace('/\\s+/', ' ', $ua));
    if ($ua === '') return '(unknown)';
    return substr($ua, 0, 180);
  }
}
