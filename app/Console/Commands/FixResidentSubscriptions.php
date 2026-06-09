<?php

namespace App\Console\Commands;

use App\Models\Estate;
use App\Models\User;
use App\Services\ResidentSubscriptionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixResidentSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kontrol:fix-resident-subscriptions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Finds residents and property owners in billing estates with missing subscription records, creates them, and flushes their sessions';

    /**
     * Execute the console command.
     */
    public function handle(ResidentSubscriptionService $subscriptionService): int
    {
        $this->info('Scanning estates for missing resident subscriptions...');

        $estates = Estate::whereHas('settings', function ($q) {
            $q->where('charge_type', 'residents');
        })->get();

        $fixedCount = 0;

        foreach ($estates as $estate) {
            $this->info("Scanning Estate: {$estate->name} (ID: {$estate->id})...");

            $estatePlanId = $estate->subscriptionRecord?->plan_id;

            $users = User::forEstate($estate->id)
                ->where(function ($query) use ($estate) {
                    $query->whereExists(function ($q) use ($estate) {
                        $q->select(DB::raw(1))
                            ->from('model_has_roles')
                            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                            ->whereColumn('model_has_roles.model_id', 'users.id')
                            ->where('model_has_roles.model_type', User::class)
                            ->whereIn('roles.name', ['resident', 'property_owner'])
                            ->where('model_has_roles.estate_id', $estate->id);
                    });
                })
                ->where(function ($query) use ($estate) {
                    $query->whereDoesntHave('residentSubscription', function ($q) use ($estate) {
                        $q->where('estate_id', $estate->id);
                    })->orWhereHas('residentSubscription', function ($q) use ($estate) {
                        $q->where('estate_id', $estate->id)->whereNull('plan_id');
                    });
                })
                ->get();

            if ($users->isEmpty()) {
                $this->line('  No missing or incomplete subscriptions found for this estate.');

                continue;
            }

            foreach ($users as $user) {
                $sub = $user->residentSubscription()->where('estate_id', $estate->id)->first();

                if (! $sub) {
                    // 1. Create subscription
                    $subscriptionService->createForUser($user, $estate);
                    $reason = 'Subscription created';
                } else {
                    // 2. Update existing missing plan_id
                    $sub->update(['plan_id' => $estatePlanId]);
                    $reason = "plan_id set to {$estatePlanId}";
                }

                // 3. Clear user sessions (support database session driver)
                DB::table('sessions')->where('user_id', $user->id)->delete();

                $this->warn("  -> Fixed resident: {$user->email} ({$reason} & sessions cleared)");
                $fixedCount++;
            }
        }

        $this->info("Heal process completed. Total residents fixed: {$fixedCount}");

        return self::SUCCESS;
    }
}
