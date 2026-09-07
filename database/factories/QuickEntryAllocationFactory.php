<?php

namespace Database\Factories;

use App\Models\Estate;
use App\Models\QuickEntryAllocation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<QuickEntryAllocation>
 */
class QuickEntryAllocationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tags = collect(range(1, 10))->map(fn () => strtoupper(Str::random(4)))->all();

        return [
            'estate_id' => Estate::factory(),
            'user_id' => User::factory(),
            'checkpoint_id' => 'gate_1',
            'device_fingerprint' => fake()->uuid(),
            'allocated_tags' => $tags,
            'allocated_count' => count($tags),
            'used_count' => 0,
            'expires_at' => now()->addHours(8),
        ];
    }
}
