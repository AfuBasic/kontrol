<?php

namespace App\Services;

use App\Models\Estate;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class EstateContextService
{
    /**
     * Get the current active estate from the authenticated user.
     */
    public function getEstate(): Estate
    {
        /** @var User $user */
        $user = Auth::user();
        return $user->getCurrentEstate();
    }

    /**
     * Get the ID of the current active estate.
     */
    public function getEstateId(): int
    {
        return $this->getEstate()->id;
    }
}
