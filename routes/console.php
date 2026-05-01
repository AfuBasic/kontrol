<?php

use App\Jobs\Admin\RecurringAssignmentJob;
use App\Jobs\Admin\UpdateAssignmentStatusesJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('kontrol:check-resident-subscriptions')->daily();

// Billing scheduled commands
Schedule::command('kontrol:generate-scheduled-invoices')->dailyAt('00:01');
Schedule::command('kontrol:mark-overdue-invoices')->dailyAt('01:00');
Schedule::command('kontrol:process-auto-billing')->dailyAt('02:00');
Schedule::command('kontrol:send-billing-reminders')->dailyAt('08:00');

// Collections system
Schedule::job(new RecurringAssignmentJob)->dailyAt('00:05');
Schedule::job(new UpdateAssignmentStatusesJob)->dailyAt('01:05');
