<?php

namespace Database\Factories;

use App\Enums\IncidentPriority;
use App\Enums\IncidentSource;
use App\Enums\IncidentStatus;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Incident>
 */
class IncidentFactory extends Factory
{
    protected $model = Incident::class;

    private static array $categories = [
        'Theft',
        'Noise Complaint',
        'Vandalism',
        'Unauthorized Entry',
        'Property Damage',
        'Medical Emergency',
    ];

    private static array $titles = [
        'Suspicious person spotted near Block C',
        'Loud music from apartment 4B',
        'Car window smashed in parking lot',
        'Stray dog on the estate grounds',
        'Broken fence near rear gate',
        'Power outage in Block A',
        'Water pipe burst near Zone 2',
        'Unauthorized vehicle parked in residents space',
        'Resident reported theft of generator',
        'Graffiti found on boundary wall',
        'Fighting incident near the pool area',
        'Security light out on the main road',
        'Fire scare near the estate kitchen',
        'Unknown individuals loitering at the gate',
        'Flooding due to blocked drainage',
    ];

    public function definition(): array
    {
        $status = fake()->randomElement(IncidentStatus::cases());
        $createdAt = now()->subDays(fake()->numberBetween(0, 365));

        return [
            'estate_id' => Estate::factory(),
            'zone_id' => null,
            'reporter_id' => User::factory(),
            'reporter_type' => User::class,
            'source' => fake()->randomElement(IncidentSource::cases()),
            'title' => fake()->randomElement(self::$titles),
            'body' => fake()->paragraphs(2, true),
            'category' => fake()->randomElement(self::$categories),
            'priority' => fake()->randomElement(IncidentPriority::cases()),
            'status' => $status,
            'assigned_to' => null,
            'upvotes_count' => fake()->numberBetween(0, 20),
            'comments_count' => 0,
            'attachment_url' => null,
            'attachment_type' => null,
            'attachment_hash' => null,
            'acknowledged_at' => in_array($status, [IncidentStatus::Acknowledged, IncidentStatus::Resolving, IncidentStatus::Solved, IncidentStatus::Closed])
                ? $createdAt->copy()->addHours(fake()->numberBetween(1, 12))
                : null,
            'solved_at' => in_array($status, [IncidentStatus::Solved, IncidentStatus::Closed])
                ? $createdAt->copy()->addHours(fake()->numberBetween(24, 72))
                : null,
            'closed_at' => $status === IncidentStatus::Closed
                ? $createdAt->copy()->addDays(fake()->numberBetween(3, 10))
                : null,
            'resolving_at' => $status === IncidentStatus::Resolving
                ? $createdAt->copy()->addHours(fake()->numberBetween(12, 36))
                : null,
            'location' => fake()->optional(0.4)->streetAddress(),
            'is_private' => fake()->boolean(15),
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ];
    }

    public function critical(): static
    {
        return $this->state(fn () => [
            'priority' => IncidentPriority::Critical,
            'status' => IncidentStatus::Pending,
        ]);
    }

    public function resolved(): static
    {
        return $this->state(fn () => [
            'status' => IncidentStatus::Solved,
            'solved_at' => now()->subDays(fake()->numberBetween(1, 30)),
        ]);
    }

    public function dated(CarbonInterface $date): static
    {
        return $this->state(fn () => [
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }
}
