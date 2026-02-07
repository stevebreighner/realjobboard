<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\EmailSubscriberModel;
use App\Models\AuditLogModel;

class SubscriberController {
  private EmailSubscriberModel $subscribers;
  private AuditLogModel $audit;

  public function __construct() {
    $this->subscribers = new EmailSubscriberModel();
    $this->audit = new AuditLogModel();
  }

  public function unsubscribe(): void {
    $token = trim((string) ($_GET['token'] ?? ''));
    if ($token === '') {
      http_response_code(400);
      echo json_encode(['error' => 'Missing token']);
      return;
    }
    $row = $this->subscribers->findByToken($token);
    if (!$row) {
      http_response_code(404);
      echo json_encode(['error' => 'Not found']);
      return;
    }
    $this->subscribers->unsubscribeByToken($token);
    $this->audit->log($row['user_id'] ? (int) $row['user_id'] : null, 'unsubscribe', 'Email unsubscribed', [
      'email' => $row['email'] ?? '',
    ]);
    $target = '/#unsubscribe?status=success';
    header('Location: ' . $target, true, 302);
    exit;
  }
}
