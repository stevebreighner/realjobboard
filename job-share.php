<?php
declare(strict_types=1);

require __DIR__ . '/api-lite/src/bootstrap.php';

use App\Models\JobModel;
use App\Services\BrandingService;

function h(string $value): string {
  return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function cleanText(string $value): string {
  $value = strip_tags($value);
  $value = preg_replace('/\s+/', ' ', $value) ?? '';
  return trim($value);
}

function currentScheme(): string {
  if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
    return strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https' ? 'https' : 'http';
  }
  if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    return 'https';
  }
  return 'http';
}

$brand = new BrandingService();
$jobId = (int) ($_GET['id'] ?? 0);
$job = [];

if ($jobId > 0) {
  $model = new JobModel();
  $job = $model->getById($jobId);
}

$host = trim((string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
$baseUrl = currentScheme() . '://' . ($host !== '' ? $host : 'localhost');
$siteName = $brand->siteName();
$fallbackDescription = 'A job search site with privacy-first applications and smarter matching.';
$imageUrl = $baseUrl . '/jabbard_footer_logo.png';

if (!empty($job)) {
  $company = cleanText((string) ($job['meta']['company'] ?? ''));
  $locationParts = array_filter([
    cleanText((string) ($job['meta']['city'] ?? '')),
    cleanText((string) ($job['meta']['state'] ?? '')),
    cleanText((string) ($job['meta']['zip'] ?? '')),
  ]);
  $location = implode(', ', $locationParts);

  $title = cleanText((string) ($job['title'] ?? 'Job Opportunity'));
  if ($company !== '') {
    $title .= ' at ' . $company;
  }
  $title .= ' | ' . $siteName;

  $description = cleanText((string) (
    $job['meta']['summary']
    ?? $job['meta']['description']
    ?? $job['description']
    ?? ''
  ));
  if ($description === '') {
    $description = $company !== '' ? "Open role at {$company}." : 'Open role.';
  }
  if ($location !== '') {
    $description .= " Location: {$location}.";
  }
  if (mb_strlen($description) > 220) {
    $description = mb_substr($description, 0, 217) . '...';
  }

  $ogUrl = $baseUrl . '/job/' . $jobId;
  $appUrl = $baseUrl . '/#list-detail?id=' . $jobId;
} else {
  http_response_code(404);
  $title = 'Job Not Found | ' . $siteName;
  $description = 'This job listing is no longer available.';
  $ogUrl = $baseUrl . '/job/' . ($jobId > 0 ? $jobId : '');
  $appUrl = $baseUrl . '/#list';
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: public, max-age=300');
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title><?= h($title) ?></title>
  <meta name="description" content="<?= h($description !== '' ? $description : $fallbackDescription) ?>" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="<?= h($title) ?>" />
  <meta property="og:description" content="<?= h($description !== '' ? $description : $fallbackDescription) ?>" />
  <meta property="og:url" content="<?= h($ogUrl) ?>" />
  <meta property="og:image" content="<?= h($imageUrl) ?>" />
  <meta property="og:image:width" content="1536" />
  <meta property="og:image:height" content="1024" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="<?= h($title) ?>" />
  <meta name="twitter:description" content="<?= h($description !== '' ? $description : $fallbackDescription) ?>" />
  <meta name="twitter:image" content="<?= h($imageUrl) ?>" />
  <link rel="canonical" href="<?= h($ogUrl) ?>" />
  <script>
    window.location.replace(<?= json_encode($appUrl, JSON_UNESCAPED_SLASHES) ?>);
  </script>
</head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;color:#0f172a;">
  <p>Opening job listing...</p>
  <p><a href="<?= h($appUrl) ?>">Continue to the listing</a></p>
</body>
</html>
