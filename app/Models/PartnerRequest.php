<?php

namespace App\Models;

use App\Enums\PartnerRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'estate_name',
        'estate_address',
        'chairman_name',
        'chairman_phone',
        'chairman_email',
        'number_of_houses',
        'state',
        'lga',
        'notes',
        'partner_id',
        'estate_id',
        'status',
        'rejection_reason',
        'info_request_message',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => PartnerRequestStatus::class,
            'number_of_houses' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Partner, $this>
     */
    public function partner(): BelongsTo
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * @return BelongsTo<Estate, $this>
     */
    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }
}
