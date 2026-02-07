<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\AuthService;
use App\Models\UserMetaModel;
use App\Models\CompanyModel;
use App\Models\PromoModel;
use App\Models\JobIntentModel;
use App\Models\JobModel;
use App\Services\RateLimiter;

class StripeController {
  private AuthService $auth;
  private UserMetaModel $userMeta;
  private CompanyModel $companies;
  private PromoModel $promos;
  private JobIntentModel $intents;
  private JobModel $jobs;

  public function __construct() {
    $this->auth = new AuthService($GLOBALS['DB_PDO']);
    $this->userMeta = new UserMetaModel();
    $this->companies = new CompanyModel();
    $this->promos = new PromoModel();
    $this->intents = new JobIntentModel();
    $this->jobs = new JobModel();
  }

  private function jsonInput(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  public function config(): array {
    $key = $_ENV['STRIPE_PUBLISHABLE_KEY'] ?? '';
    if (!$key) {
      http_response_code(500);
      return ['error' => 'Stripe publishable key not configured'];
    }
    return ['publishableKey' => $key];
  }

  public function checkout(): array {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $limiter = new RateLimiter($GLOBALS['DB_PDO']);
    if (!$limiter->check("stripe-checkout:{$ip}", 5, 300)) {
      http_response_code(429);
      return ['error' => 'Too many requests. Please try again later.'];
    }
    $user = $this->auth->getSessionUser();
    if (empty($user)) {
      http_response_code(403);
      return ['error' => 'Not logged in'];
    }
    $roles = [$user['role'] ?? ''];
    if (!in_array('employer', $roles, true)) {
      http_response_code(403);
      return ['error' => 'Employer access required'];
    }

    $data = $this->jsonInput();
    $tier = trim((string) ($data['tier'] ?? 'standard'));
    $promoCode = trim((string) ($data['promo_code'] ?? ''));

    $companyId = (int) ($this->userMeta->getMeta((int) $user['id'], 'company_id') ?? 0);
    if (!$companyId) {
      http_response_code(422);
      return ['error' => 'Company not linked'];
    }

    $company = $this->companies->findById($companyId);
    if (!$company) {
      http_response_code(422);
      return ['error' => 'Company not found'];
    }

    $payload = $this->normalizeJobPayload($data);
    if (empty($payload['title']) && !empty($data['job_id'])) {
      $existing = $this->jobs->getById((int) $data['job_id']);
      if (!empty($existing)) {
        $payload = array_merge($payload, [
          'title' => $existing['title'] ?? '',
          'description' => $existing['description'] ?? '',
          'field' => $existing['meta']['field'] ?? '',
          'street1' => $existing['meta']['street1'] ?? '',
          'street2' => $existing['meta']['street2'] ?? '',
          'city' => $existing['meta']['city'] ?? '',
          'state' => $existing['meta']['state'] ?? '',
          'zip' => $existing['meta']['zip'] ?? '',
          'country' => $existing['meta']['country'] ?? '',
          'rate_type' => $existing['meta']['rate_type'] ?? '',
          'rate_min' => $existing['meta']['rate_min'] ?? '',
          'rate_max' => $existing['meta']['rate_max'] ?? '',
          'job_type' => $existing['meta']['job_type'] ?? '',
          'company' => $existing['meta']['company'] ?? '',
          'company_site' => $existing['meta']['company_site'] ?? '',
        ]);
      }
    }
    if (empty($payload['title'])) {
      http_response_code(422);
      return ['error' => 'Missing job title'];
    }

    $promo = null;
    if ($promoCode) {
      $promo = $this->promos->findByCode($promoCode);
      if (!$promo || !$this->promos->isValid($promo)) {
        http_response_code(422);
        return ['error' => 'Promo code is invalid or expired'];
      }
    }

    $isFreeEligible = !$company['free_post_used'];
    $isFreePromo = $promo && ((int) $promo['is_free'] === 1 || (int) $promo['percent_off'] >= 100);

    if ($isFreeEligible || $isFreePromo) {
      $jobId = $this->jobs->createDraft($payload['title'], $this->buildJobMeta($payload, $company, $user), 'draft');
      if ($isFreeEligible) {
        $this->companies->markFreeUsed($companyId);
      }
      if ($promo) {
        $this->promos->incrementUses((int) $promo['id']);
      }
      return ['free' => true, 'job_id' => $jobId, 'status' => 'draft'];
    }

    $intent = $this->intents->create([
      'company_id' => $companyId,
      'user_id' => (int) $user['id'],
      'payload_json' => json_encode($payload),
      'tier' => $tier,
      'promo_code_id' => $promo ? (int) $promo['id'] : null,
      'status' => 'pending',
    ]);

    $priceCents = $this->getTierPriceCents($tier);
    if ($promo && $this->promos->isValid($promo)) {
      $percent = (int) $promo['percent_off'];
      if ($percent > 0 && $percent < 100) {
        $priceCents = (int) round($priceCents * (1 - ($percent / 100)));
      }
    }

    $sessionId = $this->createStripeSession($priceCents, $tier, (int) $intent['id'], $companyId, (int) $user['id']);
    if (!$sessionId) {
      http_response_code(500);
      return ['error' => 'Stripe session failed'];
    }
    $this->intents->updateSession((int) $intent['id'], $sessionId);

    return ['sessionId' => $sessionId];
  }

  private function getTierPriceCents(string $tier): int {
    $standard = (int) ($_ENV['JOB_PRICE_STANDARD_CENTS'] ?? 1);
    $premium = (int) ($_ENV['JOB_PRICE_PREMIUM_CENTS'] ?? 2);
    return $tier === 'premium' ? $premium : $standard;
  }

  private function createStripeSession(int $amountCents, string $tier, int $intentId, int $companyId, int $userId): ?string {
    $secret = $_ENV['STRIPE_SECRET_KEY'] ?? '';
    if (!$secret) return null;
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $siteUrl = $host ? ('https://' . $host) : '';
    if ($siteUrl && strpos($siteUrl, 'http') !== 0) {
      $siteUrl = 'https://' . $siteUrl;
    }
    $successUrl = rtrim($siteUrl, '/') . '/#my-job-posts?paid=1';
    $cancelUrl = rtrim($siteUrl, '/') . '/#post?canceled=1';

    $params = [
      'mode' => 'payment',
      'payment_method_types[]' => 'card',
      'line_items[0][price_data][currency]' => 'usd',
      'line_items[0][price_data][product_data][name]' => 'Job Posting - ' . ucfirst($tier),
      'line_items[0][price_data][unit_amount]' => (string) max(1, $amountCents),
      'line_items[0][quantity]' => '1',
      'success_url' => $successUrl,
      'cancel_url' => $cancelUrl,
      'metadata[intent_id]' => (string) $intentId,
      'metadata[company_id]' => (string) $companyId,
      'metadata[user_id]' => (string) $userId,
      'metadata[tier]' => $tier,
    ];

    $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
    curl_setopt($ch, CURLOPT_USERPWD, $secret . ':');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    $response = curl_exec($ch);
    if ($response === false) {
      curl_close($ch);
      return null;
    }
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status < 200 || $status >= 300) {
      return null;
    }
    $data = json_decode($response, true);
    return $data['id'] ?? null;
  }

