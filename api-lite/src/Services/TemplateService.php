<?php
declare(strict_types=1);

namespace App\Services;

class TemplateService {
  public function replaceVars(string $text, array $vars): string {
    foreach ($vars as $key => $value) {
      $text = str_replace('{' . $key . '}', (string) $value, $text);
    }
    return $text;
  }
}
