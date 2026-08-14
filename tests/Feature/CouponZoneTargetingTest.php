<?php

use App\Models\Coupon;
use App\Models\Estate;
use App\Models\Property;
use App\Models\User;
use App\Models\UserProfile;
use App\Models\Zone;
use App\Services\CouponService;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'resident', 'guard_name' => 'web']);

    $this->estate = Estate::factory()->create();
    $this->zoneA = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone A']);
    $this->zoneB = Zone::factory()->create(['estate_id' => $this->estate->id, 'name' => 'Zone B']);

    $this->residentA = User::factory()->create();
    $this->residentB = User::factory()->create();
    setPermissionsTeamId($this->estate->id);
    $this->residentA->assignRole('resident');
    $this->residentB->assignRole('resident');

    $this->estate->users()->attach($this->residentA->id, [
        'status' => 'accepted',
        'zone_id' => $this->zoneA->id,
    ]);
    $this->estate->users()->attach($this->residentB->id, [
        'status' => 'accepted',
        'zone_id' => $this->zoneB->id,
    ]);

    $propertyA = Property::withoutZoneIsolation()->create([
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneA->id,
        'property_owner_id' => $this->residentA->id,
        'name' => 'A-1',
    ]);
    $propertyB = Property::withoutZoneIsolation()->create([
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneB->id,
        'property_owner_id' => $this->residentB->id,
        'name' => 'B-1',
    ]);

    UserProfile::create(['user_id' => $this->residentA->id, 'property_id' => $propertyA->id]);
    UserProfile::create(['user_id' => $this->residentB->id, 'property_id' => $propertyB->id]);
});

it('lets zeus create an estate coupon scoped to a zone', function () {
    $this->withSession([config('zeus.session_key') => true])
        ->post(route('zeus.coupons.store'), [
            'campaign_name' => 'Zone A Discount',
            'code' => 'ZONEA10',
            'type' => 'percentage',
            'value' => 10,
            'scope' => 'estate',
            'estate_id' => $this->estate->id,
            'zone_id' => $this->zoneA->id,
        ])
        ->assertRedirect(route('zeus.coupons.index'));

    $this->assertDatabaseHas('coupons', [
        'code' => 'ZONEA10',
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneA->id,
    ]);
});

it('rejects a zone-scoped coupon for residents outside the zone', function () {
    $coupon = Coupon::create([
        'code' => 'ZONEONLY',
        'campaign_name' => 'Zone A Only',
        'type' => 'percentage',
        'value' => 15,
        'estate_id' => $this->estate->id,
        'zone_id' => $this->zoneA->id,
        'status' => 'active',
    ]);

    expect($coupon->isValidFor($this->residentA, $this->estate))->toBeTrue()
        ->and($coupon->isValidFor($this->residentB, $this->estate))->toBeFalse();

    $service = app(CouponService::class);

    expect($service->validate('ZONEONLY', $this->residentA, $this->estate)['status'])->toBe('success')
        ->and($service->validate('ZONEONLY', $this->residentB, $this->estate))->toMatchArray([
            'status' => 'error',
            'message' => 'This coupon is not valid for your zone.',
        ]);
});
