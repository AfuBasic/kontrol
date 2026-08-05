<?php

namespace App\Models\Compliance;

use App\Models\Estate;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompliancePolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'estate_id',
        'violation_type',
        'name',
        'description',
        'is_active',
        'payment_plan_policy',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'payment_plan_policy' => 'array',
        ];
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function stages(): HasMany
    {
        return $this->hasMany(PolicyStage::class)->orderBy('order');
    }

    public function violations(): HasMany
    {
        return $this->hasMany(Violation::class);
    }
}
