<?php

namespace App\Services\Organization;

use App\Models\AccessLog;
use App\Models\OrganizationBulkInvite;
use App\Models\OrganizationBulkInviteRecipient;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Gate visits made with bulk invite passes.
 *
 * A recipient can hold several passes over time (one per renewal cycle), so visits are
 * resolved through access_codes.bulk_invite_recipient_id rather than the recipient's last code.
 */
class BulkInviteVisitService
{
    /**
     * Visit totals for a group, plus per-recipient counts keyed by recipient id.
     *
     * @param  Collection<int, OrganizationBulkInviteRecipient>  $recipients
     * @return array{
     *     total_visits: int,
     *     visited_count: int,
     *     inside_now: int,
     *     last_visit_at: CarbonInterface|null,
     *     by_recipient: array<int, array{visits: int, last_visit_at: CarbonInterface|null}>
     * }
     */
    public function groupStats(OrganizationBulkInvite $bulkInvite, Collection $recipients): array
    {
        $recipientIds = $recipients->pluck('id')->all();

        $rows = $this->visitsQuery($bulkInvite, $recipientIds)
            ->selectRaw('access_codes.bulk_invite_recipient_id as recipient_id, COUNT(*) as visits, MAX(access_logs.verified_at) as last_visit_at')
            ->groupBy('access_codes.bulk_invite_recipient_id')
            ->get();

        $byRecipient = $rows->mapWithKeys(fn ($row) => [
            (int) $row->recipient_id => [
                'visits' => (int) $row->visits,
                'last_visit_at' => $row->last_visit_at ? now()->parse($row->last_visit_at) : null,
            ],
        ])->all();

        // "Inside" only counts today's entries without a check-out, so a missed check-out
        // can't leave someone marked as inside indefinitely.
        $insideNow = $this->visitsQuery($bulkInvite, $recipientIds)
            ->where('access_logs.verified_at', '>=', now()->startOfDay())
            ->whereNull('access_logs.checked_out_at')
            ->distinct()
            ->count('access_codes.bulk_invite_recipient_id');

        $lastVisitAt = collect($byRecipient)->pluck('last_visit_at')->filter()->max();

        return [
            'total_visits' => array_sum(array_column($byRecipient, 'visits')),
            'visited_count' => count($byRecipient),
            'inside_now' => $insideNow,
            'last_visit_at' => $lastVisitAt,
            'by_recipient' => $byRecipient,
        ];
    }

    /**
     * A recipient's visits, newest first.
     *
     * @return CursorPaginator<int, AccessLog>
     */
    public function recipientVisits(OrganizationBulkInviteRecipient $recipient, int $perPage = 20): CursorPaginator
    {
        return $this->visitsQuery($recipient->bulkInvite, [$recipient->id])
            ->select('access_logs.*')
            ->orderByDesc('access_logs.verified_at')
            ->orderByDesc('access_logs.id')
            ->cursorPaginate($perPage);
    }

    /**
     * Short recency label for mobile: "Just now", "12m ago", "3h ago", "Yesterday", "1 Oct".
     */
    public function recencyLabel(?CarbonInterface $at): ?string
    {
        if (! $at) {
            return null;
        }

        $minutes = (int) $at->diffInMinutes(now());

        return match (true) {
            $minutes < 1 => 'Just now',
            $minutes < 60 => "{$minutes}m ago",
            $at->isToday() => ((int) $at->diffInHours(now())).'h ago',
            $at->isYesterday() => 'Yesterday',
            $at->year === now()->year => $at->isoFormat('D MMM'),
            default => $at->isoFormat('D MMM YYYY'),
        };
    }

    /**
     * @param  array<int, int>  $recipientIds
     * @return Builder<AccessLog>
     */
    private function visitsQuery(OrganizationBulkInvite $bulkInvite, array $recipientIds): Builder
    {
        return AccessLog::query()
            ->join('access_codes', 'access_codes.id', '=', 'access_logs.access_code_id')
            ->where('access_logs.estate_id', $bulkInvite->estate_id)
            ->whereIn('access_codes.bulk_invite_recipient_id', $recipientIds === [] ? [0] : $recipientIds);
    }
}
