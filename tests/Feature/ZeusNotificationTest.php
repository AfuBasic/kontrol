<?php

use App\Models\Partner;
use App\Models\User;
use App\Models\ZeusNotification;
use Database\Seeders\PermissionSeeder;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::create(['name' => 'affiliate', 'guard_name' => 'web', 'estate_id' => null]);
    $this->seed(PermissionSeeder::class);
});

it('creates a zeus notification when a partner submits an estate request', function () {
    $partner = Partner::factory()->create(['name' => 'Apex Network']);
    $affiliate = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $affiliate->assignRole('affiliate');

    $this->actingAs($affiliate)
        ->post(route('partner.partner-requests.store'), [
            'estate_name' => 'Lekki Gardens',
            'estate_address' => '1 Palm Drive',
            'chairman_name' => 'Ada Okonkwo',
            'chairman_phone' => '08012345678',
            'chairman_email' => 'ada@lekki.test',
            'number_of_houses' => 80,
            'state' => 'Lagos',
            'lga' => 'Eti-Osa',
        ])
        ->assertRedirect(route('partner.partner-requests.index'));

    $notification = ZeusNotification::query()->latest('id')->first();

    expect($notification)->not->toBeNull()
        ->and($notification->type)->toBe('partner_estate_request')
        ->and($notification->title)->toBe('New partner estate request')
        ->and($notification->body)->toContain('Apex Network')
        ->and($notification->body)->toContain('Lekki Gardens')
        ->and($notification->action_url)->toBe(route('zeus.partner-requests.index'))
        ->and($notification->read_at)->toBeNull();
});

it('allows zeus to view and mark notifications as read', function () {
    $sessionKey = config('zeus.session_key');
    $notification = ZeusNotification::factory()->create([
        'title' => 'Pipeline alert',
        'body' => 'Something needs review',
    ]);

    $this->withSession([$sessionKey => true])
        ->get(route('zeus.notifications.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Zeus/Notifications/Index')
            ->has('notifications.data', 1)
            ->where('unreadCount', 1)
        );

    $this->withSession([$sessionKey => true])
        ->post(route('zeus.notifications.read', $notification))
        ->assertRedirect();

    expect($notification->fresh()->read_at)->not->toBeNull();
});

it('allows zeus to mark all notifications as read', function () {
    $sessionKey = config('zeus.session_key');
    ZeusNotification::factory()->count(3)->create();

    $this->withSession([$sessionKey => true])
        ->post(route('zeus.notifications.read-all'))
        ->assertRedirect();

    expect(ZeusNotification::query()->unread()->count())->toBe(0);
});
