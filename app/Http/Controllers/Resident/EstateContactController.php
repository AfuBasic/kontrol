<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\EstateSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\EstateContextService;
use Inertia\Inertia;
use Inertia\Response;

class EstateContactController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display the estate contacts page.
     */
    public function index(): Response
    {
        $estate = $this->estateContext->getEstate();
        $settings = EstateSettings::forEstate($estate->id);

        return Inertia::render('resident/contacts/index', [
            'contacts' => $settings->contacts ?? [],
            'estateName' => $estate->name,
        ]);
    }

    /**
     * Get estate contacts as JSON.
     */
    public function apiIndex(): JsonResponse
    {
        $estate = $this->estateContext->getEstate();
        $settings = EstateSettings::forEstate($estate->id);

        return response()->json([
            'contacts' => $settings->contacts ?? [],
            'estateName' => $estate->name,
        ]);
    }
}
