<?php
// api.php in jobs.stephenbreighner.com folder

session_start();

define('BASE_PATH', realpath(__DIR__));  // subdomain folder itself

header('Content-Type: application/json');

// Simple login/password for example
$valid_user = 'steveb533';
$valid_pass = '56s"$Z5v?Tb}';
define('VALID_USER', 'steveb533');
define('VALID_PASS', '56s"$Z5v?Tb}');  // CHANGE THIS!

// Limit login attempts
if (!isset($_SESSION['login_attempts'])) $_SESSION['login_attempts'] = 0;
if ($_SESSION['login_attempts'] > 3) {
    echo json_encode(['error' => 'Too many failed login attempts. Access locked.']);
    exit;
}

// Read JSON body for POST
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true) ?: [];

$action = $_GET['action'] ?? ($input['action'] ?? null);

if ($action === 'login') {
    $user = $input['user'] ?? '';
    $pass = $input['pass'] ?? '';
    if ($user === VALID_USER && $pass === VALID_PASS) {
        $_SESSION['logged_in'] = true;
        $_SESSION['login_attempts'] = 0;
        echo json_encode(['status' => 'ok']);
    } else {
        $_SESSION['login_attempts']++;
        echo json_encode(['error' => 'Invalid username or password']);
    }
    exit;
}

if (empty($_SESSION['logged_in'])) {
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Helper to resolve and secure path inside BASE_PATH
function safePath($path) {
    global $BASE_PATH;
    $base = BASE_PATH;
    $full = realpath($base . '/' . $path);
    if ($full === false) return false;
    // Must be inside BASE_PATH folder
    if (strpos($full, $base) !== 0) return false;
    return $full;
}

switch ($action) {
    case 'list':
        $path = $_GET['path'] ?? '';
        $fullPath = safePath($path);
        if (!$fullPath || !is_dir($fullPath)) {
            echo json_encode(['error' => 'Invalid directory']);
            exit;
        }
        $files = array_values(array_filter(scandir($fullPath), fn($f) => $f !== '.' && $f !== '..'));
        $list = [];
        foreach ($files as $f) {
            $itemPath = $fullPath . DIRECTORY_SEPARATOR . $f;
            $list[] = [
                'name' => $f,
                'isDir' => is_dir($itemPath),
            ];
        }
        echo json_encode($list);
        break;

    case 'read':
        $path = $_GET['path'] ?? '';
        $fullPath = safePath($path);
        if (!$fullPath || !is_file($fullPath)) {
            echo json_encode(['error' => 'Invalid file']);
            exit;
        }
        echo file_get_contents($fullPath);
        break;

    case 'save':
        $file = $input['file'] ?? '';
        $content = $input['content'] ?? '';
        $fullPath = safePath($file);
        if (!$fullPath || !is_file($fullPath)) {
            echo json_encode(['error' => 'Invalid file']);
            exit;
        }
        if (file_put_contents($fullPath, $content) === false) {
            echo json_encode(['error' => 'Failed to save']);
            exit;
        }
        echo json_encode(['status' => 'saved']);
        break;

    default:
        echo json_encode(['error' => 'No valid action specified']);
}
