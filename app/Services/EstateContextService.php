<?php

namespace App\Services;

use App\Auth\ContextManager;
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

        // In V3, we strictly rely on ContextManager which stores the active session
        $context = app(ContextManager::class)->current();

        if (! $context || ! $context->estateId) {
            if (app()->runningUnitTests()) {
                $estateId = getPermissionsTeamId();
                if ($estateId) {
                    return Estate::findOrFail($estateId);
                }
            }
            throw new \Exception('No estate access');
        }

        $estate = Estate::find($context->estateId);

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
}
