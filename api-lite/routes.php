<?php
declare(strict_types=1);

use App\Controllers\HealthController;
use App\Controllers\JobsController;

return [
  'GET' => [
    '/api/ping' => [new HealthController(), 'ping'],
    '/api/jobs' => [new JobsController(), 'index'],
  ],
];
