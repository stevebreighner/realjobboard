<?php
declare(strict_types=1);

namespace App\Services;

class Mailer {
  public function send(string $to, string $subject, string $html, ?string $text = null): bool {
    $fromAddress = $_ENV['EMAIL_FROM_ADDRESS'] ?? ('no-reply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $fromName = $_ENV['EMAIL_FROM_NAME'] ?? 'JobBoard';
    $siteName = $_ENV['SITE_NAME'] ?? $fromName;
    $siteUrl = $_ENV['SITE_URL'] ?? ('https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $logoUrl = $_ENV['EMAIL_LOGO_URL'] ?? ($_ENV['LOGO_URL'] ?? '');

    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'From: ' . $this->formatFrom($fromName, $fromAddress);
    $headers[] = 'Reply-To: ' . $fromAddress;

    $body = $this->wrapHtml($subject, $html, $text, $siteName, $siteUrl, $logoUrl);

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

  private function wrapHtml(string $subject, string $html, ?string $text, string $siteName, string $siteUrl, string $logoUrl): string {
    $content = $html;
    if (stripos($content, '<html') !== false) {
      return $content;
    }
    $safeSubject = htmlspecialchars($subject, ENT_QUOTES);
    $safeSite = htmlspecialchars($siteName, ENT_QUOTES);
    $safeUrl = htmlspecialchars($siteUrl, ENT_QUOTES);
    $logo = '';
    if ($logoUrl) {
      $safeLogo = htmlspecialchars($logoUrl, ENT_QUOTES);
      $logo = "<img src=\"{$safeLogo}\" alt=\"{$safeSite} logo\" style=\"height:32px;width:32px;display:block;\" />";
    }
    $textBlock = '';
    if ($text) {
      $textBlock = '<div style="margin-top:16px;color:#64748b;font-size:12px;line-height:1.5;">' .
        nl2br(htmlspecialchars($text, ENT_QUOTES)) .
      '</div>';
    }
    return <<<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>{$safeSubject}</title>
  </head>
  <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
      <div style="background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;box-shadow:0 6px 18px rgba(15,23,42,0.08);">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          {$logo}
          <div style="font-size:16px;font-weight:700;color:#0f172a;">{$safeSite}</div>
        </div>
        <div style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:12px;">{$safeSubject}</div>
        <div style="color:#334155;font-size:14px;line-height:1.6;">{$content}</div>
        {$textBlock}
      </div>
      <div style="font-size:12px;color:#94a3b8;margin-top:12px;text-align:center;">
        <div>{$safeSite} · <a href="{$safeUrl}" style="color:#64748b;text-decoration:none;">{$safeUrl}</a></div>
        <div style="margin-top:4px;">You’re receiving this because you have an account on {$safeSite}.</div>
      </div>
    </div>
  </body>
</html>
HTML;
  }
}
