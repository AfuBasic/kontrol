<?php

use App\Actions\Zeus\CreateEstateAction;
use App\Mail\Zeus\EstateInvitationMail;
use App\Models\Invitation;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
});

test('creating estate via zeus generates valid invitation record and working invitation mail link', function () {
    Mail::fake();

    $action = app(CreateEstateAction::class);
    $estate = $action->execute([
        'name' => 'Royal Palm Estate',
        'email' => 'admin@royalpalm.com',
        'address' => '123 Royal Palm Way',
    ]);

    expect($estate)->not->toBeNull();

    // Verify User created
    $user = User::where('email', 'admin@royalpalm.com')->first();
    expect($user)->not->toBeNull();

    // Verify Invitation record created
    $invitation = Invitation::withoutGlobalScope(ZoneScope::class)
        ->where('estate_id', $estate->id)
        ->where('email', 'admin@royalpalm.com')
        ->first();

    expect($invitation)->not->toBeNull();
    expect($invitation->isPending())->toBeTrue();

    // Verify Mail was queued and contains valid URL
    Mail::assertQueued(EstateInvitationMail::class, function ($mail) use ($estate, $user, $invitation) {
        return $mail->estate->id === $estate->id
            && $mail->user->id === $user->id
            && str_contains($mail->invitationUrl, $invitation->token);
    });

    // Test visiting the invitation acceptance link
    $response = $this->get(route('invitations.show', ['token' => $invitation->token]));
    $response->assertOk();
});
