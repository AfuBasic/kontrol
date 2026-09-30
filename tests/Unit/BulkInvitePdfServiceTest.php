<?php

namespace Tests\Unit;

use App\Services\Visitor\BulkInvitePdfService;

test('generateQrBase64 returns valid data uri', function () {
    $service = new BulkInvitePdfService();

    $url = 'https://app.kontrol.test/pass/test-uuid-12345';
    $dataUri = $service->generateQrBase64($url);

    expect($dataUri)->toBeString()
        ->and($dataUri)->toStartWith('data:image/png;base64,')
        ->and(strlen($dataUri))->toBeGreaterThan(100);
});
