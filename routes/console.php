<?php

use App\Jobs\Admin\RecurringAssignmentJob;
use App\Jobs\Admin\SendCollectionRemindersJob;
use App\Jobs\Admin\UpdateAssignmentStatusesJob;
use App\Jobs\Compliance\EvaluateViolationsJob;
use App\Jobs\GenerateMonthlyPartnerEarningsJob;
use App\Models\DeviceAuthorizationRequest;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('kontrol:check-resident-subscriptions')->daily();

Schedule::command('model:prune', [
    '--model' => [DeviceAuthorizationRequest::class],
])->daily();

// Billing scheduled commands
Schedule::command('kontrol:process-auto-billing')->dailyAt('02:00');

// Collections system & Compliance Engine evaluation
Schedule::job(new RecurringAssignmentJob)->dailyAt('00:05');
Schedule::job(new UpdateAssignmentStatusesJob)->dailyAt('01:05');
Schedule::job(new EvaluateViolationsJob)->dailyAt('04:00');

// Daily payment reminders & compliance sync
Schedule::job(new SendCollectionRemindersJob)->dailyAt('08:00');

// Generate public sitemap daily at 3:00 AM
Schedule::command('sitemap:generate')->dailyAt('03:00');

// Partner commission close – previous month lock on the 1st at 00:30 (does not mark paid)
Schedule::job(new GenerateMonthlyPartnerEarningsJob(mode: GenerateMonthlyPartnerEarningsJob::MODE_CLOSE))
    ->monthlyOn(1, '00:30');
