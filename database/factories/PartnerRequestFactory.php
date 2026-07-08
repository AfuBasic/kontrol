<?php

namespace Database\Factories;

use App\Enums\PartnerRequestStatus;
use App\Models\Partner;
use App\Models\PartnerRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PartnerRequest>
 */
class PartnerRequestFactory extends Factory
{
    protected $model = PartnerRequest::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'estate_name' => fake()->company().' Estate',
            'estate_address' => fake()->streetAddress(),
            'chairman_name' => fake()->name(),
            'chairman_phone' => fake()->phoneNumber(),
            'chairman_email' => fake()->unique()->safeEmail(),
            'number_of_houses' => fake()->numberBetween(20, 500),
            'state' => fake()->state(),
            'lga' => fake()->city(),
            'notes' => fake()->optional()->sentence(),
            'partner_id' => Partner::factory(),
            'status' => PartnerRequestStatus::Submitted,
        ];
    }
}
