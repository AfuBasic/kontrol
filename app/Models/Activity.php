<?php

namespace App\Models;

use App\Auth\ContextManager;
use App\Services\Zeus\ImpersonationService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Spatie\Activitylog\Models\Activity as SpatieActivity;

/**
 * @property int $id
 * @property int|null $estate_id
 * @property string|null $log_name
 * @property string $description
 * @property string|null $subject_type
 * @property string|null $event
 * @property int|null $subject_id
 * @property string|null $causer_type
 * @property int|null $causer_id
 * @property Collection<array-key, mixed>|null $properties
 * @property string|null $batch_uuid
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Model|null $causer
 * @property-read Collection $changes
 * @property-read Model|null $subject
 *
 * @method static Builder<static>|Activity causedBy(\Illuminate\Database\Eloquent\Model $causer)
 * @method static Builder<static>|Activity forBatch(string $batchUuid)
 * @method static Builder<static>|Activity forEvent(string $event)
 * @method static Builder<static>|Activity forSubject(\Illuminate\Database\Eloquent\Model $subject)
 * @method static Builder<static>|Activity hasBatch()
 * @method static Builder<static>|Activity inLog(...$logNames)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereBatchUuid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereCauserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereCauserType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereEstateId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereEvent($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereLogName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereProperties($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereSubjectId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereSubjectType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Activity whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class Activity extends SpatieActivity
{
    protected static function booted(): void
    {
        static::creating(function ($activity): void {
            // Check if Support Mode / Impersonation is active
            $impersonationService = app(ImpersonationService::class);
            if ($impersonationService->isImpersonating()) {
                $session = $impersonationService->getActiveSession();
                if ($session) {
                    $props = $activity->properties ? $activity->properties->toArray() : [];
                    $props['impersonation'] = true;
                    $props['impersonation_session_id'] = $session->id;
                    $props['provider_identifier'] = $session->provider_identifier;
                    $props['effective_user_id'] = $session->effective_user_id;
                    $props['effective_actor_name'] = $session->effectiveUser?->name ?? 'Administrator';
                    $props['reason'] = $session->reason;
                    $activity->properties = $props;
                    $activity->estate_id = $session->estate_id;

                    return;
                }
            }

            // Try to get estate_id from active ContextManager
            $context = app(ContextManager::class)->current();
            if ($context && $context->estateId) {
                $activity->estate_id = $context->estateId;

                return;
            }

            // Fallback: try to get estate_id from the causer (for non-web contexts like Telegram)
            if ($activity->causer && method_exists($activity->causer, 'resolveHeadlessEstate')) {
                try {
                    $activity->estate_id = $activity->causer->resolveHeadlessEstate()->id;

                    return;
                } catch (\Throwable) {
                    // Causer has no estate
                }
            }

            // Check properties for estate_id
            if (isset($activity->properties['estate_id'])) {
                $activity->estate_id = (int) $activity->properties['estate_id'];

                return;
            }

            // Fallback: try to get estate_id from the subject
            if ($activity->subject && isset($activity->subject->estate_id)) {
                $activity->estate_id = $activity->subject->estate_id;
            }
        });
    }
}
