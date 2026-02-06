<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\JobModel;

class JobsController {
  public function index(): array {
    $model = new JobModel();
    return $model->list();
  }
}