  private function normalizeJobPayload(array $data): array {
    return [
      'title' => trim((string) ($data['title'] ?? '')),
      'description' => trim((string) ($data['description'] ?? '')),
      'field' => trim((string) ($data['field'] ?? '')),
      'street1' => trim((string) ($data['street1'] ?? '')),
      'street2' => trim((string) ($data['street2'] ?? '')),
      'city' => trim((string) ($data['city'] ?? '')),
      'state' => trim((string) ($data['state'] ?? '')),
      'zip' => trim((string) ($data['zip'] ?? '')),
      'country' => trim((string) ($data['country'] ?? '')),
      'rate_type' => trim((string) ($data['rate_type'] ?? '')),
      'rate_min' => trim((string) ($data['rate_min'] ?? '')),
      'rate_max' => trim((string) ($data['rate_max'] ?? '')),
      'job_type' => trim((string) ($data['job_type'] ?? '')),
      'company' => trim((string) ($data['company'] ?? '')),
      'company_site' => trim((string) ($data['company_site'] ?? '')),
    ];
  }

  private function buildJobMeta(array $payload, array $company, array $user): array {
    return [
      'description' => $payload['description'],
      'field' => $payload['field'],
      'street1' => $payload['street1'],
      'street2' => $payload['street2'],
      'city' => $payload['city'],
      'state' => $payload['state'],
      'zip' => $payload['zip'],
      'country' => $payload['country'],
      'rate_type' => $payload['rate_type'],
      'rate_min' => $payload['rate_min'],
      'rate_max' => $payload['rate_max'],
      'job_type' => $payload['job_type'],
      'company' => $payload['company'] ?: ($company['name'] ?? ''),
      'company_site' => $payload['company_site'] ?: '',
      'job_featured' => '0',
      'owner_id' => (string) ($user['id'] ?? ''),
      'owner_email' => (string) ($user['email'] ?? ''),
      'company_slug' => $company['slug'] ?? '',
    ];
  }
}
