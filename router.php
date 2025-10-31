<?php
if (file_exists($_SERVER['DOCUMENT_ROOT'] . $_SERVER['SCRIPT_NAME'])) {
    return false;
} else {
    include_once 'index.php';
}
