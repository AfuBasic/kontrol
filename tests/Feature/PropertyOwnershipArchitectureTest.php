<?php

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Schema;

test('UserProfile does not have propertyOwner relationship', function () {
    expect(method_exists(UserProfile::class, 'propertyOwner'))->toBeFalse();
});

test('property_owner_id is not on user_profiles table', function () {
    expect(Schema::hasColumn('user_profiles', 'property_owner_id'))->toBeFalse();
});

test('User has propertyOwner relationship via pivot', function () {
    expect(method_exists(User::class, 'getPropertyOwnerForEstate'))->toBeTrue();
});
