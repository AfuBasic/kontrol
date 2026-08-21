<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\BulkDeleteSecurityAction;
use App\Actions\Admin\BulkInviteSecurityAction;
use App\Actions\Admin\CreateSecurityAction;
use App\Actions\Admin\DeleteSecurityAction;
use App\Actions\Admin\ResendSecurityInvitationAction;
use App\Actions\Admin\SuspendSecurityAction;
use App\Actions\Admin\UpdateSecurityAction;
use App\Auth\ContextManager;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSecurityRequest;
use App\Models\User;
use App\Models\Zone;
use App\Services\Admin\SecurityService;
use App\Services\Admin\UserService;
use App\Services\EstateContextService;
use App\Services\ZoneAudienceResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class SecurityPersonnelController extends Controller
{
    public function __construct(
        protected SecurityService $securityService,
        protected UserService $userService,
        protected EstateContextService $estateContext,
        protected ZoneAudienceResolver $zoneAudience,
    ) {}

    /**
     * Display a listing of security personnel.
     */
    public function index(Request $request): Response
    {
        $this->authorize('security.view');

        $filters = $request->only(['search', 'status']);
        $estate = $this->estateContext->getEstate();
        $securityRole = Role::where('name', 'security')->whereNull('estate_id')->first();

        $totalSecurity = User::query()->forEstate($estate->id)->whereHas('roles', fn ($q) => $q->where('name', 'security'))->count();
        $activeSecurity = User::query()->forEstate($estate->id)
            ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->when($securityRole, fn ($sq) => $sq->where('role_id', $securityRole->id))->where('is_active', true))
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'accepted'))
            ->count();
        $pendingSecurity = User::query()->forEstate($estate->id)
            ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->when($securityRole, fn ($sq) => $sq->where('role_id', $securityRole->id))->where('is_active', true))
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.status', 'pending'))
            ->count();
        $suspendedSecurity = User::query()->forEstate($estate->id)
            ->whereHas('administrativeAssignments', fn ($q) => $q->where('estate_id', $estate->id)->when($securityRole, fn ($sq) => $sq->where('role_id', $securityRole->id))->where('is_active', false))
            ->count();

        return Inertia::render('Admin/Security/Index', [
            'security' => Inertia::defer(fn () => $this->securityService
                ->getPaginatedSecurity(15, $filters)
                ->through(function ($user) {
                    $membership = $user->estates->first()?->pivot;
                    $zone = $membership?->zone_id ? Zone::find($membership->zone_id) : null;
                    $assignment = $user->administrativeAssignments->first();
                    $isSuspended = $assignment ? ! $assignment->is_active : false;

                    return [
                        'ulid' => $user->ulid,
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->profile?->phone,
                        'badge_number' => $user->profile?->metadata['badge_number'] ?? null,
                        'zone_id' => $membership?->zone_id,
                        'zone_name' => $zone?->name ?? 'Entire estate',
                        'status' => $isSuspended ? 'inactive' : ($membership?->status ?? 'pending'),
                        'suspended_at' => $isSuspended ? ($assignment?->updated_at ?? now()) : null,
                        'created_at' => $user->created_at->format('M d, Y'),
                    ];
                })),
            'filters' => (object) $filters,
            'stats' => [
                'total' => $totalSecurity,
                'active' => $activeSecurity,
                'pending' => $pendingSecurity,
                'inactive' => $suspendedSecurity,
            ],
            'insights' => Inertia::defer(function () use ($pendingSecurity) {
                $insights = [];
                if ($pendingSecurity > 0) {
                    $insights[] = "{$pendingSecurity} security personnel have not accepted their invitations.";
                }

                return $insights;
            }),
        ]);
    }

    /**
     * Show the form for creating new security personnel.
     */
    public function create(): Response
    {
        $this->authorize('security.create');
        $context = app(ContextManager::class)->current();
        $estate = $this->estateContext->getEstate();
        $inviteLinks = $estate->securityInviteLinks()->with('zone')->get();

        $zones = $this->zoneAudience->zonesForEstate($this->estateContext->getEstateId());
        if ($context && $context->isZoneScoped()) {
            $zones = $zones->where('id', $context->zoneId);
        }

        return Inertia::render('Admin/Security/Create', [
            'zones' => $zones,
            'inviteLinks' => $inviteLinks->map(fn ($link) => [
                'id' => $link->id,
                'token' => $link->token,
                'url' => url("/join/{$link->token}"),
                'is_active' => $link->is_active,
                'usage_count' => $link->usage_count,
                'max_usages' => $link->max_usages,
                'requires_approval' => $link->requires_approval,
                'expires_at' => $link->expires_at?->toDateTimeString(),
                'is_expired' => $link->expires_at?->isPast() ?? false,
                'zone_id' => $link->zone_id,
                'zone_name' => $link->zone?->name ?? 'Entire Estate',
            ])->toArray(),
        ]);
    }

    /**
     * Store newly created security personnel.
     */
    public function store(StoreSecurityRequest $request, CreateSecurityAction $action): RedirectResponse
    {
        $this->authorize('security.create');
        $estate = $this->estateContext->getEstate();

        $action->execute($request->validated(), $estate);

        return redirect()
            ->route('admin.security.index')
            ->with('success', 'Security personnel invited successfully. They will receive an email to set up their account.');
    }

    /**
     * Show the form for editing security personnel.
     */
    public function edit(User $security): Response
    {
        $this->authorize('security.edit');
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($security), 403, 'Unauthorized zone scope.');
        $security->load('profile');

        return Inertia::render('Admin/Security/Edit', [
            'security' => [
                'ulid' => $security->ulid,
                'id' => $security->id,
                'name' => $security->name,
                'email' => $security->email,
                'email_verified_at' => $security->email_verified_at,
                'phone' => $security->profile?->phone,
                'badge_number' => $security->profile?->metadata['badge_number'] ?? null,
            ],
        ]);
    }

    /**
     * Update the specified security personnel.
     */
    public function update(Request $request, User $security, UpdateSecurityAction $action): RedirectResponse
    {
        $this->authorize('security.edit');
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($security), 403, 'Unauthorized zone scope.');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($security->id),
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'badge_number' => ['nullable', 'string', 'max:50'],
        ]);

        $estate = $this->estateContext->getEstate();
        $action->execute($security, $validated, $estate);

        return redirect()
            ->route('admin.security.index')
            ->with('success', 'Security personnel updated successfully.');
    }

    /**
     * Remove the specified security personnel.
     */
    public function destroy(User $security, DeleteSecurityAction $action): RedirectResponse
    {
        $this->authorize('security.delete');
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($security), 403, 'Unauthorized zone scope.');
        $estate = $this->estateContext->getEstate();

        $action->execute($security, $estate);

        return redirect()
            ->route('admin.security.index')
            ->with('success', 'Security personnel removed successfully.');
    }

    /**
     * Toggle the suspension status of the specified security personnel.
     */
    public function suspend(User $security, SuspendSecurityAction $action): RedirectResponse
    {
        $this->authorize('security.suspend');
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($security), 403, 'Unauthorized zone scope.');
        $estate = $this->estateContext->getEstate();

        $action->execute($security, $estate);

        $message = $security->suspended_at
            ? 'Security personnel suspended successfully.'
            : 'Security personnel activated successfully.';

        return back()->with('success', $message);
    }

    /**
     * Resend invitation for the specified security personnel.
     */
    public function resendInvitation(User $security, ResendSecurityInvitationAction $action): RedirectResponse
    {
        $this->authorize('security.reset-password');
        $context = app(ContextManager::class)->current();
        abort_if($context && ! $context->canAccess($security), 403, 'Unauthorized zone scope.');
        $estate = $this->estateContext->getEstate();

        $action->execute($security, $estate);

        return back()->with('success', 'Security personnel invitation resent.');
    }

    public function bulkDelete(Request $request, BulkDeleteSecurityAction $action): RedirectResponse
    {
        $this->authorize('security.delete');
        $context = app(ContextManager::class)->current();

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
        ]);

        if ($context && $context->isZoneScoped()) {
            $unauthorized = User::whereIn('id', $validated['ids'])
                ->whereDoesntHave('estates', function ($q) use ($context) {
                    $q->where('estates.id', $context->estateId)
                        ->where('estate_users_membership.zone_id', $context->zoneId);
                })
                ->exists();
            abort_if($unauthorized, 403, 'One or more selected security personnel are outside your authorized zone.');
        }

        $estate = $this->estateContext->getEstate();
        $deletedCount = $action->execute($validated['ids'], $estate);

        return redirect()
            ->route('admin.security.index')
            ->with('success', "Successfully removed {$deletedCount} security personnel.");
    }

    /**
     * Bulk invite security personnel by email.
     */
    public function bulkInvite(Request $request, BulkInviteSecurityAction $action): RedirectResponse
    {
        $this->authorize('security.create');
        $context = app(ContextManager::class)->current();

        $validated = $request->validate([
            'emails' => ['required', 'array', 'min:1', 'max:500'],
            'emails.*' => ['required', 'email'],
            'zone_id' => [
                'nullable',
                'integer',
                Rule::exists('zones', 'id')->where('estate_id', app(EstateContextService::class)->getEstate()->id),
                function ($attribute, $value, $fail) use ($context) {
                    if ($context && $context->isZoneScoped() && $value !== $context->zoneId) {
                        $fail('You are only authorized to invite security personnel to your active zone.');
                    }
                },
            ],
        ]);

        $zoneId = $validated['zone_id'] ?? null;
        if ($context && $context->isZoneScoped()) {
            $zoneId = $context->zoneId;
        }

        $estate = $this->estateContext->getEstate();
        $result = $action->execute($validated['emails'], $estate, $zoneId);

        $message = "Successfully invited {$result['invited']} security personnel.";
        if ($result['skipped'] > 0) {
            $message .= " {$result['skipped']} email(s) were skipped (already exist).";
        }

        return redirect()
            ->route('admin.security.index')
            ->with('success', $message);
    }
}
