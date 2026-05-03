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

        if (! $user) {
            throw new \Exception('Unauthenticated');
        }

        // In a real multi-tenant app, we might store the current estate_id in the session
        // For now, we'll use the user's current estate but ensure it's validated
        $estate = $user->getCurrentEstate();

        if (! $estate) {
            throw new \Exception('No estate access');
        }

        return $estate;
    }

    /**
     * Get the ID of the current active estate.
     */
    public function getEstateId(): int
    {
        return $this->getEstate()->id;
    }

    /**
     * Set the current estate for the user (e.g. in session).
     */
    public function setEstate(Estate $estate): void
    {
        session(['current_estate_id' => $estate->id]);
    }
}
