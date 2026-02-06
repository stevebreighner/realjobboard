<?php
declare(strict_types=1);

namespace App\Controllers;

class HealthController {
  public function ping(): array {
    return [
      'status' => 'ok',
      'timestamp' => time(),
    ];
  }
}
