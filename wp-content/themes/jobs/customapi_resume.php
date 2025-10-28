<?php


function customapi_upload_resume($request) {
  if (!is_user_logged_in()) return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
  if (empty($_FILES['resume'])) return new WP_Error('no_file', 'No file uploaded', ['status' => 400]);

  $file = $_FILES['resume'];
  $allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!in_array($file['type'], $allowed)) return new WP_Error('invalid_type', 'Only PDF or Word docs', ['status' => 415]);
  if ($file['size'] > 3 * 1024 * 1024) return new WP_Error('too_large', 'File must be < 3MB', ['status' => 413]);

  require_once ABSPATH . 'wp-admin/includes/file.php';
  $upload = wp_handle_upload($file, ['test_form' => false]);
  if (isset($upload['error'])) return new WP_Error('upload_error', $upload['error'], ['status' => 500]);

  global $wpdb, $current_user;
  wp_get_current_user();
  $wpdb->insert('wp16_user_resumes', [
    'user_id' => $current_user->ID,
    'file_name' => basename($upload['file']),
    'file_url' => $upload['url'],
    'file_size' => $file['size'],
    'notes' => sanitize_text_field($request['notes'] ?? '')
  ]);

  $resume = $wpdb->get_row("SELECT * FROM wp16_user_resumes WHERE id = " . $wpdb->insert_id);
  return ['message' => '✅ Uploaded', 'resume' => $resume];
}





function customapi_delete_resume($request) {
  if (!is_user_logged_in()) return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
  global $wpdb, $current_user;
  wp_get_current_user();

  $id = (int)$request['id'];
  $resume = $wpdb->get_row("SELECT * FROM wp16_user_resumes WHERE id = $id AND user_id = {$current_user->ID}");
  if (!$resume) return new WP_Error('not_found', 'Resume not found', ['status' => 404]);

  $upload_dir = wp_get_upload_dir();
  $local_path = str_replace($upload_dir['baseurl'], $upload_dir['basedir'], $resume->file_url);
  if (file_exists($local_path)) @unlink($local_path);

  $wpdb->delete('wp16_user_resumes', ['id' => $id]);
  return ['message' => '✅ Resume deleted'];
}



function customapi_update_resume_notes($request) {
  if (!is_user_logged_in()) return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
  global $wpdb, $current_user;
  wp_get_current_user();

  $id = (int)$request['id'];
  $notes = sanitize_text_field($request['notes']);
  $wpdb->update('wp16_user_resumes', ['notes' => $notes], ['id' => $id, 'user_id' => $current_user->ID]);

  return ['message' => '✅ Notes updated'];
}


function customapi_get_resumes() {
  if (!is_user_logged_in()) return new WP_Error('unauthorized', 'Login required', ['status' => 403]);
  global $wpdb, $current_user;
  wp_get_current_user();
  return $wpdb->get_results("SELECT * FROM wp16_user_resumes WHERE user_id = {$current_user->ID} ORDER BY id DESC");
}




?>