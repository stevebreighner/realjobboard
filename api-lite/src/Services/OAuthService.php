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
    $this->redirectUri = $this->baseUrl . '/api/oauth/google/callback';
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
    $context = stream_context_create([
      'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => http_build_query($payload),
        'timeout' => 10,
      ]
    ]);
    $raw = file_get_contents('https://oauth2.googleapis.com/token', false, $context);
    if ($raw === false) {
      return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
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
      return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
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
