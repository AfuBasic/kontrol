<?php

namespace App\Events\Zeus;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EstateCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Estate $estate,
        public User $user,
    ) {}
}
