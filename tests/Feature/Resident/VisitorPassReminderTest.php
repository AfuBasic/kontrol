<?php

use App\Enums\AccessCodeStatus;
use App\Enums\VisitorPassReminderStatus;
use App\Jobs\Resident\SendVisitorPassRemindersJob;
use App\Models\AccessCode;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Models\Feature;
use App\Models\Plan;
use App\Models\ResidentSubscription;
use App\Models\User;
use App\Models\VisitorPassReminder;
use App\Notifications\Resident\VisitorPassReminderNotification;
use App\Services\Resident\VisitorPassReminderService;
use Database\Seeders\FeatureSeeder;
use Database\Seeders\PlanSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
    $this->seed(FeatureSeeder::class);
    $this->seed(PlanSeeder::class);
});

function createTestResident(Estate $estate): User
{
    $user = User::factory()->create();
    setPermissionsTeamId($estate->id);
    $user->assignRole('resident');
    $user->estates()->attach($estate->id, ['status' => 'accepted']);

    $plan = Plan::first();
    $feature = Feature::where('slug', 'access-code-generation')->first();
    if ($plan && $feature) {
        $plan->features()->syncWithoutDetaching([
            $feature->id => ['is_enabled' => true],
        ]);
    }

    ResidentSubscription::create([
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'plan_id' => $plan ? $plan->id : 1,
        'status' => 'active',
        'current_period_end' => now()->addMonth(),
    ]);

    return $user;
}

test('visitor pass scheduled more than 24 hours in the future is eligible for visit reminder', function () {
    $estate = Estate::factory()->create();
    $user = createTestResident($estate);

    $eligiblePass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'ELG123',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addHours(25),
        'expires_at' => now()->addHours(27),
    ]);

    $ineligiblePass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'INELG1',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addHours(23),
        'expires_at' => now()->addHours(25),
    ]);

    $noStartPass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'NOSTRT',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Active,
        'starts_at' => null,
        'expires_at' => now()->addHours(2),
    ]);

    expect($eligiblePass->isEligibleForVisitReminder())->toBeTrue()
        ->and($ineligiblePass->isEligibleForVisitReminder())->toBeFalse()
        ->and($noStartPass->isEligibleForVisitReminder())->toBeFalse();
});

test('resident can set a reminder for a future scheduled pass', function () {
    $estate = Estate::factory()->create();
    $user = createTestResident($estate);

    $pass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'JANET1',
        'type' => 'single_use',
        'visitor_name' => 'Janet Adebayo',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addDays(2),
        'expires_at' => now()->addDays(2)->addHours(4),
    ]);

    $response = $this->actingAs($user)
        ->withSession(['estate_id' => $estate->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.visitors.reminder.store', $pass), [
            'reminder_offset_minutes' => 120, // 2 hours before
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('visitor_pass_reminders', [
        'access_code_id' => $pass->id,
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'reminder_offset_minutes' => 120,
        'status' => VisitorPassReminderStatus::Scheduled->value,
    ]);

    $reminder = VisitorPassReminder::where('access_code_id', $pass->id)->first();
    expect($reminder->scheduled_for->equalTo($pass->starts_at->subMinutes(120)))->toBeTrue();
});

test('resident cannot set a reminder for someone elses pass', function () {
    $estate = Estate::factory()->create();
    $user1 = createTestResident($estate);
    $user2 = createTestResident($estate);

    $pass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user1->id,
        'code' => 'OTHER1',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addDays(2),
    ]);

    $response = $this->actingAs($user2)
        ->withSession(['estate_id' => $estate->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.visitors.reminder.store', $pass), [
            'reminder_offset_minutes' => 120,
        ]);

    $response->assertNotFound();
    $this->assertDatabaseMissing('visitor_pass_reminders', [
        'access_code_id' => $pass->id,
    ]);
});

test('cannot schedule an offset that is in the past', function () {
    $estate = Estate::factory()->create();
    $user = createTestResident($estate);

    // Pass starts in 2 hours
    $pass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'PAST01',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addHours(2),
        'expires_at' => now()->addHours(4),
    ]);

    // Trying to schedule 6 hours before (which is 4 hours in the past)
    $response = $this->actingAs($user)
        ->withSession(['estate_id' => $estate->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.visitors.reminder.store', $pass), [
            'reminder_offset_minutes' => 360,
        ]);

    $response->assertSessionHasErrors('reminder_offset_minutes');
    $this->assertDatabaseMissing('visitor_pass_reminders', [
        'access_code_id' => $pass->id,
    ]);
});

