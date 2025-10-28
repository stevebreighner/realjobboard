<?php
// Load WordPress
require_once $_SERVER['DOCUMENT_ROOT'] . '/wp-load.php';

// Ensure roles exist
if (!get_role('employee')) add_role('employee', 'Employee', []);
if (!get_role('employer')) add_role('employer', 'Employer', []);

// Get all users
$all_users = get_users();

foreach ($all_users as $user) {

    // Skip administrators
    if (in_array('administrator', $user->roles)) {
        echo "Skipping admin user {$user->ID} ({$user->user_login})\n";
        continue;
    }

    echo "Current roles for user {$user->ID} ({$user->user_login}): ";
    var_dump($user->roles);

    // Determine new role
    $new_role = in_array('employee', $user->roles) ? 'employer' : 'employee';

    // Remove employee/employer roles only, keep subscriber if exists
    foreach (['employee', 'employer'] as $role) {
        if (in_array($role, $user->roles)) {
            $user->remove_role($role);
        }
    }

    // Add new role
    $user->add_role($new_role);

    echo "Switched user {$user->ID} ({$user->user_login}) to: $new_role\n";
    echo "New roles: ";
    var_dump($user->roles);
    echo "\n----------------------------\n";
}

echo "✅ All non-admin users toggled successfully.\n";
