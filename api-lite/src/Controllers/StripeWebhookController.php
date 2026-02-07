<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\JobIntentModel;
use App\Models\JobModel;
use App\Models\CompanyModel;
use App\Models\PromoModel;

class StripeWebhookController {
  public function handle(): array {
    $payload = file_get_contents('php://input') ?: '';
    $sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
    $secret = $_ENV['STRIPE_SECRET_SIGN'] ?? '';

    if (!$secret) {
      http_response_code(500);
      return ['error' => 'Stripe webhook secret not configured'];
    }

    if (!$this->verifySignature($payload, $sigHeader, $secret)) {
      http_response_code(400);
      return ['error' => 'Invalid signature'];
    }

    $event = json_decode($payload, true);
    if (!is_array($event)) {
      http_response_code(400);
      return ['error' => 'Invalid payload'];
    }

    $type = $event['type'] ?? '';
    if ($type === 'checkout.session.completed') {
      $session = $event['data']['object'] ?? [];
      $intentId = isset($session['metadata']['intent_id']) ? (int) $session['metadata']['intent_id'] : 0;
      if ($intentId) {
        $this->finalizeIntent($intentId);
      }
    }
    return ['received' => true];
  }

  private function verifySignature(string $payload, string $sigHeader, string $secret): bool {
    if ($sigHeader === '') return false;
    $parts = explode(',', $sigHeader);
    $timestamp = null;
    $signatures = [];
    foreach ($parts as $part) {
      $pair = explode('=', trim($part), 2);
      if (count($pair) !== 2) continue;
      if ($pair[0] === 't') {
        $timestamp = (int) $pair[1];
      }
      if ($pair[0] === 'v1') {
        $signatures[] = $pair[1];
      }
    }
    if (!$timestamp || empty($signatures)) return false;

    $tolerance = 300;
    if (abs(time() - $timestamp) > $tolerance) return false;

    $signedPayload = $timestamp . '.' . $payload;
    $expected = hash_hmac('sha256', $signedPayload, $secret);
    foreach ($signatures as $sig) {
      if (hash_equals($expected, $sig)) return true;
    }
    return false;
  }

  private function finalizeIntent(int $intentId): void {
    $intents = new JobIntentModel();
    $jobs = new JobModel();
    $companies = new CompanyModel();
    $promos = new PromoModel();

    $intent = $intents->findById($intentId);
    if (!$intent || $intent['status'] === 'completed') {
      return;
    }
    $payload = json_decode($intent['payload_json'] ?? '', true);
    if (!is_array($payload) || empty($payload['title'])) {
      return;
    }
    $company = $companies->findById((int) $intent['company_id']);
    if (!$company) {
      return;
    }

    $tier = $intent['tier'] ?? 'standard';
    $meta = [
      'description' => $payload['description'] ?? '',
      'field' => $payload['field'] ?? '',
      'street1' => $payload['street1'] ?? '',
      'street2' => $payload['street2'] ?? '',
      'city' => $payload['city'] ?? '',
      'state' => $payload['state'] ?? '',
      'zip' => $payload['zip'] ?? '',
      'country' => $payload['country'] ?? '',
      'rate_type' => $payload['rate_type'] ?? '',
      'rate_min' => $payload['rate_min'] ?? '',
      'rate_max' => $payload['rate_max'] ?? '',
      'job_type' => $payload['job_type'] ?? '',
      'company' => $payload['company'] ?: ($company['name'] ?? ''),
      'company_site' => $payload['company_site'] ?? '',
      'job_featured' => $tier === 'premium' ? '1' : '0',
    ];
    $jobs->createDraft($payload['title'], $meta, 'draft');
    if (!empty($intent['promo_code_id'])) {
      $promos->incrementUses((int) $intent['promo_code_id']);
    }
    $intents->markCompleted($intentId);
  }
}
