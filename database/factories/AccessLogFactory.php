<?php

namespace Database\Factories;

use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\EstateOrganization;
use App\Models\User;
use App\Models\VisitorProfile;
use App\Models\Zone;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AccessLog>
 */
class AccessLogFactory extends Factory
{
    protected $model = AccessLog::class;

    public function definition(): array
    {
        $verifiedAt = now()->subHours(fake()->numberBetween(1, 720));

        return [
            'estate_id' => Estate::factory(),
            'organization_id' => null,
            'zone_id' => null,
            'visitor_profile_id' => null,
            'access_code_id' => AccessCode::factory(),
            'entry_point' => fake()->randomElement(['Main Gate', 'Side Gate', 'Back Entrance', 'Pedestrian Gate']),
            'verified_by' => User::factory(),
            'verified_at' => $verifiedAt,
            'checked_out_at' => fake()->optional(0.7)->dateTimeBetween($verifiedAt, now()),
            'vehicle_plate_number' => null,
            'vehicle_make' => null,
            'vehicle_model' => null,
            'meta' => [],
        ];
    }

    public function withVehicle(): static
    {
        return $this->state(fn () => [
            'vehicle_plate_number' => strtoupper(fake()->bothify('??-###-??')),
            'vehicle_make' => fake()->randomElement(['Toyota', 'Honda', 'Ford', 'Hyundai', 'Kia', 'Mercedes', 'BMW']),
            'vehicle_model' => fake()->randomElement(['Camry', 'Civic', 'Hilux', 'Elantra', 'Sorento', 'C-Class', 'X5']),
        ]);
    }

    public function dated(CarbonInterface $date): static
    {
        return $this->state(fn () => [
            'verified_at' => $date,
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }
}
