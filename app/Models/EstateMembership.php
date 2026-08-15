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
        'initiated_at' => 'datetime',
        'last_invited_at' => 'datetime',
        'accepted_at' => 'datetime',
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

    public function initiatedBy()
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function lastInvitedBy()
    {
        return $this->belongsTo(User::class, 'last_invited_by');
    }

    public function invitation()
    {
        return $this->belongsTo(Invitation::class, 'invitation_id');
    }

    public function invitationLink()
    {
        return $this->belongsTo(EstateInviteLink::class, 'invitation_link_id');
    }
}
