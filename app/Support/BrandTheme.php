<?php

namespace App\Support;

use InvalidArgumentException;
use RuntimeException;

/**
 * The app's colour tokens, read from the one place they are defined: the `@theme` block in
 * resources/css/app.css.
 *
 * A PDF cannot read CSS variables, but PHP can read the file that defines them. Asking for a token that
 * does not exist is an error on purpose: if a design needs a colour role the theme lacks, that gets
 * flagged and added to the theme, not invented in a template.
 */
class BrandTheme
{
    /** @var array<string, string>|null */
    private static ?array $colors = null;

    /**
     * @param  string  $token  e.g. 'primary-600' for --color-primary-600
     */
    public static function color(string $token): string
    {
        $colors = self::colors();

        if (! isset($colors[$token])) {
            throw new InvalidArgumentException("The theme has no colour token '{$token}'. Add it to the @theme block in resources/css/app.css.");
        }

        return $colors[$token];
    }

    /**
     * @return array<string, string>
     */
    public static function colors(): array
    {
        if (self::$colors !== null) {
            return self::$colors;
        }

        $path = resource_path('css/app.css');
        $css = is_file($path) ? file_get_contents($path) : false;

        if ($css === false || ! preg_match('/@theme\s*\{(.*?)\n\}/s', $css, $block)) {
            throw new RuntimeException('Could not read the @theme block from resources/css/app.css.');
        }

        preg_match_all('/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\b/', $block[1], $matches, PREG_SET_ORDER);

        return self::$colors = collect($matches)->mapWithKeys(fn (array $m) => [$m[1] => strtolower($m[2])])->all();
    }

    /** Forget what was read, so a changed stylesheet is picked up (used by tests). */
    public static function flush(): void
    {
        self::$colors = null;
    }
}
