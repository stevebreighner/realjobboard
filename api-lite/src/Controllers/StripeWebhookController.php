<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\JobIntentModel;
use App\Models\JobModel;
use App\Models\CompanyModel;
use App\Models\PromoModel;
use App\Services\Mailer;

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
        $this->finalizeIntent($intentId, $session);
      }
    }
    if ($type === 'checkout.session.expired') {
      $session = $event['data']['object'] ?? [];
      $this->notifyPaymentIssue($session, 'Checkout expired');
    }
    if ($type === 'payment_intent.payment_failed') {
      $intent = $event['data']['object'] ?? [];
      $this->notifyPaymentIssue($intent, 'Payment failed');
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

  private function finalizeIntent(int $intentId, array $session = []): void {
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
      'employment_type' => $payload['employment_type'] ?? '',
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
    $jobId = $jobs->createDraft($payload['title'], $meta, 'draft');
    if (!empty($intent['promo_code_id'])) {
      $promos->incrementUses((int) $intent['promo_code_id']);
    }
    $intents->markCompleted($intentId);

    // Notify site admins + employer contact (if available)
    $pdo = $GLOBALS['DB_PDO'];
    $admins = $pdo->query("SELECT email FROM jb_users WHERE role IN ('site_admin','administrator')")->fetchAll();
    $adminEmails = array_values(array_filter(array_map(fn($r) => $r['email'] ?? '', $admins ?: [])));
    $toList = $adminEmails;
    $employerEmail = $payload['company_email'] ?? '';
    if ($employerEmail && !in_array($employerEmail, $toList, true)) {
      $toList[] = $employerEmail;
    }
    if ($toList) {
      $siteName = $_ENV['EMAIL_FROM_NAME'] ?? 'JobBoard';
      $subject = $siteName . ' — Job post received';
      $jobUrl = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/#list-detail?id=' . $jobId;
      $html = '
        <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
          <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
            <h2 style="margin:0 0 12px 0;color:#0f172a;">Job post received</h2>
            <p style="margin:0 0 12px 0;color:#475569;">Title: <strong>' . htmlspecialchars($payload['title'] ?? 'Job', ENT_QUOTES) . '</strong></p>
            <p style="margin:0 0 12px 0;color:#475569;">Company: ' . htmlspecialchars($meta['company'] ?? '', ENT_QUOTES) . '</p>
            <p style="margin:0;color:#64748b;font-size:13px;">View: <a href="' . htmlspecialchars($jobUrl, ENT_QUOTES) . '">' . htmlspecialchars($jobUrl, ENT_QUOTES) . '</a></p>
          </div>
        </div>
      ';
      $mailer = new Mailer();
      foreach ($toList as $to) {
        $mailer->send($to, $subject, $html);
      }
    }
  }

  private function notifyPaymentIssue(array $session, string $label): void {
    $email = $session['customer_details']['email'] ?? ($session['customer_email'] ?? '');
    $siteName = $_ENV['EMAIL_FROM_NAME'] ?? 'JobBoard';
    $subject = $siteName . ' — ' . $label;
    $html = '
      <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <h2 style="margin:0 0 12px 0;color:#0f172a;">' . htmlspecialchars($label, ENT_QUOTES) . '</h2>
          <p style="margin:0 0 12px 0;color:#475569;">We couldn’t complete your payment. Please try again or contact support.</p>
        </div>
      </div>
    ';
    if ($email) {
      $mailer = new Mailer();
      $mailer->send($email, $subject, $html);
    }
    // Always notify admins
    $pdo = $GLOBALS['DB_PDO'];
    $admins = $pdo->query("SELECT email FROM jb_users WHERE role IN ('site_admin','administrator')")->fetchAll();
    $adminEmails = array_values(array_filter(array_map(fn($r) => $r['email'] ?? '', $admins ?: [])));
    if ($adminEmails) {
      $mailer = new Mailer();
      foreach ($adminEmails as $to) {
        $mailer->send($to, $subject, $html);
      }
    }
  }
}
