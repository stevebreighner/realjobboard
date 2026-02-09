<?php
declare(strict_types=1);

namespace App\Services;

class Mailer {
  public function send(string $to, string $subject, string $html, ?string $text = null): bool {
    $fromAddress = $_ENV['EMAIL_FROM_ADDRESS'] ?? ('no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $fromName = $_ENV['EMAIL_FROM_NAME'] ?? 'JobBoard';

    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'From: ' . $this->formatFrom($fromName, $fromAddress);
    $headers[] = 'Reply-To: ' . $fromAddress;

    $body = $html;
    if ($text && stripos($html, '<html') === false) {
      $body = $html . "\n\n" . nl2br(htmlspecialchars($text, ENT_QUOTES));
    }

    $ok = @mail($to, $subject, $body, implode("\r\n", $headers));
    if (!$ok) {
      $logDir = __DIR__ . '/../../logs';
      if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
      }
      $line = sprintf("[%s] Mail failed to %s subject=%s\n", date('c'), $to, $subject);
      @file_put_contents($logDir . '/mail.log', $line, FILE_APPEND);
    }
    return $ok;
  }

  private function formatFrom(string $name, string $address): string {
    $cleanName = trim(preg_replace('/[\\r\\n]+/', ' ', $name));
    return sprintf('"%s" <%s>', addslashes($cleanName), $address);
  }
}
