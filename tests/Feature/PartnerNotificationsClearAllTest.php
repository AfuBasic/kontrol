<?php

use App\Models\Partner;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'affiliate', 'guard_name' => 'web', 'estate_id' => null]);
    $this->seed(PermissionSeeder::class);
});

function partnerNotificationsMember(): User
{
    $partner = Partner::factory()->create(['status' => 'active']);
    $member = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $member->assignRole('affiliate');

    return $member;
}

it('clears all partner notifications', function () {
    $member = partnerNotificationsMember();
    $other = User::factory()->create();

    // Seed two database notifications for the partner member without broadcasting/mail.
    Notification::sendNow(
        $member,
        new class extends Illuminate\Notifications\Notification
        {
            public function via(object $notifiable): array
            {
                return ['database'];
            }

            /**
             * @return array<string, mixed>
             */
            public function toArray(object $notifiable): array
            {
                return [
                    'title' => 'Test notification',
                    'body' => 'Something happened.',
                    'url' => '/partner/dashboard',
                ];
            }
        }
    );

    Notification::sendNow(
        $member,
        new class extends Illuminate\Notifications\Notification
        {
            public function via(object $notifiable): array
            {
                return ['database'];
            }

            /**
             * @return array<string, mixed>
             */
            public function toArray(object $notifiable): array
            {
                return [
                    'title' => 'Another notification',
                    'body' => 'Something else happened.',
                    'url' => '/partner/earnings',
                ];
            }
        }
    );

    Notification::sendNow(
        $other,
        new class extends Illuminate\Notifications\Notification
        {
            public function via(object $notifiable): array
            {
                return ['database'];
            }

            /**
             * @return array<string, mixed>
             */
            public function toArray(object $notifiable): array
            {
                return [
                    'title' => 'Other user',
                    'body' => 'Should remain.',
                ];
            }
        }
    );

    expect($member->notifications()->count())->toBe(2);
    expect($other->notifications()->count())->toBe(1);

    $this->actingAs($member)
        ->post(route('partner.notifications.clear-all'))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($member->fresh()->notifications()->count())->toBe(0);
    expect($other->fresh()->notifications()->count())->toBe(1);
});

it('requires authentication to clear partner notifications', function () {
    $this->post(route('partner.notifications.clear-all'))
        ->assertRedirect();
});
