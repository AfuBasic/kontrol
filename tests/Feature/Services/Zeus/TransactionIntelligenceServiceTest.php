<?php

namespace Tests\Feature\Services\Zeus;

use App\Models\Estate;
use App\Models\User;
use App\Services\Zeus\TransactionIntelligenceService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TransactionIntelligenceServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_metrics_calculates_correctly(): void
    {
        $estate = Estate::factory()->create();
        $user = User::factory()->create();

        // 1. Success Transaction (This Month)
        DB::table('payment_transactions')->insert([
            'estate_id' => $estate->id,
            'paystack_reference' => 'tx_123',
            'idempotency_key' => uniqid(),
            'amount' => 500000, // 5000 NGN
            'status' => 'success',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 2. Success Transaction (Last Month)
        DB::table('payment_transactions')->insert([
            'estate_id' => $estate->id,
            'paystack_reference' => 'tx_456',
            'idempotency_key' => uniqid(),
            'amount' => 150000, // 1500 NGN
            'status' => 'success',
            'created_at' => Carbon::now()->subMonths(2),
            'updated_at' => Carbon::now()->subMonths(2),
        ]);

        // 3. Failed Transaction
        DB::table('payment_transactions')->insert([
            'estate_id' => $estate->id,
            'paystack_reference' => 'tx_789',
            'idempotency_key' => uniqid(),
            'amount' => 200000, // 2000 NGN
            'status' => 'failed',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        $service = new TransactionIntelligenceService;
        $metrics = $service->getMetrics();

        // Total Volume = 500000 + 150000 = 650000
        // Monthly Volume = 500000
        // Failed Volume = 200000
        // Success Rate = 2 / 3 = 66.7%
        // Average Value = 650000 / 2 = 325000

        $this->assertEquals(650000, $metrics['total_volume']);
        $this->assertEquals(500000, $metrics['monthly_volume']);
        $this->assertEquals(200000, $metrics['failed_volume']);
        $this->assertEquals(66.7, $metrics['success_rate']);
        $this->assertEquals(325000, $metrics['average_value']);
    }

    public function test_get_volume_trend_returns_30_days(): void
    {
        $estate = Estate::factory()->create();

        // Create transaction 5 days ago
        DB::table('payment_transactions')->insert([
            'estate_id' => $estate->id,
            'paystack_reference' => 'tx_abc',
            'idempotency_key' => uniqid(),
            'amount' => 100000,
            'status' => 'success',
            'created_at' => Carbon::now()->subDays(5)->startOfDay(),
            'updated_at' => Carbon::now()->subDays(5)->startOfDay(),
        ]);

        $service = new TransactionIntelligenceService;
        $trend = $service->getVolumeTrend(30);

        $this->assertCount(30, $trend);

        // Find the record for 5 days ago (it should be at index 24 if index 29 is today)
        $dateStr = Carbon::now()->subDays(5)->format('M d');
        $found = false;

        foreach ($trend as $day) {
            if ($day['date'] === $dateStr && $day['volume'] === 100000) {
                $found = true;
                break;
            }
        }

        $this->assertTrue($found);
    }
}
