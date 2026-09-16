<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrganizationBulkInviteRecipient extends Model
{
    use HasFactory;

    protected $fillable = [
        'bulk_invite_id',
        'email',
        'status',
        'last_access_code_id',
        'last_delivered_at',
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
}
