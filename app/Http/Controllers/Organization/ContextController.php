<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\EstateOrganization;
use App\Services\OrganizationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ContextController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
    ) {}

    public function switchOrganization(Request $request, EstateOrganization $organization): RedirectResponse
    {
        try {
            $this->contextService->switchOrganization($organization->id);

            return redirect()->route('org.dashboard')
                ->with('success', "Switched to {$organization->name}.");
        } catch (\Throwable $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
