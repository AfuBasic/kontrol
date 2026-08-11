<?php

namespace App\Models;

use App\Enums\AssignmentScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Role;

class AdministrativeAssignment extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'scope_type' => AssignmentScope::class,
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

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
