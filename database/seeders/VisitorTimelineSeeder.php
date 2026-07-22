<?php

namespace Database\Seeders;

use App\Enums\AccessCodeSource;
use App\Enums\AccessCodeStatus;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class VisitorTimelineSeeder extends Seeder
{
    public function run(): void
    {
        // Find a resident user (one with an active subscription), not the admin
        $user = User::whereHas('residentSubscription')->first()
            ?? User::factory()->create([
                'name' => 'Demo Resident',
                'email' => 'resident@example.com',
            ]);

        $estate = $user->estates()->first() ?? Estate::first() ?? Estate::factory()->create([
            'name' => 'Royal Gardens Estate',
        ]);

        // Ensure user is attached to estate
        if (! $user->estates()->where('estate_id', $estate->id)->exists()) {
            $user->estates()->attach($estate->id, ['status' => 'accepted']);
        }

        $upcomingSamples = [
            ['name' => 'Mum & Dad', 'purpose' => 'Family Visit', 'type' => 'single_use', 'time' => '09:00', 'vehicle' => true, 'notes' => 'Bringing Sunday lunch'],
            ['name' => 'Shola Adebayo', 'purpose' => 'Personal Guest', 'type' => 'single_use', 'time' => '10:30', 'vehicle' => false, 'notes' => null],
            ['name' => 'Jumia Express Rider', 'purpose' => 'Package Delivery', 'type' => 'single_use', 'time' => '11:15', 'vehicle' => true, 'notes' => 'Call on arrival'],
            ['name' => 'Dr. Kalu', 'purpose' => 'Home Medical Checkup', 'type' => 'single_use', 'time' => '14:00', 'vehicle' => true, 'notes' => 'Routine checkup'],
            ['name' => 'Tolu (Electrician)', 'purpose' => 'Maintenance Work', 'type' => 'single_use', 'time' => '15:30', 'vehicle' => false, 'notes' => 'Fixing living room lights'],
            ['name' => 'Cleaner (Amina)', 'purpose' => 'Domestic Help', 'type' => 'long_lived', 'time' => '08:00', 'vehicle' => false, 'notes' => 'Weekly house cleaning'],
            ['name' => 'Birthday Party Guests', 'purpose' => 'Weekend Celebration', 'type' => 'event', 'time' => '16:00', 'vehicle' => true, 'limit' => 25, 'notes' => 'Gate pass for event'],
            ['name' => 'Chef Michael', 'purpose' => 'Catering Service', 'type' => 'single_use', 'time' => '12:00', 'vehicle' => true, 'notes' => 'Dinner prep'],
            ['name' => 'AC Technician', 'purpose' => 'Appliance Repair', 'type' => 'single_use', 'time' => '13:00', 'vehicle' => true, 'notes' => 'Master bedroom unit service'],
            ['name' => 'Pastor Dave', 'purpose' => 'Fellowship Meeting', 'type' => 'single_use', 'time' => '18:00', 'vehicle' => true, 'notes' => 'Evening fellowship'],
            ['name' => 'DHL Courier', 'purpose' => 'Document Delivery', 'type' => 'single_use', 'time' => '09:45', 'vehicle' => true, 'notes' => 'Signature required'],
            ['name' => 'Architect Segun', 'purpose' => 'Interior Consultation', 'type' => 'single_use', 'time' => '11:00', 'vehicle' => true, 'notes' => 'Review kitchen remodelling plans'],
            ['name' => 'Gardener Sunday', 'purpose' => 'Lawn & Garden Care', 'type' => 'long_lived', 'time' => '07:30', 'vehicle' => false, 'notes' => 'Trimming hedges'],
            ['name' => 'Plumber Kingsley', 'purpose' => 'Pipe Maintenance', 'type' => 'single_use', 'time' => '10:00', 'vehicle' => false, 'notes' => 'Kitchen sink leakage'],
            ['name' => 'Bisi & Kids', 'purpose' => 'Playdate', 'type' => 'single_use', 'time' => '15:00', 'vehicle' => true, 'notes' => null],
            ['name' => 'Solar Inspector', 'purpose' => 'Energy Audit', 'type' => 'single_use', 'time' => '11:30', 'vehicle' => true, 'notes' => 'Rooftop inspection'],
            ['name' => 'Nanny Grace', 'purpose' => 'Childcare', 'type' => 'long_lived', 'time' => '08:30', 'vehicle' => false, 'notes' => null],
            ['name' => 'Femi (Gym Trainer)', 'purpose' => 'Fitness Session', 'type' => 'long_lived', 'time' => '06:30', 'vehicle' => true, 'notes' => 'Morning session'],
            ['name' => 'Bolt Food Driver', 'purpose' => 'Food Order', 'type' => 'single_use', 'time' => '19:30', 'vehicle' => true, 'notes' => 'Leave at security post if needed'],
            ['name' => 'Interior Decorator', 'purpose' => 'Curtains Fitting', 'type' => 'single_use', 'time' => '14:30', 'vehicle' => true, 'notes' => 'Blinds installation'],
        ];

        // 1. Seed ~45 upcoming passes across the next 90 days
        $now = Carbon::now();
        for ($i = 0; $i < 45; $i++) {
            $sample = $upcomingSamples[$i % count($upcomingSamples)];
            $daysInFuture = (int) floor($i * 2); // Spread evenly across ~90 days
            $visitDate = $now->copy()->addDays($daysInFuture);

            [$hour, $minute] = explode(':', $sample['time']);
            $startsAt = $visitDate->copy()->setHour((int) $hour)->setMinute((int) $minute)->setSecond(0);
            $expiresAt = $startsAt->copy()->addHours(4);

            $status = $daysInFuture === 0 ? AccessCodeStatus::Active : AccessCodeStatus::Scheduled;

            AccessCode::create([
                'estate_id' => $estate->id,
                'user_id' => $user->id,
                'code' => strtoupper(Str::random(6)),
                'pass_uuid' => (string) Str::uuid(),
                'qr_token' => Str::random(32),
                'type' => $sample['type'],
                'source' => AccessCodeSource::Web,
                'visitor_name' => $sample['name'],
                'visitor_phone' => '+23480'.rand(10000000, 99999999),
                'purpose' => $sample['purpose'],
                'status' => $status,
                'starts_at' => $startsAt,
                'expires_at' => $expiresAt,
                'guest_limit' => $sample['limit'] ?? null,
                'notes' => $sample['notes'],
                'has_vehicle' => $sample['vehicle'],
            ]);
        }

        // 2. Seed ~100 historical passes across the past 90 days
        $historyVisitors = [
            'Sarah Connor', 'Clark Kent', 'Bruce Wayne', 'Diana Prince', 'Peter Parker',
            'Tony Stark', 'Steve Rogers', 'Natasha Romanoff', 'Wanda Maximoff', 'James Rhodes',
            'Uber Driver', 'Kong Express', 'FedEx Driver', 'MTN Technician', 'DSTV Installer',
            'Generator Mechanic', 'Painter Ibrahim', 'Tailor Blessing', 'Carpenter Jude', 'Car Washer Sam',
            'Uncle Tayo', 'Auntie Funmi', 'Cousin Nnamdi', 'Dr. Alabi', 'Vet Officer Dr. Paul',
        ];

        $historyPurposes = [
            'Family Visit', 'Delivery', 'Maintenance', 'Medical Checkup', 'Guest',
            'Consultation', 'Drop Off', 'Pick Up', 'Repair Work', 'Inspection',
        ];

        for ($i = 1; $i <= 100; $i++) {
            $daysAgo = (int) floor($i * 0.9); // Spread over past 90 days
            $historicalDate = $now->copy()->subDays($daysAgo)->setHour(rand(8, 20))->setMinute(rand(0, 59));

            // Status distribution: ~65% Used, ~20% Expired, ~15% Revoked
            $randStatus = rand(1, 100);
            if ($randStatus <= 65) {
                $status = AccessCodeStatus::Used;
                $usedAt = $historicalDate->copy();
                $expiresAt = $historicalDate->copy()->addHours(3);
                $revokedAt = null;
            } elseif ($randStatus <= 85) {
                $status = AccessCodeStatus::Expired;
                $usedAt = null;
                $expiresAt = $historicalDate->copy();
                $revokedAt = null;
            } else {
                $status = AccessCodeStatus::Revoked;
                $usedAt = null;
                $expiresAt = $historicalDate->copy()->addHours(6);
                $revokedAt = $historicalDate->copy();
            }

            $type = ['single_use', 'long_lived', 'event'][rand(0, 2)];
            $name = $historyVisitors[$i % count($historyVisitors)];
            $purpose = $historyPurposes[$i % count($historyPurposes)];

            $code = AccessCode::create([
                'estate_id' => $estate->id,
                'user_id' => $user->id,
                'code' => strtoupper(Str::random(6)),
                'pass_uuid' => (string) Str::uuid(),
                'qr_token' => Str::random(32),
                'type' => $type,
                'source' => AccessCodeSource::Web,
                'visitor_name' => $name,
                'visitor_phone' => '+23480'.rand(10000000, 99999999),
                'purpose' => $purpose,
                'status' => $status,
                'starts_at' => $historicalDate->copy()->subHour(),
                'expires_at' => $expiresAt,
                'used_at' => $usedAt,
                'revoked_at' => $revokedAt,
                'created_at' => $historicalDate->copy()->subHours(2),
                'updated_at' => $historicalDate,
            ]);

            if ($status === AccessCodeStatus::Used && $usedAt) {
                AccessLog::create([
                    'estate_id' => $estate->id,
                    'access_code_id' => $code->id,
                    'verified_by' => $user->id,
                    'verified_at' => $usedAt,
                    'checked_out_at' => $usedAt->copy()->addHours(2),
                    'checked_out_by' => $user->id,
                ]);
            }
        }
    }
}
