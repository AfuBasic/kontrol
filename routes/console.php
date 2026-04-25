<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('kontrol:check-resident-subscriptions')->daily();

// Billing scheduled commands
Schedule::command('app:generate-scheduled-invoices')->dailyAt('00:01');
Schedule::command('app:send-billing-reminders')->dailyAt('08:00');
Schedule::command('app:mark-overdue-invoices')->dailyAt('01:00');
