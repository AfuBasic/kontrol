<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\HouseholdMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HouseholdMember>
 */
class HouseholdMemberFactory extends Factory
{
    protected $model = HouseholdMember::class;

    public function definition(): array
    {
        return [
            'estate_id' => Estate::factory(),
            'primary_resident_id' => User::factory(),
            'household_member_id' => User::factory(),
        ];
    }
}
