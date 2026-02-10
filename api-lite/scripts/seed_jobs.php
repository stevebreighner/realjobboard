<?php
require __DIR__ . '/../src/bootstrap.php';

use App\Models\JobModel;

$jobModel = new JobModel();

$fields = [
  'Tech','Healthcare','Education','Finance','Retail','Hospitality','Construction','Logistics','Marketing','Design'
];
$employmentTypes = ['full_time','part_time','temp','contract','internship','seasonal'];
$cities = [
  ['San Jose','CA','95112'],
  ['Sacramento','CA','95814'],
  ['Portland','OR','97205'],
  ['Seattle','WA','98101'],
  ['Austin','TX','78701'],
  ['Dallas','TX','75201'],
  ['Denver','CO','80202'],
  ['Chicago','IL','60601'],
  ['Miami','FL','33101'],
  ['Boston','MA','02108'],
  ['New York','NY','10001'],
  ['Des Moines','IA','50309'],
  ['Phoenix','AZ','85004'],
  ['Las Vegas','NV','89101'],
  ['Atlanta','GA','30303'],
];
$companies = [
  'Fog City Media','Riverbend Health','Northstar Auto Group','Brightline Analytics',
  'Sunrise Logistics','Cascade Hospitality','Prairie Finance','BlueSky Retail',
  'Oak & Stone Construction','Harborview Education'
];
$rateTypes = ['hourly','salary','contract'];

$roles = [
  'Registered Nurse','Front Desk Associate','Full Stack Developer','Marketing Coordinator','Warehouse Supervisor',
  'UX Designer','Customer Support Specialist','Electrician','Data Analyst','Sales Associate',
  'Project Manager','HR Generalist','Product Manager','Accountant','Operations Lead'
];

$now = time();

for ($i = 0; $i < 50; $i++) {
  $role = $roles[array_rand($roles)];
  $field = $fields[array_rand($fields)];
  $company = $companies[array_rand($companies)];
  $employment = $employmentTypes[array_rand($employmentTypes)];
  $rateType = $rateTypes[array_rand($rateTypes)];
  $cityRow = $cities[array_rand($cities)];
  $city = $cityRow[0];
  $state = $cityRow[1];
  $zip = $cityRow[2];
  $min = $rateType === 'salary' ? rand(45000, 110000) : rand(16, 45);
  $max = $rateType === 'salary' ? $min + rand(5000, 35000) : $min + rand(4, 20);

  $title = $role;
  $status = 'publish';
  $jobId = $jobModel->createDraft($title, [], $status);
  $jobModel->updateMeta($jobId, [
    'field' => $field,
    'employment_type' => $employment,
    'company' => $company,
    'company_site' => '',
    'city' => $city,
    'state' => $state,
    'zip' => $zip,
    'country' => 'United States',
    'rate_type' => $rateType,
    'rate_min' => (string) $min,
    'rate_max' => (string) $max,
    'summary' => "Join {$company} as a {$role} in {$city}.",
    'description' => "We are hiring a {$role} to join our {$field} team. Responsibilities include collaboration, reporting, and growth. Competitive {$rateType} compensation.",
    'job_featured' => (rand(0, 10) > 8) ? '1' : '0',
  ]);

  // Stagger created_at via direct update for variety
  $created = date('Y-m-d H:i:s', $now - rand(0, 60 * 60 * 24 * 45));
  $pdo = $GLOBALS['DB_PDO'];
  $stmt = $pdo->prepare("UPDATE jb_jobs SET created_at = :created_at, updated_at = :updated_at WHERE id = :id");
  $stmt->execute([
    ':created_at' => $created,
    ':updated_at' => $created,
    ':id' => $jobId,
  ]);
}

echo "Seeded 50 jobs.\n";
