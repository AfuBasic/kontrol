<?php

namespace App\Services\Admin;

use App\Models\Activity;
use App\Services\EstateContextService;
use Illuminate\Contracts\Pagination\CursorPaginator;

class ActivityService
{
    /**
     * Noise descriptions to exclude from the estate admin activity feed.
     *
     * @var list<string>
     */
    protected const NOISE_DESCRIPTIONS = [
        'logged in',
        'Generated Telegram link OTP',
        'Linked Telegram account',
        'Unlinked Telegram account',
        'reset password via forgot password',
        'Payment recorded successfully',
        'Payment verification failed',
        'Payment callback processing failed',
    ];

    /**
     * Create a new class instance.
     */
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Get cursor-paginated activity list with filtering and noise exclusion.
     */
    public function getCursorPaginatedActivities(?string $search = null, ?string $module = null, int $perPage = 20): CursorPaginator
    {
        $estateId = $this->estateContext->getEstateId();

        $query = Activity::query()
            ->with(['causer', 'subject'])
            ->where('activity_log.estate_id', $estateId)
            ->whereNotIn('activity_log.description', self::NOISE_DESCRIPTIONS)
            ->latest('activity_log.created_at');

        if ($module && $module !== 'all') {
            $query->where(function ($q) use ($module) {
                $q->where('activity_log.log_name', $module);
            });
        }

        if ($search && trim($search) !== '') {
            $searchTerm = '%'.trim($search).'%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('activity_log.description', 'like', $searchTerm)
                    ->orWhereHasMorph('causer', ['App\Models\User'], function ($userQuery) use ($searchTerm) {
                        $userQuery->where('name', 'like', $searchTerm)
                            ->orWhere('email', 'like', $searchTerm);
                    });
            });
        }

        return $query->cursorPaginate($perPage);
    }
}
