<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class SuspendSecurityAction
{
    public function execute(User $security, Estate $estate): void
    {
        $security->update([
            'suspended_at' => $security->suspended_at ? null : now(),
        ]);

        activity()
            ->performedOn($security)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id])
            ->log($security->suspended_at ? 'suspended security personnel ' . $security->name : 'activated security personnel ' . $security->name);
    }
}
