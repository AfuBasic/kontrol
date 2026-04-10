<?php

namespace App\Events\Admin;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public User $user,
        public Estate $estate,
    ) {}
}
