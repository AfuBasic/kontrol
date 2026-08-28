<?php

namespace App\Services\Notifications;

use App\Auth\ContextManager;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\Notification;

class NotificationContextService
{
    public function __construct(
        private ContextManager $contextManager,
    ) {}

    /**
     * @param  Builder<DatabaseNotification>|MorphMany<DatabaseNotification, User>  $query
     * @return Builder<DatabaseNotification>|MorphMany<DatabaseNotification, User>
     */
    public function scopeToCurrentContext(Builder|MorphMany $query): Builder|MorphMany
    {
        $context = $this->contextManager->current();

        if (! $context || $context->assignmentId <= 0) {
            return $query->where('notifications.id', '__missing_active_context__');
        }

        $targetRole = $this->roleNameForAssignment($context->assignmentId);

        return $query->where(function (Builder $contextQuery) use ($context, $targetRole): void {
            $contextQuery->where('administrative_assignment_id', $context->assignmentId);

            if ($targetRole === null) {
                return;
            }

            $contextQuery->orWhere(function (Builder $fallbackQuery) use ($context, $targetRole): void {
                $fallbackQuery
                    ->whereNull('administrative_assignment_id')
                    ->where('estate_id', $context->estateId)
                    ->where('target_role', $targetRole);

                if ($context->zoneId !== null) {
                    $fallbackQuery->where(function (Builder $zoneQuery) use ($context): void {
                        $zoneQuery
                            ->whereNull('zone_id')
                            ->orWhere('zone_id', $context->zoneId);
                    });
                }
            });
        });
    }

    /**
     * @param  Builder<DatabaseNotification>|MorphMany<DatabaseNotification, User>  $query
     * @return Builder<DatabaseNotification>|MorphMany<DatabaseNotification, User>
     */
    public function scopeToPartnerContext(Builder|MorphMany $query): Builder|MorphMany
    {
        return $query->where(function (Builder $partnerQuery): void {
            $partnerQuery
                ->where('target_role', 'affiliate')
                ->orWhere('type', 'like', 'App\\\\Notifications\\\\Partner\\\\%');
        });
    }

    public function findForCurrentContext(User $user, string $notificationId): DatabaseNotification
    {
        return $this->scopeToCurrentContext($user->notifications())
            ->whereKey($notificationId)
            ->firstOrFail();
    }

    public function findForPartnerContext(User $user, string $notificationId): DatabaseNotification
    {
        return $this->scopeToPartnerContext($user->notifications())
            ->whereKey($notificationId)
            ->firstOrFail();
    }

    public function markAllAsReadForCurrentContext(User $user): int
    {
        return $this->scopeToCurrentContext($user->unreadNotifications())
            ->update(['read_at' => now()]);
    }

    public function markAllAsReadForPartnerContext(User $user): int
    {
        return $this->scopeToPartnerContext($user->unreadNotifications())
            ->update(['read_at' => now()]);
    }

    public function clearForCurrentContext(User $user): int
    {
        return $this->scopeToCurrentContext($user->notifications())->delete();
    }

    public function clearForPartnerContext(User $user): int
    {
        return $this->scopeToPartnerContext($user->notifications())->delete();
    }

    public function unreadCountForCurrentContext(User $user): int
    {
        return $this->scopeToCurrentContext($user->unreadNotifications())->count();
    }

    public function unreadCountForPartnerContext(User $user): int
    {
        return $this->scopeToPartnerContext($user->unreadNotifications())->count();
    }

    /**
     * @return array{
     *     estate_id: int|null,
     *     administrative_assignment_id: int|null,
     *     zone_id: int|null,
     *     target_role: string|null
     * }
     */
    public function attributesFor(Notification $notification, User $notifiable, DatabaseNotification $databaseNotification): array
    {
        /** @var array<string, mixed> $data */
        $data = is_array($databaseNotification->data) ? $databaseNotification->data : [];
        $explicit = $this->explicitContext($notification, $notifiable);
        $modelContext = $this->modelContext($notification);

        $estateId = $this->nullableInt(
            $explicit['estate_id']
                ?? $data['estate_id']
                ?? $modelContext['estate_id']
                ?? null
        );
        $zoneId = $this->nullableInt(
            $explicit['zone_id']
                ?? $data['zone_id']
                ?? $modelContext['zone_id']
                ?? null
        );
        $targetRole = $this->normalizeRole(
            $explicit['target_role']
                ?? $data['target_role']
                ?? $this->targetRoleFromPayload($notification, $data, $notifiable, $estateId)
        );

        $assignmentId = $this->nullableInt(
            $explicit['administrative_assignment_id']
                ?? $explicit['assignment_id']
                ?? $data['administrative_assignment_id']
                ?? $data['assignment_id']
                ?? $modelContext['administrative_assignment_id']
                ?? null
        );

        $assignment = $this->matchingAssignment($notifiable, $assignmentId, $estateId, $targetRole, $zoneId);

        if ($assignment) {
            $estateId = $assignment->estate_id;
            $zoneId = $assignment->zone_id;
            $assignmentId = $assignment->id;
            $targetRole = $assignment->role?->name ?? $targetRole;
        }

        return [
            'estate_id' => $estateId,
            'administrative_assignment_id' => $assignmentId,
            'zone_id' => $zoneId,
            'target_role' => $targetRole,
        ];
    }

    private function roleNameForAssignment(int $assignmentId): ?string
    {
        return AdministrativeAssignment::with('role')->find($assignmentId)?->role?->name;
    }

