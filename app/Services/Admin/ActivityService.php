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

                // Fallback for older activities logged with log_name = 'default'
                $q->orWhere(function ($sub) use ($module) {
                    $sub->where(function ($defaultLog) {
                        $defaultLog->whereNull('activity_log.log_name')
                            ->orWhere('activity_log.log_name', 'default');
                    });

                    match ($module) {
                        'people' => $sub->where(function ($p) {
                            $p->where('activity_log.description', 'like', '%resident%')
                                ->orWhere('activity_log.description', 'like', '%property owner%')
                                ->orWhere('activity_log.description', 'like', '%household%');
                        }),
                        'incidents' => $sub->where(function ($p) {
                            $p->where('activity_log.subject_type', 'like', '%Incident%')
                                ->orWhere('activity_log.description', 'like', '%incident%');
                        }),
                        'announcements' => $sub->where(function ($p) {
                            $p->where('activity_log.subject_type', 'like', '%EstateBoard%')
                                ->orWhere('activity_log.description', 'like', '%board%')
                                ->orWhere('activity_log.description', 'like', '%announcement%')
                                ->orWhere('activity_log.description', 'like', '%comment%');
                        }),
                        'access' => $sub->where(function ($p) {
                            $p->where('activity_log.subject_type', 'like', '%AccessCode%')
                                ->orWhere('activity_log.description', 'like', '%access code%')
                                ->orWhere('activity_log.description', 'like', '%visitor%')
                                ->orWhere('activity_log.description', 'like', '%checkpoint%');
                        }),
                        'security' => $sub->where('activity_log.description', 'like', '%security%'),
                        'roles' => $sub->where(function ($p) {
                            $p->where('activity_log.description', 'like', '%role%')
                                ->orWhere('activity_log.description', 'like', '%admin%')
                                ->orWhere('activity_log.description', 'like', '%permission%');
                        }),
                        'zones' => $sub->where('activity_log.description', 'like', '%zone%'),
                        'finance' => $sub->where(function ($p) {
                            $p->where('activity_log.description', 'like', '%invoice%')
                                ->orWhere('activity_log.description', 'like', '%payment%');
                        }),
                        default => null,
                    };
                });
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
