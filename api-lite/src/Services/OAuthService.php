<?php
declare(strict_types=1);

namespace App\Services;

class OAuthService {
  private string $baseUrl;
  private string $clientId;
  private string $clientSecret;
  private string $redirectUri;

  public function __construct() {
    $this->baseUrl = $this->detectBaseUrl();
    $this->clientId = (string) ($_ENV['GOOGLE_CLIENT_ID'] ?? '');
    $this->clientSecret = (string) ($_ENV['GOOGLE_CLIENT_SECRET'] ?? '');
    $envRedirect = (string) ($_ENV['GOOGLE_REDIRECT_URI'] ?? '');
    $this->redirectUri = $envRedirect !== '' ? $envRedirect : ($this->baseUrl . '/api/oauth/google/callback');
  }

  public function isConfigured(): bool {
    return $this->clientId !== '' && $this->clientSecret !== '';
  }

  public function getAuthUrl(string $state, string $nonce): string {
    $params = [
      'client_id' => $this->clientId,
      'redirect_uri' => $this->redirectUri,
      'response_type' => 'code',
      'scope' => 'openid email profile',
      'state' => $state,
      'nonce' => $nonce,
      'prompt' => 'select_account',
    ];
    return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
  }

  public function exchangeCode(string $code): array {
    $payload = [
      'code' => $code,
      'client_id' => $this->clientId,
      'client_secret' => $this->clientSecret,
      'redirect_uri' => $this->redirectUri,
      'grant_type' => 'authorization_code',
    ];
    $raw = $this->postForm('https://oauth2.googleapis.com/token', $payload);
    if ($raw === false) {
      $this->log('OAuth token request failed (no response).');
      return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
      $this->log('OAuth token invalid JSON: ' . substr($raw, 0, 500));
      return [];
    }
    if (isset($data['error'])) {
      $this->log('OAuth token error: ' . ($data['error_description'] ?? $data['error']));
    }
    return $data;
  }

  public function fetchUserInfo(string $accessToken): array {
    $context = stream_context_create([
      'http' => [
        'method' => 'GET',
        'header' => "Authorization: Bearer {$accessToken}\r\n",
        'timeout' => 10,
      ]
    ]);
    $raw = file_get_contents('https://openidconnect.googleapis.com/v1/userinfo', false, $context);
    if ($raw === false) {
      $this->log('OAuth userinfo request failed.');
      return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  public function getRedirectUri(): string {
    return $this->redirectUri;
  }

  private function log(string $message): void {
    $logDir = __DIR__ . '/../../logs';
    if (!is_dir($logDir)) {
      @mkdir($logDir, 0755, true);
    }
    $line = sprintf("[%s] %s\n", date('c'), $message);
    @file_put_contents($logDir . '/oauth.log', $line, FILE_APPEND);
  }

  private function postForm(string $url, array $payload) {
    $body = http_build_query($payload);
    // Try curl first if available
    if (function_exists('curl_init')) {
      $ch = curl_init($url);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($ch, CURLOPT_POST, true);
      curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
      curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
      curl_setopt($ch, CURLOPT_TIMEOUT, 12);
      $resp = curl_exec($ch);
      if ($resp === false) {
        $this->log('OAuth curl error: ' . curl_error($ch));
      }
      curl_close($ch);
      if ($resp !== false) return $resp;
    }
    $context = stream_context_create([
      'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => $body,
        'timeout' => 12,
      ]
    ]);
    return @file_get_contents($url, false, $context);
  }

  private function detectBaseUrl(): string {
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
}
