<?php

use App\Support\BrandTheme;
use App\Support\MaskedEmail;

it('keeps the first and last letter of the name and the whole domain', function () {
    expect(MaskedEmail::mask('afutunde@gmail.com'))->toBe('a•••••e@gmail.com')
        ->and(MaskedEmail::mask('anttentionwatch@gmail.com'))->toBe('a•••••h@gmail.com');
});

it('does not give away how long the name is', function () {
    expect(MaskedEmail::mask('abc@x.org'))->toBe('a•••••c@x.org')
        ->and(substr_count(MaskedEmail::mask('abcdefghijklmnop@x.org'), '•'))->toBe(substr_count(MaskedEmail::mask('abc@x.org'), '•'));
});

it('shows only the first letter of a very short name', function () {
    expect(MaskedEmail::mask('ab@x.org'))->toBe('a•••••@x.org')
        ->and(MaskedEmail::mask('a@x.org'))->toBe('a•••••@x.org');
});

it('masks around the last @ and copes with odd input', function () {
    expect(MaskedEmail::mask('  Ada.Lovelace@Example.COM '))->toBe('A•••••e@Example.COM')
        ->and(MaskedEmail::mask(''))->toBe('')
        ->and(MaskedEmail::mask(null))->toBe('')
        ->and(MaskedEmail::mask('not-an-email'))->toBe('•••••')
        ->and(MaskedEmail::mask('@nobody.org'))->toBe('•••••');
});

it('never leaves the middle of the name readable', function () {
    $masked = MaskedEmail::mask('confidential.person@corp.example');

    expect($masked)->not->toContain('onfidential')->not->toContain('person@');
});

it('reads brand colours from the theme the app is styled with', function () {
    expect(BrandTheme::color('primary-600'))->toBe('#1a5fc2')
        ->and(BrandTheme::color('primary-700'))->toBe('#0a3d91')
        ->and(BrandTheme::color('gray-200'))->toBe('#e5e7eb');
});

it('refuses a colour role the theme does not have instead of inventing one', function () {
    expect(fn () => BrandTheme::color('hot-pink-500'))->toThrow(InvalidArgumentException::class, 'hot-pink-500');
});
