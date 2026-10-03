<?php

use App\Actions\Organization\CreateBulkVisitorInviteAction;
use App\Jobs\DeliverBulkVisitorPassJob;
use App\Mail\BulkVisitorPassMail;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\OrganizationMembership;
use App\Models\User;
use App\Services\Visitor\BulkInvitePdfService;
use App\Support\BrandTheme;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake();
    $this->seed(RolesAndPermissionsSeeder::class);

    $this->estate = Estate::factory()->create(['name' => 'Golden Heights']);
    $this->org = EstateOrganization::factory()->create(['estate_id' => $this->estate->id, 'name' => 'OSBA', 'type' => 'business', 'is_active' => true]);

    $this->host = User::factory()->create(['name' => 'Ada Tunde']);
    OrganizationMembership::create(['user_id' => $this->host->id, 'organization_id' => $this->org->id, 'role' => 'admin', 'is_active' => true]);

    $this->makeGroup = fn (array $emails, ?string $purpose = 'Estate AGM', bool $single = false) => app(CreateBulkVisitorInviteAction::class)->execute(
        organization: $this->org,
        user: $this->host,
        emails: $emails,
        name: 'Residents',
        purpose: $purpose,
        singleEntry: $single,
    );

    $this->mailFor = function ($group, string $email, ?string $pdf = '%PDF-fake') {
        $recipient = $group->recipients()->where('email', $email)->firstOrFail();

        return new BulkVisitorPassMail(AccessCode::findOrFail($recipient->last_access_code_id), $pdf, $recipient);
    };
});

it('leads with the passcode and says who the pass is for and what for', function () {
    $this->host->profile()->create(['unit_number' => 'Block C, Flat 4']);
    $group = ($this->makeGroup)(['afutunde@gmail.com', 'two@example.com']);
    $mail = ($this->mailFor)($group, 'afutunde@gmail.com');

    $html = $mail->render();

    expect($html)->toContain('Your pass for Estate AGM')
        ->and($html)->toContain($mail->accessCode->code)
        ->and($html)->toContain('Ada Tunde, Block C, Flat 4')
        ->and($html)->toContain('Multiple entry')
        ->and($html)->toContain('1 of 2')
        ->and($html)->toContain('Open digital pass');
});

it('shows the visitor\'s email masked and never in full', function () {
    $group = ($this->makeGroup)(['afutunde@gmail.com', 'two@example.com']);

    $html = ($this->mailFor)($group, 'afutunde@gmail.com')->render();

    expect($html)->toContain('a•••••e@gmail.com')->not->toContain('afutunde@gmail.com');
});

it('names the organization and estate once, not again in a table', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);

    $html = ($this->mailFor)($group, 'one@example.com')->render();

    expect(substr_count($html, 'OSBA'))->toBe(1)
        ->and(substr_count($html, 'Golden Heights'))->toBe(1)
        ->and($html)->not->toContain('Organization')->not->toContain('>Estate<');
});

it('does not put the QR code in the email: it stays in the PDF', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);

    $html = ($this->mailFor)($group, 'one@example.com')->render();

    // Only the two logo images (light and dark mode): no QR, whether linked, inline or embedded.
    expect(substr_count($html, '<img'))->toBe(2)
        ->and($html)->not->toContain('data:image')->not->toContain('cid:')->not->toContain('qr');
});

it('drops the generic greeting, the repeated badge and the old black button', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);

    $html = ($this->mailFor)($group, 'one@example.com')->render();

    expect($html)->not->toContain('Hello,')->not->toContain('Access Pass</div>')->not->toContain('background-color: #0f172a; color: #ffffff')->not->toContain('View Digital Pass');
});

it('gives the inbox a useful preview line', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);

    $html = ($this->mailFor)($group, 'one@example.com')->render();

    expect($html)->toContain('Give security your passcode at the gate. Valid');
});

