<?php

use App\Models\EstateApplication;
use App\Models\Partner;
use App\Models\User;
use App\Notifications\Partner\EstateRequestRejectedNotification;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Notifications\Events\BroadcastNotificationCreated;
use Illuminate\Support\Facades\Broadcast;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'affiliate', 'guard_name' => 'web', 'estate_id' => null]);

    // phpunit.xml sets BROADCAST_CONNECTION=null, so channel callbacks are bound to the
    // null driver at boot. Switch to reverb and re-register channels for auth signature tests.
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-reverb-key',
        'broadcasting.connections.reverb.secret' => 'test-reverb-secret',
        'broadcasting.connections.reverb.app_id' => 'test-reverb-app',
        'broadcasting.connections.reverb.options.host' => 'localhost',
        'broadcasting.connections.reverb.options.port' => 8085,
        'broadcasting.connections.reverb.options.scheme' => 'http',
        'broadcasting.connections.reverb.options.useTLS' => false,
    ]);

    Broadcast::purge('reverb');

    Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
        return (int) $user->id === (int) $id;
    });
});

it('authorizes partner members on their private user notification channel', function () {
    $partner = Partner::factory()->create();
    $member = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $member->assignRole('affiliate');

    $this->actingAs($member)
        ->postJson('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-App.Models.User.'.$member->id,
        ])
        ->assertOk()
        ->assertJsonStructure(['auth']);
});

it('rejects partner members from other users private notification channels', function () {
    $partner = Partner::factory()->create();
    $member = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);
    $other = User::factory()->create();

    setPermissionsTeamId(0);
    $member->assignRole('affiliate');

    $this->actingAs($member)
        ->postJson('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => 'private-App.Models.User.'.$other->id,
        ])
        ->assertForbidden();
});

it('broadcasts estate rejection notifications on the partner user private channel', function () {
    $partner = Partner::factory()->create();
    $member = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    $application = EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => $partner->id,
        'estate_name' => 'Realtime Reject Estate',
        'contact_name' => 'Someone',
        'email' => 'realtime@estate.test',
        'phone' => '08011112222',
        'status' => 'rejected',
        'rejection_reason' => 'Incomplete documentation',
    ]);

    $notification = new EstateRequestRejectedNotification($application, 'Incomplete documentation');
    $event = new BroadcastNotificationCreated($member, $notification, $notification->toArray($member));

    $channels = collect($event->broadcastOn())
        ->map(fn ($channel) => $channel instanceof PrivateChannel ? $channel->name : (string) $channel)
        ->all();

    expect($channels)->toContain('private-App.Models.User.'.$member->id);
    expect($event->broadcastAs())->toBe(BroadcastNotificationCreated::class);

    $payload = $event->broadcastWith();
    expect($payload['severity'] ?? null)->toBe('danger');
    expect($payload['body'] ?? '')->toContain('was rejected');
    expect($payload['body'] ?? '')->not->toContain('Incomplete documentation');
    expect($payload['title'] ?? null)->toBe('Estate request rejected');
});
