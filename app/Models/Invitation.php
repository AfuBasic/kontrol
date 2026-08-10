<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

class Invitation extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function estate()
    {
        return $this->belongsTo(Estate::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function zone()
    {
        return $this->belongsTo(Zone::class);
    }
}