test('resident can update reminder offset without creating duplicates', function () {
    $estate = Estate::factory()->create();
    $user = createTestResident($estate);

    $pass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'UPD001',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addDays(3),
        'expires_at' => now()->addDays(3)->addHours(4),
    ]);

    // Initial 24 hours before
    $this->actingAs($user)
        ->withSession(['estate_id' => $estate->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.visitors.reminder.store', $pass), [
            'reminder_offset_minutes' => 1440,
        ]);

    expect(VisitorPassReminder::where('access_code_id', $pass->id)->count())->toBe(1);

    // Update to 2 hours before
    $this->actingAs($user)
        ->withSession(['estate_id' => $estate->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.visitors.reminder.store', $pass), [
            'reminder_offset_minutes' => 120,
        ]);

    expect(VisitorPassReminder::where('access_code_id', $pass->id)->count())->toBe(1);
    $this->assertDatabaseHas('visitor_pass_reminders', [
        'access_code_id' => $pass->id,
        'reminder_offset_minutes' => 120,
    ]);
});

test('resident can remove a reminder', function () {
    $estate = Estate::factory()->create();
    $user = createTestResident($estate);

    $pass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'REM001',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addDays(3),
    ]);

    $this->actingAs($user)
        ->withSession(['estate_id' => $estate->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->post(route('resident.visitors.reminder.store', $pass), [
            'reminder_offset_minutes' => 120,
        ]);

    $this->actingAs($user)
        ->withSession(['estate_id' => $estate->id])
        ->withHeaders(['X-Bypass-Mobile-Restrict' => 'true'])
        ->delete(route('resident.visitors.reminder.destroy', $pass));

    $reminder = VisitorPassReminder::where('access_code_id', $pass->id)->first();
    expect($reminder->status)->toBe(VisitorPassReminderStatus::Cancelled)
        ->and($reminder->cancelled_at)->not->toBeNull();
});

test('revoking a pass cancels its scheduled reminder', function () {
    $estate = Estate::factory()->create();
    $user = createTestResident($estate);

    $pass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'RVK001',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addDays(3),
    ]);

    $reminder = VisitorPassReminder::create([
        'access_code_id' => $pass->id,
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'reminder_offset_minutes' => 120,
        'scheduled_for' => $pass->starts_at->subMinutes(120),
        'status' => VisitorPassReminderStatus::Scheduled,
    ]);

    $pass->revoke();

    $reminder->refresh();
    expect($reminder->status)->toBe(VisitorPassReminderStatus::Cancelled)
        ->and($reminder->cancelled_at)->not->toBeNull();
});

test('checking in visitor early cancels scheduled reminder', function () {
    $estate = Estate::factory()->create();
    $user = createTestResident($estate);

    $pass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'CHK001',
        'type' => 'single_use',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addDays(3),
    ]);

    $reminder = VisitorPassReminder::create([
        'access_code_id' => $pass->id,
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'reminder_offset_minutes' => 120,
        'scheduled_for' => $pass->starts_at->subMinutes(120),
        'status' => VisitorPassReminderStatus::Scheduled,
    ]);

    $pass->markAsUsed();

    $reminder->refresh();
    expect($reminder->status)->toBe(VisitorPassReminderStatus::Cancelled)
        ->and($reminder->cancelled_at)->not->toBeNull();
});

test('send visitor pass reminders job delivers notifications and marks reminders sent', function () {
    Notification::fake();

    $estate = Estate::factory()->create();
    $user = createTestResident($estate);

    $pass = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'NOTIF1',
        'type' => 'single_use',
        'visitor_name' => 'Emeka Okafor',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addHours(2),
    ]);

    $dueReminder = VisitorPassReminder::create([
        'access_code_id' => $pass->id,
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'reminder_offset_minutes' => 120,
        'scheduled_for' => now()->subMinute(), // Due now
        'status' => VisitorPassReminderStatus::Scheduled,
    ]);

    $pass2 = AccessCode::create([
        'estate_id' => $estate->id,
        'user_id' => $user->id,
        'code' => 'NOTIF2',
        'type' => 'single_use',
        'visitor_name' => 'Chidi Amadi',
        'status' => AccessCodeStatus::Scheduled,
        'starts_at' => now()->addHours(3),
    ]);

    $futureReminder = VisitorPassReminder::create([
        'access_code_id' => $pass2->id,
        'user_id' => $user->id,
        'estate_id' => $estate->id,
        'reminder_offset_minutes' => 60,
        'scheduled_for' => now()->addHour(), // Not due
        'status' => VisitorPassReminderStatus::Scheduled,
    ]);

    $job = new SendVisitorPassRemindersJob;
    $job->handle(app(VisitorPassReminderService::class));

    Notification::assertSentTo($user, VisitorPassReminderNotification::class, function ($notification) use ($pass) {
        return $notification->accessCode->id === $pass->id;
    });

    $dueReminder->refresh();
    expect($dueReminder->status)->toBe(VisitorPassReminderStatus::Sent)
        ->and($dueReminder->sent_at)->not->toBeNull();

    $futureReminder->refresh();
    expect($futureReminder->status)->toBe(VisitorPassReminderStatus::Scheduled);
});
