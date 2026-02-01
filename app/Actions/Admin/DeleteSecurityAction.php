<?php

namespace App\Actions\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class DeleteSecurityAction
{
    public function execute(User $security, Estate $estate): void
    {
        activity()
            ->performedOn($security)
            ->causedBy(Auth::user())
            ->withProperties(['estate_id' => $estate->id])
            ->log('deleted security personnel ' . $security->name);

        $security->delete();
    }
}
