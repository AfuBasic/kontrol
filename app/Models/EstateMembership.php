<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class EstateMembership extends Pivot
{
    protected $table = 'estate_users_membership';

    public $incrementing = true;

    protected $guarded = [];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function estate()
    {
        return $this->belongsTo(Estate::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }

    public function propertyOwner()
    {
        return $this->belongsTo(User::class, 'property_owner_id');
    }
}
