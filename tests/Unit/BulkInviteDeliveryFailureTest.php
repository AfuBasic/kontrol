<?php

use App\Support\BulkInviteDeliveryFailure;

it('turns raw delivery errors into plain-language reasons', function (string $raw, string $expected) {
    expect(BulkInviteDeliveryFailure::friendly($raw))->toContain($expected);
})->with([
    'our own template bug' => ['Undefined variable $colors (View: /Library/WebServer/Documents/projects/kontrol/resources/views/mail/visitor/bulk-pass.blade.php)', 'on our side'],
    'a php class error' => ['Call to a member function foo() on null in /var/www/app/Jobs/X.php:12', 'on our side'],
    'a database error' => ['SQLSTATE[23000]: Integrity constraint violation', 'on our side'],
    'unknown mailbox' => ['Mailbox unavailable', "couldn't be reached"],
    'smtp 550' => ['Expected response code "250" but got code "550", with message "550 5.1.1 User unknown"', "couldn't be reached"],
    'mailbox full' => ['552 Mailbox full', 'inbox is full'],
    'blocked as spam' => ['554 Message rejected as spam', 'blocked'],
    'smtp timeout' => ['Connection timed out after 30 seconds', 'try sending again in a few minutes'],
    'pdf failure' => ['Dompdf failed to render the document', 'pass document'],
    'ran out of retries' => ['Maximum delivery retries reached.', 'several times'],
    'anything unrecognised' => ['Some odd one-off problem', 'contact support'],
]);

it('returns nothing when there was no error', function () {
    expect(BulkInviteDeliveryFailure::friendly(null))->toBeNull()
        ->and(BulkInviteDeliveryFailure::friendly('   '))->toBeNull();
});

it('never leaks paths, class names or SQL into any friendly message', function (string $raw) {
    $friendly = BulkInviteDeliveryFailure::friendly($raw);

    expect($friendly)->not->toContain('/Library')
        ->and($friendly)->not->toContain('.php')
        ->and($friendly)->not->toContain('Undefined')
        ->and($friendly)->not->toContain('SQLSTATE')
        ->and($friendly)->not->toContain('Exception');
})->with([
    'Undefined variable $x (View: /a/b/c.blade.php)',
    'RuntimeException: boom in /app/Foo.php:10',
    'SQLSTATE[HY000]: General error',
]);
