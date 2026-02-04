<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\EstateSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EstateContactController extends Controller
{
    /**
     * Display the estate contacts page.
     */
    public function index(): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        // precise logic: get the first accepted estate, similar to AccessCodeService
        $estate = $user->estates()
            ->wherePivot('status', 'accepted')
            ->firstOrFail();

        $settings = EstateSettings::forEstate($estate->id);

        return Inertia::render('resident/contacts/index', [
            'contacts' => $settings->contacts ?? [],
            'estateName' => $estate->name,
        ]);
    }
}
