<?php

use App\Models\EstateApplication;
use App\Models\Partner;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\assertSoftDeleted;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'affiliate', 'guard_name' => 'web', 'estate_id' => null]);
    $this->seed(PermissionSeeder::class);
});

function softDeletePartnerMember(array $partnerAttrs = []): array
{
    $partner = Partner::factory()->create($partnerAttrs);
    $member = User::factory()->create([
        'user_type' => 'affiliate',
        'partner_id' => $partner->id,
    ]);

    setPermissionsTeamId(0);
    $member->assignRole('affiliate');

    return [$partner, $member];
}

it('allows partners to soft delete rejected estates only', function () {
    [$partner, $member] = softDeletePartnerMember();

    $rejected = EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => $partner->id,
        'estate_name' => 'Rejected Estate',
        'contact_name' => 'Chair',
        'email' => 'reject@estate.test',
        'phone' => '08011112222',
        'status' => 'rejected',
        'rejection_reason' => 'Incomplete docs',
    ]);

    $submitted = EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => $partner->id,
        'estate_name' => 'Open Estate',
        'contact_name' => 'Chair',
        'email' => 'open@estate.test',
        'phone' => '08033334444',
        'status' => 'received',
    ]);

    $this->actingAs($member)
        ->delete(route('partner.partner-requests.destroy', $rejected))
        ->assertRedirect(route('partner.partner-requests.index', ['tab' => 'referrals']))
        ->assertSessionHas('success');

    assertSoftDeleted('estate_applications', ['id' => $rejected->id]);

    $this->actingAs($member)
        ->delete(route('partner.partner-requests.destroy', $submitted))
        ->assertStatus(422);

    assertDatabaseHas('estate_applications', [
        'id' => $submitted->id,
        'deleted_at' => null,
    ]);
});

it('hides partner soft-deleted estates from the partner list but keeps them for zeus', function () {
    [$partner, $member] = softDeletePartnerMember();

    $rejected = EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => $partner->id,
        'estate_name' => 'Hidden Estate',
        'contact_name' => 'Chair',
        'email' => 'hidden@estate.test',
        'phone' => '08055556666',
        'status' => 'rejected',
        'rejection_reason' => 'No go',
    ]);

    $this->actingAs($member)
        ->delete(route('partner.partner-requests.destroy', $rejected))
        ->assertRedirect();

    $this->actingAs($member)
        ->get(route('partner.partner-requests.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Partner/PartnerRequests/Index')
            ->has('partnerRequests', 0)
        );

    // Soft-deleted partner referrals remain in the database for Zeus applications tooling.
    expect(EstateApplication::withTrashed()->find($rejected->id))->not->toBeNull()
        ->and(EstateApplication::withTrashed()->find($rejected->id)?->trashed())->toBeTrue();
});

it('prevents partners from deleting another partners estate', function () {
    [$partnerA, $memberA] = softDeletePartnerMember();
    [$partnerB] = softDeletePartnerMember();

    $rejected = EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => $partnerB->id,
        'estate_name' => 'Other Partner Estate',
        'contact_name' => 'Chair',
        'email' => 'other@estate.test',
        'phone' => '08077778888',
        'status' => 'rejected',
        'rejection_reason' => 'Nope',
    ]);

    $this->actingAs($memberA)
        ->delete(route('partner.partner-requests.destroy', $rejected))
        ->assertForbidden();

    assertDatabaseHas('estate_applications', [
        'id' => $rejected->id,
        'deleted_at' => null,
    ]);
});

it('allows zeus to permanently delete partner applications including soft deleted ones', function () {
    $partner = Partner::factory()->create();

    $trashed = EstateApplication::create([
        'source' => EstateApplication::SOURCE_PARTNER,
        'partner_id' => $partner->id,
        'estate_name' => 'Gone Forever',
        'contact_name' => 'Chair',
        'email' => 'gone@estate.test',
        'phone' => '08099990000',
        'status' => 'rejected',
        'rejection_reason' => 'Final',
    ]);
    $trashed->delete();

    session()->put(config('zeus.session_key'), true);

    $this->delete(route('zeus.applications.destroy', $trashed))
        ->assertRedirect(route('zeus.applications.index'))
        ->assertSessionHas('success');

    assertDatabaseMissing('estate_applications', ['id' => $trashed->id]);
});
