<?php
require __DIR__ . '/../src/bootstrap.php';

use App\Services\AuthService;
use App\Controllers\AdminController;

// Run as CLI: send digest to subscribers.
$admin = new AdminController();
$result = $admin->sendDigest();
if (is_array($result)) {
  $count = $result['sent'] ?? 0;
  echo "Digest sent to {$count} subscriber(s).\n";
} else {
  echo "Digest failed.\n";
}
