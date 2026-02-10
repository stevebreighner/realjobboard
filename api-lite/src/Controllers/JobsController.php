<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\JobModel;

class JobsController {
  public function index(): array {
    $model = new JobModel();
    $jobs = $model->list();
    return $this->withCompanySlugs($jobs);
  }

  public function detail(): array {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    if ($id <= 0) {
      http_response_code(422);
      return ['error' => 'Missing job id'];
    }
    $model = new JobModel();
    $job = $model->getById($id);
    if (empty($job)) {
      http_response_code(404);
      return ['error' => 'Job not found'];
    }
    $with = $this->withCompanySlugs([$job]);
    return $with[0] ?? $job;
  }

  private function withCompanySlugs(array $jobs): array {
    if (empty($jobs)) return $jobs;
    $companyModel = new \App\Models\CompanyModel();
    return array_map(function ($job) use ($companyModel) {
      $company = $job['meta']['company'] ?? '';
      if ($company) {
        $record = $companyModel->findByName($company);
        if ($record && !empty($record['slug'])) {
          $job['meta']['company_slug'] = $record['slug'];
        }
      }
      return $job;
    }, $jobs);
  }
}
