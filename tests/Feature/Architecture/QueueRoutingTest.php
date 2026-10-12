<?php

use App\Support\Queues;
use Symfony\Component\Finder\Finder;

/*
 * Guards the queue layout: every queued class picks its queue on purpose, every queue named exists in
 * App\Support\Queues, and every one of those queues has a worker, because a job sent to a queue
 * nobody reads waits forever.
 */

/** Queued classes that deliberately stay on "default": quick work nobody is watching. */
const STAYS_ON_DEFAULT = [
    'Jobs/Billing/ProcessSubscriptionReminderJob',
    'Jobs/Billing/SyncEstateTrialSettingsJob',
    'Jobs/CreateEstateFromPartnerRequestJob',
    'Jobs/NotifyBulkInviteDeliveryReportJob',
    'Jobs/Resident/SendVisitorPassRemindersJob',
    'Listeners/NotifyAdminsOfNewResident',
    'Listeners/NotifyAdminsOfNewSecurity',
    'Notifications/Admin/CollectionPublishedNotification',
    'Notifications/Admin/NewResidentSignup',
    'Notifications/Admin/PropertyOwnerResidentJoinedAdminNotification',
    'Notifications/Admin/ResidentAcceptedInvitation',
    'Notifications/Admin/ResidentInvited',
    'Notifications/BulkInviteDeliveryFailedNotification',
    'Notifications/BulkInviteRenewalBlockedNotification',
    'Notifications/BulkInviteRenewedNotification',
    'Notifications/EstateBoard/NewCommentNotification',
    'Notifications/EstateBoard/NewPostNotification',
    'Notifications/Incidents/IncidentCommentNotification',
    'Notifications/Incidents/IncidentCreatedNotification',
    'Notifications/Incidents/IncidentDeletedNotification',
    'Notifications/Incidents/IncidentStatusUpdatedNotification',
    'Notifications/Partner/EarningSettledNotification',
    'Notifications/Partner/EstateRequestAcceptedNotification',
    'Notifications/Partner/EstateRequestRejectedNotification',
    'Notifications/PropertyOwner/CollectionPaymentReceivedNotification',
    'Notifications/PropertyOwner/ResidentAcceptedToPropertyOwner',
    'Notifications/Resident/HouseholdMemberInvitationAcceptedNotification',
    'Notifications/ResidentApproved',
    'Notifications/ResidentInvitedNotification',
    'Notifications/ResidentRejected',
    'Notifications/ResidentSubscriptionExpiredNotification',
    'Notifications/ResidentSubscriptionExpiringNotification',
    'Notifications/ResidentTrialEndingNotification',
    'Notifications/SecurityInvitedNotification',
    'Notifications/Zeus/PartnerEstateRequestSubmittedNotification',
];

/** @return array<string, string> relative path (no extension) => source */
function queuedClassSources(): array
{
    $sources = [];

    foreach ((new Finder)->files()->name('*.php')->in(array_map(
        fn (string $dir) => app_path($dir),
        ['Jobs', 'Notifications', 'Mail', 'Listeners', 'Events'],
    )) as $file) {
        $source = $file->getContents();

        // ShouldBroadcastNow runs inside the request and never touches a queue.
        $queued = preg_match('/\bShouldQueue\b/', $source)
            || preg_match('/\bShouldBroadcast\b(?!Now)/', $source);

        if ($queued) {
            $key = str_replace([app_path().'/', '.php'], '', $file->getPathname());
            $sources[$key] = $source;
        }
    }

    return $sources;
}

it('has every queued class pick its queue, or be listed as staying on default', function () {
    $undeclared = [];

    foreach (queuedClassSources() as $class => $source) {
        $declares = preg_match('/Queues::|onQueue\(|public (?:string )?\$queue\b|function broadcastQueue/', $source);

        if (! $declares && ! in_array($class, STAYS_ON_DEFAULT, true)) {
            $undeclared[] = $class;
        }
    }

    expect($undeclared)->toBe([], 'These queued classes name no queue. Pick one from App\Support\Queues, or add the class to STAYS_ON_DEFAULT.');
});

it('does not list a class as staying on default once it picks a queue', function () {
    $sources = queuedClassSources();

    $stale = array_values(array_filter(
        STAYS_ON_DEFAULT,
        fn (string $class) => ! isset($sources[$class])
            || preg_match('/Queues::|onQueue\(|public (?:string )?\$queue\b|function broadcastQueue/', $sources[$class]),
    ));

    expect($stale)->toBe([]);
});

it('only names queues that exist in the registry', function () {
    $unknown = [];

    foreach (queuedClassSources() as $class => $source) {
        preg_match_all('/onQueue\(\s*[\'"]([a-z_-]+)[\'"]/', $source, $literals);
        preg_match_all('/\$queue\s*=\s*[\'"]([a-z_-]+)[\'"]/', $source, $props);
        preg_match_all('/Queues::([A-Z_]+)/', $source, $constants);

        foreach ([...$literals[1], ...$props[1]] as $name) {
            if (! in_array($name, Queues::ALL, true)) {
                $unknown[] = "{$class} names the queue '{$name}'";
            }
        }

        foreach ($constants[1] as $constant) {
            if (! defined(Queues::class.'::'.$constant)) {
                $unknown[] = "{$class} uses unknown Queues::{$constant}";
            }
        }
    }

    expect($unknown)->toBe([]);
});

it('runs a worker for every queue in the registry', function () {
    $workers = file_get_contents(base_path('nixpacks.toml'));

    $unread = array_values(array_filter(
        Queues::ALL,
        fn (string $queue) => ! str_contains($workers, "queue:work --queue={$queue} "),
    ));

    expect($unread)->toBe([]);
});

it('sends sign-in codes to a queue with a worker', function () {
    expect(Queues::ALL)->toContain(config('queue.otp_queue'));
});
