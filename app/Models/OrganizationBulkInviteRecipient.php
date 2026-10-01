<?php

namespace App\Models;

use App\Enums\AccessCodeStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrganizationBulkInviteRecipient extends Model
{
    use HasFactory;

    protected $fillable = [
        'bulk_invite_id',
        'email',
        'status',
        'last_access_code_id',
        'last_delivered_at',
        'delivery_status',
        'delivery_error',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_delivered_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<OrganizationBulkInvite, $this>
     */
    public function bulkInvite(): BelongsTo
    {
        return $this->belongsTo(OrganizationBulkInvite::class, 'bulk_invite_id');
    }

    /**
     * @return BelongsTo<AccessCode, $this>
     */
    public function lastAccessCode(): BelongsTo
    {
        return $this->belongsTo(AccessCode::class, 'last_access_code_id');
    }

    /**
     * Every pass issued to this recipient, one per renewal cycle.
     *
     * @return HasMany<AccessCode, $this>
     */
    public function accessCodes(): HasMany
    {
        return $this->hasMany(AccessCode::class, 'bulk_invite_recipient_id');
    }

    /**
     * Passes that can still open the gate now or later (not revoked, used up, or expired).
     *
     * @return HasMany<AccessCode, $this>
     */
    public function usablePasses(): HasMany
    {
        return $this->accessCodes()
            ->whereIn('status', [AccessCodeStatus::Active, AccessCodeStatus::Scheduled])
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->orderBy('starts_at');
    }

    /**
     * The pass to present at the gate: the one valid right now, otherwise the next one to start.
     *
     * After an early renewal the newest pass (last_access_code_id) may not start for days,
     * while the previous cycle's pass is still the one that works today.
     */
    public function currentPass(): ?AccessCode
    {
        $passes = $this->relationLoaded('usablePasses') ? $this->usablePasses : $this->usablePasses()->get();

        return $passes->first(fn (AccessCode $pass) => $pass->starts_at === null || $pass->starts_at->lte(now()))
            ?? $passes->first();
    }
}
