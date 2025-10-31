<?php


function get_encryption_key($user_id) {
    // Retrieve the stored encryption key from user meta
    $stored_key = get_user_meta($user_id, 'encryption_key', true);

    if ($stored_key) {
        // If the encryption key exists, convert it from hexadecimal and return it
        return hex2bin($stored_key);
    }

    // If no key exists, generate and store a new one
    return save_encryption_key($user_id); // Save a new key and return it
}
function save_encryption_key($user_id) {
    // Generate a new encryption key
    $encryption_key = sodium_crypto_secretbox_keygen();

    // Store the encryption key in the user meta (ensure it's securely hashed or encrypted in a real-world scenario)
    update_user_meta($user_id, 'encryption_key', bin2hex($encryption_key));  // Store key in hexadecimal format

    return $encryption_key;
}

function encrypt_file($file_path, $user_id) {
    // Retrieve the encryption key for the user (it will check if the key exists or generate one)
    $encryption_key = get_encryption_key($user_id);

    // Read file contents
    $data = file_get_contents($file_path);

    // Generate a random nonce (for additional security)
    $nonce = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);

    // Encrypt the data using the encryption key and nonce
    $encrypted_data = sodium_crypto_secretbox($data, $nonce, $encryption_key);

    // Save the encrypted file
    $encrypted_file_path = $file_path . '.enc';
    file_put_contents($encrypted_file_path, $nonce . $encrypted_data);  // Store nonce with encrypted data

    return $encrypted_file_path;
}

function decrypt_file($encrypted_file_path, $user_id) {
    // Retrieve the encryption key for the user
    $encryption_key = get_encryption_key($user_id);

    // Read encrypted file
    $encrypted_data = file_get_contents($encrypted_file_path);

    // Separate the nonce and the encrypted content
    $nonce = substr($encrypted_data, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);
    $encrypted_content = substr($encrypted_data, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);

    // Decrypt the file
    $decrypted_data = sodium_crypto_secretbox_open($encrypted_content, $nonce, $encryption_key);

    // If decryption failed, return false
    if ($decrypted_data === false) {
        return false; // Decryption failed, possibly due to wrong key
    }

    // Save decrypted content to a new file
    $decrypted_file_path = $encrypted_file_path . '.decrypted';
    file_put_contents($decrypted_file_path, $decrypted_data);

    return $decrypted_file_path;
}
?>