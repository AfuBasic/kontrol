<?php

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Schema;

test('UserProfile has propertyOwner relationship', function () {
    expect(method_exists(UserProfile::class, 'propertyOwner'))->toBeTrue();
});

test('property_owner_id is on user_profiles table', function () {
    expect(Schema::hasColumn('user_profiles', 'property_owner_id'))->toBeTrue();
});

test('User has propertyOwner relationship via pivot', function () {
    expect(method_exists(User::class, 'getPropertyOwnerForEstate'))->toBeTrue();
});
