<?php

namespace Database\Factories;

use App\Models\Incident;
use App\Models\IncidentComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<IncidentComment>
 */
class IncidentCommentFactory extends Factory
{
    protected $model = IncidentComment::class;

    public function definition(): array
    {
        return [
            'incident_id' => Incident::factory(),
            'user_id' => User::factory(),
            'body' => fake()->paragraph(),
            'is_official' => fake()->boolean(30),
            'parent_id' => null,
        ];
    }

    public function official(): static
    {
        return $this->state(fn () => ['is_official' => true]);
    }
}
