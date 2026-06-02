<?php

namespace App\Models;

use App\Traits\GeneratesUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    use GeneratesUlid;

    protected $fillable = [
        'estate_id',
        'property_owner_id',
        'name',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
        ];
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'property_owner_id');
    }

    public function residents(): HasMany
    {
        return $this->hasMany(UserProfile::class, 'property_id');
    }
}
