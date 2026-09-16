<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationBulkInviteRenewal extends Model
{
    use HasFactory;

    protected $fillable = [
        'bulk_invite_id',
        'cycle_key',
        'valid_from',
        'valid_until',
        'status',
        'processed_at',
        'recipients_renewed',
        'recipients_blocked',
        'blocked_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'valid_from' => 'date',
            'valid_until' => 'date',
            'processed_at' => 'datetime',
            'recipients_renewed' => 'integer',
            'recipients_blocked' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<OrganizationBulkInvite, $this>
     */
    public function bulkInvite(): BelongsTo
    {
        return $this->belongsTo(OrganizationBulkInvite::class, 'bulk_invite_id');
    }
}
