<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Zone extends Model
{
    use HasFactory, SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function estate()
    {
        return $this->belongsTo(Estate::class);
    }

    public function memberships()
    {
        return $this->hasMany(EstateMembership::class);
    }

    public function residents()
    {
        return $this->hasMany(EstateMembership::class)->where('relationship_type', 'resident');
    }

    public function propertyOwners()
    {
        return $this->hasMany(EstateMembership::class)->where('relationship_type', 'property_owner');
    }

    public function assignments()
    {
        return $this->hasMany(AdministrativeAssignment::class);
    }
}