it('puts the event in the subject when there is one, and not a made-up one when there is not', function () {
    $withEvent = ($this->makeGroup)(['a@example.com', 'b@example.com'], 'Annual Dinner');
    $without = ($this->makeGroup)(['c@example.com', 'd@example.com'], null);

    expect(($this->mailFor)($withEvent, 'a@example.com')->envelope()->subject)->toBe('Your pass for Annual Dinner · OSBA')
        ->and(($this->mailFor)($without, 'c@example.com')->envelope()->subject)->toBe('Your visitor pass · OSBA');

    expect(($this->mailFor)($without, 'c@example.com')->render())->toContain('Your visitor pass')->not->toContain('OSBA - Visitor Pass');
});

it('tells a single-entry visitor their pass works once, and a lone pass is not numbered', function () {
    $group = ($this->makeGroup)(['solo@example.com'], 'Estate AGM', true);

    $html = ($this->mailFor)($group, 'solo@example.com')->render();

    expect($html)->toContain('Single entry')->not->toContain('1 of 1');
});

it('mentions the PDF only when there is one attached', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);

    expect(($this->mailFor)($group, 'one@example.com', '%PDF-fake')->render())->toContain('also attached as a PDF')
        ->and(($this->mailFor)($group, 'one@example.com', null)->render())->not->toContain('attached as a PDF');
});

it('asks for photo ID and for the pass not to be forwarded', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);

    $html = ($this->mailFor)($group, 'one@example.com')->render();

    expect($html)->toContain('valid photo ID')->toContain("Please don't forward it");
});

it('uses theme colours, so the email matches the PDF and the app', function () {
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);

    $html = ($this->mailFor)($group, 'one@example.com')->render();

    expect($html)->toContain(BrandTheme::color('primary-600'))->toContain(BrandTheme::color('primary-700'));
});

it('still renders the essentials for a pass that has no recipient record to describe', function () {
    $loose = AccessCode::create([
        'estate_id' => $this->estate->id,
        'user_id' => $this->host->id,
        'code' => 'ZZ99AA',
        'type' => 'bulk_visitor',
        'status' => 'active',
        'starts_at' => now(),
        'expires_at' => now()->addDays(3),
    ]);

    $html = (new BulkVisitorPassMail($loose, null))->render();

    expect($html)->toContain('ZZ99AA')->toContain('Open digital pass');
});

it('is what the delivery job sends, with the PDF attached and the recipient passed along', function () {
    Mail::fake();
    $group = ($this->makeGroup)(['one@example.com', 'two@example.com']);
    $recipient = $group->recipients()->where('email', 'one@example.com')->firstOrFail();

    (new DeliverBulkVisitorPassJob($recipient->last_access_code_id, $recipient->id))->handle(app(BulkInvitePdfService::class));

    Mail::assertSent(BulkVisitorPassMail::class, fn (BulkVisitorPassMail $mail) => $mail->hasTo('one@example.com')
        && $mail->pdfContents !== null
        && $mail->recipient?->is($recipient)
        && $mail->envelope()->subject === 'Your pass for Estate AGM · OSBA');
    expect($recipient->fresh()->delivery_status)->toBe('sent');
});

it('leaves other emails alone: the preview slot is invisible unless an email asks for it', function () {
    $html = view('mail.layout')->render();

    expect($html)->not->toContain('mso-hide:all;">');
});

it('saves a preview when asked', function () {
    if (! ($dir = getenv('PASS_SAMPLE_DIR'))) {
        expect(true)->toBeTrue();

        return;
    }

    $group = ($this->makeGroup)(['afutunde@gmail.com', 'two@example.com', 'three@example.com']);
    $html = ($this->mailFor)($group, 'afutunde@gmail.com')->render();

    @mkdir($dir, 0775, true);
    file_put_contents($dir.'/pass-email.html', str_replace(config('app.url').'/assets', 'file://'.public_path('assets'), $html));
    expect(true)->toBeTrue();
});
