<?php

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Services\Visitor\BulkInvitePdfService;
use App\Support\BrandTheme;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake();
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create(['name' => 'Golden Heights']);
    $this->org = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'name' => 'OSBA', 'type' => 'business', 'is_active' => true]);

    $this->host = User::factory()->create(['name' => 'Ada Tunde']);
    OrganizationMembership::create(['user_id' => $this->host->id, 'organization_id' => $this->org->id, 'role' => 'admin', 'is_active' => true]);

    $this->makeGroup = fn (array $emails, ?string $purpose = 'Estate AGM') => app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $this->org,
        user: $this->host,
        emails: $emails,
        name: 'Residents',
        purpose: $purpose,
    );

    $this->passFor = function ($group, string $email) {
        $recipient = $group->recipients()->where('email', $email)->firstOrFail();

        return [$recipient, AccessCode::findOrFail($recipient->last_access_code_id)];
    };

    $this->service = fn () => app(BulkInvitePdfService::class);
    $this->html = fn ($recipient, $code) => view('pdf.visitor.bulk-invite-pass', ($this->service)()->passViewData($recipient, $code))->render();
});

it('never claims the pass is valid, only when it was issued', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);
    [$recipient, $code] = ($this->passFor)($group, 'one@example.com');

    $html = ($this->html)($recipient, $code);

    expect($html)->not->toContain('Valid Pass')->not->toContain('VALID PASS')
        ->and($html)->toContain('Issued '.$code->created_at->format('M d, Y'));
});

it('shows the visitor\'s email masked, never in full, and tells them security may ask', function () {
    $group = ($this->makeGroup)(['afutunde@gmail.com', 'other@example.com']);
    [$recipient, $code] = ($this->passFor)($group, 'afutunde@gmail.com');

    $html = ($this->html)($recipient, $code);

    expect($html)->toContain('a•••••e@gmail.com')
        ->and($html)->not->toContain('afutunde@gmail.com')
        ->and($html)->toContain('Security may ask which email address this pass was sent to.');
});

it('says who the visitor is coming to see', function () {
    $this->host->profile()->create(['unit_number' => 'Block C, Flat 4']);
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);
    [$recipient, $code] = ($this->passFor)($group, 'one@example.com');

    $html = ($this->html)($recipient, $code);

    expect($html)->toContain('Visiting')->toContain('Ada Tunde')->toContain('Block C, Flat 4');
});

it('still names the host when there is no unit on record', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);
    [$recipient, $code] = ($this->passFor)($group, 'one@example.com');

    $html = ($this->html)($recipient, $code);

    expect($html)->toContain('Ada Tunde')->not->toContain('Flat');
});

it('names the organization and estate once, in the header', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);
    [$recipient, $code] = ($this->passFor)($group, 'one@example.com');

    $html = ($this->html)($recipient, $code);

    expect(substr_count($html, 'OSBA'))->toBe(1)
        ->and(substr_count($html, 'Golden Heights'))->toBe(1);
});

it('shows the event or reason the batch was sent for', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com'], 'Annual Dinner');
    [$recipient, $code] = ($this->passFor)($group, 'one@example.com');

    expect(($this->html)($recipient, $code))->toContain('Annual Dinner');
});

it('leaves the reason out, rather than printing a made-up one, when none was given', function () {
    foreach ([null, '', '   '] as $blank) {
        $group = ($this->makeGroup)(['a@example.com', 'b@example.com'], $blank);
        [$recipient, $code] = ($this->passFor)($group, 'a@example.com');

        $html = ($this->html)($recipient, $code);

        expect($html)->not->toContain('Visitor Pass</div>')
            ->and($html)->not->toContain('OSBA - Visitor Pass')
            ->and($html)->not->toContain('<td class="k">For</td>')
            ->and($html)->toContain('Multiple entry');
    }
});

it('says whether the pass works once or repeatedly', function () {
    $service = ($this->service)();

    expect($service->entryMode('single_use')['label'])->toBe('Single entry')
        ->and($service->entryMode('bulk_visitor')['label'])->toBe('Multiple entry')
        ->and($service->entryMode('event')['label'])->toBe('Multiple entry')
        ->and($service->entryMode('long_lived')['label'])->toBe('Multiple entry');
});

it('numbers each pass within its batch', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com', 'three@example.com']);

    [$r1, $c1] = ($this->passFor)($group, 'one@example.com');
    [$r3, $c3] = ($this->passFor)($group, 'three@example.com');

    expect(($this->html)($r1, $c1))->toContain('Pass 1 of 3')
        ->and(($this->html)($r3, $c3))->toContain('Pass 3 of 3');
});

it('does not number a pass that is on its own', function () {
    $group = ($this->makeGroup)(['solo@example.com']);
    [$recipient, $code] = ($this->passFor)($group, 'solo@example.com');

    expect(($this->html)($recipient, $code))->not->toContain('Pass 1 of 1')->not->toContain('<td class="k">Pass</td>');
});

it('keeps a pass\'s number when someone earlier in the batch is removed', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com', 'three@example.com']);
    [$r3, $c3] = ($this->passFor)($group, 'three@example.com');

    $group->recipients()->where('email', 'one@example.com')->update(['status' => 'revoked']);

    expect(($this->html)($r3, $c3))->toContain('Pass 3 of 3');
});

it('keeps what the pass has always carried: dates, passcode, reference and the generated line', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);
    [$recipient, $code] = ($this->passFor)($group, 'one@example.com');

    $html = ($this->html)($recipient, $code);

    expect($html)->toContain('Valid from')->toContain('Valid until')
        ->and($html)->toContain($code->code)
        ->and($html)->toContain($code->pass_uuid)
        ->and($html)->toContain('Generated on')
        ->and($html)->toContain('data:image/png;base64,');
});

it('asks for photo ID at the gate and keeps the original instructions', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);
    [$recipient, $code] = ($this->passFor)($group, 'one@example.com');

    $html = ($this->html)($recipient, $code);

    expect($html)->toContain('Security may ask for valid photo ID.')
        ->and($html)->toContain('printed or on your phone')
        ->and($html)->toContain('scan the QR code')
        ->and($html)->toContain('6-character passcode');
});

it('uses only colours the app theme defines', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);
    [$recipient, $code] = ($this->passFor)($group, 'one@example.com');

    $colors = ($this->service)()->passViewData($recipient, $code)['colors'];

    expect($colors['header'])->toBe(BrandTheme::color('primary-600'))
        ->and(array_values($colors))->each->toMatch('/^#[0-9a-f]{6}$/');
});

it('renders a real one-page A4 PDF for a batch pass and for a lone pass', function () {
    $batch = ($this->makeGroup)(['one@example.com', 'two@example.com', 'three@example.com']);
    $solo = ($this->makeGroup)(['solo@example.com'], null);

    foreach ([[$batch, 'two@example.com'], [$solo, 'solo@example.com']] as [$group, $email]) {
        [$recipient, $code] = ($this->passFor)($group, $email);

        $path = ($this->service)()->generatePassPdf($recipient, $code);
        $bytes = file_get_contents($path);

        if ($dir = getenv('PASS_SAMPLE_DIR')) {
            @mkdir($dir, 0775, true);
            copy($path, $dir.'/'.($group === $solo ? 'pass-single' : 'pass-bulk').'.pdf');
        }

        expect($bytes)->toStartWith('%PDF')
            ->and(preg_match_all('/\/Type\s*\/Page[^s]/', $bytes))->toBe(1);
    }
});
