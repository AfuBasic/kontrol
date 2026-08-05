<?php

namespace App\Models\Compliance;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Restriction extends Model
{
    use HasFactory;

    protected $table = 'compliance_restrictions';

    protected $fillable = [
        'violation_id',
        'user_id',
        'estate_id',
        'feature_key',
        'status',
        'restricted_at',
        'lifted_at',
        'lift_reason',
    ];

    protected function casts(): array
    {
        return [
            'restricted_at' => 'datetime',
            'lifted_at' => 'datetime',
        ];
    }

    public function violation(): BelongsTo
    {
        return $this->belongsTo(Violation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }
}