    /**
     * @return array<string, mixed>
     */
    private function explicitContext(Notification $notification, User $notifiable): array
    {
        if (! method_exists($notification, 'notificationContext')) {
            return [];
        }

        $context = $notification->notificationContext($notifiable);

        return is_array($context) ? $context : [];
    }

    /**
     * @return array{
     *     estate_id?: int|null,
     *     administrative_assignment_id?: int|null,
     *     zone_id?: int|null
     * }
     */
    private function modelContext(Notification $notification): array
    {
        $context = [];

        foreach (get_object_vars($notification) as $value) {
            if (! $value instanceof Model) {
                continue;
            }

            if ($value instanceof AdministrativeAssignment) {
                $context['administrative_assignment_id'] ??= $value->id;
                $context['estate_id'] ??= $value->estate_id;
                $context['zone_id'] ??= $value->zone_id;
            }

            $context['estate_id'] ??= $this->estateIdFromModel($value);
            $context['zone_id'] ??= $this->zoneIdFromModel($value);
        }

        return $context;
    }

    private function estateIdFromModel(Model $model): ?int
    {
        if ($model instanceof Estate) {
            return $model->id;
        }

        if (array_key_exists('estate_id', $model->getAttributes())) {
            return $this->nullableInt($model->getAttribute('estate_id'));
        }

        $estate = $model->relationLoaded('estate') ? $model->getRelation('estate') : null;

        return $estate instanceof Estate ? $estate->id : null;
    }

    private function zoneIdFromModel(Model $model): ?int
    {
        if (! array_key_exists('zone_id', $model->getAttributes())) {
            return null;
        }

        return $this->nullableInt($model->getAttribute('zone_id'));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function targetRoleFromPayload(Notification $notification, array $data, User $notifiable, ?int $estateId): ?string
    {
        $path = $this->payloadPath($data);

        if (str_starts_with($path, '/partner')) {
            return 'affiliate';
        }

        if (str_starts_with($path, '/admin')) {
            return 'admin';
        }

        if (str_starts_with($path, '/security')) {
            return 'security';
        }

        if (str_starts_with($path, '/resident/property-owner')) {
            return 'property_owner';
        }

        if (str_starts_with($path, '/resident')) {
            return $this->residentFacingRole($notifiable, $estateId);
        }

        $class = $notification::class;

        if (str_contains($class, '\\Partner\\')) {
            return 'affiliate';
        }

        if (str_contains($class, '\\PropertyOwner\\')) {
            return 'property_owner';
        }

        if (str_contains($class, '\\Admin\\')) {
            return 'admin';
        }

        if (str_contains($class, '\\Security\\') || str_contains($class, 'SecurityInvited')) {
            return 'security';
        }

        if (
            str_contains($class, '\\Resident\\')
            || str_contains($class, 'Resident')
            || str_contains($class, 'Visitor')
            || str_contains($class, '\\EstateBoard\\')
            || str_contains($class, '\\Incidents\\')
        ) {
            return $this->residentFacingRole($notifiable, $estateId);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function payloadPath(array $data): string
    {
        $url = (string) ($data['action_url'] ?? $data['url'] ?? $data['href'] ?? '');

        if ($url === '') {
            return '';
        }

        return parse_url($url, PHP_URL_PATH) ?: $url;
    }

    private function residentFacingRole(User $notifiable, ?int $estateId): string
    {
        if ($estateId === null) {
            return 'resident';
        }

        $roles = AdministrativeAssignment::query()
            ->where('user_id', $notifiable->id)
            ->where('estate_id', $estateId)
            ->where('is_active', true)
            ->whereHas('role', fn (Builder $query) => $query->whereIn('name', ['resident', 'property_owner', 'household_member']))
            ->with('role')
            ->get()
            ->pluck('role.name')
            ->filter()
            ->values();

        foreach (['resident', 'property_owner', 'household_member'] as $role) {
            if ($roles->contains($role)) {
                return $role;
            }
        }

        return 'resident';
    }

    private function matchingAssignment(User $notifiable, ?int $assignmentId, ?int $estateId, ?string $targetRole, ?int $zoneId): ?AdministrativeAssignment
    {
        if ($assignmentId !== null) {
            $assignment = AdministrativeAssignment::with('role')
                ->where('user_id', $notifiable->id)
                ->where('is_active', true)
                ->find($assignmentId);

            return $assignment instanceof AdministrativeAssignment ? $assignment : null;
        }

        if ($estateId === null || $targetRole === null || $targetRole === 'affiliate') {
            return null;
        }

        return AdministrativeAssignment::with('role')
            ->where('user_id', $notifiable->id)
            ->where('estate_id', $estateId)
            ->where('is_active', true)
            ->whereHas('role', fn (Builder $query) => $query->where('name', $targetRole))
            ->when($zoneId !== null, fn (Builder $query) => $query->where(function (Builder $zoneQuery) use ($zoneId): void {
                $zoneQuery
                    ->whereNull('zone_id')
                    ->orWhere('zone_id', $zoneId);
            }))
            ->orderByDesc('is_primary')
            ->orderBy('id')
            ->first();
    }

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_numeric($value)) {
            return null;
        }

        return (int) $value;
    }

    private function normalizeRole(mixed $role): ?string
    {
        if (! is_string($role) || trim($role) === '') {
            return null;
        }

        return str($role)->lower()->replace('-', '_')->toString();
    }
}
