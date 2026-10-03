<?php

use App\Jobs\Admin\SendCollectionRemindersJob;
use App\Jobs\Billing\GenerateInvoiceJob;
use App\Jobs\CreateEstateFromPartnerRequestJob;
use App\Jobs\ProcessSOSAlert;
use App\Jobs\SendSmsAlert;
use Illuminate\Contracts\Queue\ShouldQueue;
use Symfony\Component\Finder\Finder;

/**
 * Background jobs run on whatever network and servers the estate has, so each one has to say how long it
 * may run, how often it may be attempted, and leave a trace when it gives up.
 *
 * @return array<string, class-string>
 */
function queuedJobClasses(): array
{
    $classes = [];

    foreach ((new Finder)->files()->in(app_path('Jobs'))->name('*.php') as $file) {
        $class = 'App\\Jobs\\'.str_replace(['/', '.php'], ['\\', ''], $file->getRelativePathname());

        if (class_exists($class) && is_subclass_of($class, ShouldQueue::class)) {
            $classes[class_basename($class)] = $class;
        }
    }

    return $classes;
}

it('finds the queued jobs it is meant to check', function () {
    expect(queuedJobClasses())->not->toBeEmpty()
        ->toHaveKeys(['ProcessSOSAlert', 'SendSmsAlert', 'RenewBulkVisitorInvitesJob', 'RecheckInitiatedCollectionPaymentsJob']);
});

it('gives every queued job an attempt limit, a time limit and a failure handler', function () {
    foreach (queuedJobClasses() as $class) {
        $defaults = (new ReflectionClass($class))->getDefaultProperties();

        expect($defaults['tries'] ?? null)->toBeInt("{$class} must set \$tries")
            ->and($defaults['tries'])->toBeGreaterThanOrEqual(1)
            ->and($defaults['timeout'] ?? null)->toBeInt("{$class} must set \$timeout")
            ->and($defaults['timeout'])->toBeGreaterThan(0)
            ->and(method_exists($class, 'failed'))->toBeTrue("{$class} must define failed()");
    }
});

it('never lets a job run longer than the queue waits before handing it to a second worker', function () {
    $retryAfter = config('queue.connections.database.retry_after');

    foreach (queuedJobClasses() as $class) {
        $timeout = (new ReflectionClass($class))->getDefaultProperties()['timeout'];

        expect($timeout)->toBeLessThan($retryAfter, "{$class} timeout ({$timeout}s) must be below retry_after ({$retryAfter}s)");
    }
});

it('retries the jobs where sending twice is harmless, and only those', function () {
    $tries = fn (string $class) => (new ReflectionClass($class))->getDefaultProperties()['tries'];

    expect($tries(SendSmsAlert::class))->toBeGreaterThan(1)
        ->and($tries(ProcessSOSAlert::class))->toBeGreaterThan(1)
        ->and($tries(GenerateInvoiceJob::class))->toBe(1)
        ->and($tries(CreateEstateFromPartnerRequestJob::class))->toBe(1)
        ->and($tries(SendCollectionRemindersJob::class))->toBe(1);
});
