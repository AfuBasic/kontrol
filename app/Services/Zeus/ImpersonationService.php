<?php

namespace App\Services\Zeus;

use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\EstateMembership;
use App\Models\ImpersonationSession;
use App\Models\Scopes\ZoneScope;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class ImpersonationService
{
    public const SESSION_ID_KEY = 'zeus_impersonation_id';

    public const ESTATE_ID_KEY = 'zeus_impersonation_estate_id';

    public const USER_ID_KEY = 'zeus_impersonation_user_id';

    /**
     * Determine if an impersonation / Support Mode session is active in the current request.
     */
    public function isImpersonating(?Request $request = null): bool
    {
        $sessionId = $request
            ? $request->session()->get(self::SESSION_ID_KEY)
            : session(self::SESSION_ID_KEY);

        return ! empty($sessionId);
    }

    /**
     * Retrieve the active ImpersonationSession model for the current request.
     */
    public function getActiveSession(?Request $request = null): ?ImpersonationSession
    {
        $sessionId = $request
            ? $request->session()->get(self::SESSION_ID_KEY)
            : session(self::SESSION_ID_KEY);

        if (! $sessionId) {
            return null;
        }

        return ImpersonationSession::query()
            ->with(['effectiveUser', 'estate'])
            ->where('id', $sessionId)
            ->whereNull('ended_at')
            ->first();
    }

    /**
     * Retrieve the effective User being impersonated.
     */
    public function getEffectiveUser(?Request $request = null): ?User
    {
        return $this->getActiveSession($request)?->effectiveUser;
    }

    /**
     * Retrieve the Estate bound to the active impersonation session.
     */
    public function getEstate(?Request $request = null): ?Estate
    {
        return $this->getActiveSession($request)?->estate;
    }

    /**
     * Get the provider operator identifier (e.g. 'zeus').
     */
    public function getProviderIdentifier(?Request $request = null): string
    {
        $session = $this->getActiveSession($request);

        return $session?->provider_identifier ?? (string) config('zeus.username', 'zeus');
    }

    /**
     * Retrieve all eligible active estate administrators for an estate.
     *
     * @return Collection<int, User>
     */
    public function getEligibleAdminsForEstate(Estate $estate): Collection
    {
        return User::query()
            ->whereHas('estates', function ($q) use ($estate) {
                $q->where('estates.id', $estate->id)
                    ->where('estate_users_membership.status', 'accepted');
            })
            ->whereHas('administrativeAssignments', function ($q) use ($estate) {
                $q->withoutGlobalScope(ZoneScope::class)
                    ->where('estate_id', $estate->id)
                    ->where('is_active', true)
                    ->whereHas('role', function ($rq) {
                        $rq->where('name', 'admin')
                            ->orWhere('name', 'like', '%admin%');
                    });
            })
            ->with([
                'administrativeAssignments' => function ($q) use ($estate) {
                    $q->withoutGlobalScope(ZoneScope::class)
                        ->where('estate_id', $estate->id)
                        ->where('is_active', true)
                        ->with(['role', 'zone' => fn ($zq) => $zq->withoutGlobalScope(ZoneScope::class)]);
                },
            ])
            ->get();
    }

    /**
     * Validate that a target user is a legitimate, active estate administrator for the given estate.
     */
    public function validateTargetAdmin(Estate $estate, User $user): ?AdministrativeAssignment
    {
        // 1. Verify accepted membership in the specific estate
        $hasMembership = EstateMembership::withoutGlobalScope(ZoneScope::class)
            ->where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->where('status', 'accepted')
            ->exists();

        if (! $hasMembership) {
            return null;
        }

        // 2. Find active admin assignment for this estate
        return AdministrativeAssignment::withoutGlobalScope(ZoneScope::class)
            ->with(['role', 'zone' => fn ($zq) => $zq->withoutGlobalScope(ZoneScope::class)])
            ->where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->where('is_active', true)
            ->whereHas('role', function ($rq) {
                $rq->where('name', 'admin')
                    ->orWhere('name', 'like', '%admin%');
            })
            ->first();
    }

    /**
     * Build the sanitized Support Mode presentation payload for Inertia shared data.
     *
     * @return array{active: bool, estate: array{id: int, name: string}|null, operating_as: array{id: int, name: string, email: string}|null, exit_url: string|null}|null
     */
    public function getSupportModeData(?Request $request = null): ?array
    {
        $session = $this->getActiveSession($request);

        if (! $session || ! $session->effectiveUser || ! $session->estate) {
            return null;
        }

        return [
            'active' => true,
            'estate' => [
                'id' => $session->estate->id,
                'name' => $session->estate->name,
            ],
            'operating_as' => [
                'id' => $session->effectiveUser->id,
                'name' => $session->effectiveUser->name,
                'email' => $session->effectiveUser->email,
            ],
            'exit_url' => Route::has('zeus.impersonation.stop') ? route('zeus.impersonation.stop') : '/zeus/impersonation/stop',
        ];
    }
}
