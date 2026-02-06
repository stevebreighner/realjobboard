<?php
declare(strict_types=1);

use App\Controllers\HealthController;
use App\Controllers\JobsController;
use App\Controllers\AuthController;

return [
  'GET' => [
    '/api/ping' => [new HealthController(), 'ping'],
    '/api/jobs' => [new JobsController(), 'index'],
    '/api/session' => [new AuthController(), 'session'],
  ],
  'POST' => [
    '/api/register' => [new AuthController(), 'register'],
    '/api/login' => [new AuthController(), 'login'],
    '/api/logout' => [new AuthController(), 'logout'],
  ],
];
