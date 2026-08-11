<?php

namespace App\Console\Commands;

use App\Auth\ContextManager;
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

            $users = User::whereHas('estates', function ($q) use ($estate) {
                $q->where('estates.id', $estate->id)
                    ->where('estate_users_membership.status', 'accepted');
            })
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
                        $q->where('estate_id', $estate->id)
                            ->where(function ($sq) {
                                $sq->whereNull('current_period_end');
                            });
                    });
                })
                ->get();

            if ($users->isEmpty()) {
                $this->line('  No missing or incomplete subscriptions found for this estate.');

                continue;
            }

            foreach ($users as $user) {
                app(ContextManager::class)->setSystemContext($estate->id, $user);
                if ($user->hasRole('household_member') || ! $user->hasRole('resident')) {
                    continue;
                }

                $sub = $user->residentSubscription()->where('estate_id', $estate->id)->first();
                if (! $sub) {
                    // 1. Create subscription
                    $subscriptionService->createForUser($user, $estate);
                    $reason = 'Subscription created';
                } else {
                    // 2. Update existing missing plan_id and/or dates
                    $updates = [];
                    $reasons = [];

                    if ($sub->current_period_end === null) {
                        if ($sub->status === 'trial') {
                            $trialDays = $estate->settings->free_trial_days ?? 30;
                            $updates['trial_ends_at'] = $sub->created_at->copy()->addDays($trialDays);
                            $updates['current_period_start'] = $sub->created_at;
                            $updates['current_period_end'] = $sub->created_at->copy()->addDays($trialDays);
                        } else {
                            $updates['current_period_start'] = $sub->created_at;
                            $updates['current_period_end'] = $sub->created_at;
                        }
                        $reasons[] = 'dates healed';
                    }

                    if (! empty($updates)) {
                        $sub->update($updates);
                    }
                    $reason = implode(' & ', $reasons);
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
