<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\UpdateEstateSettingsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateEstateSettingsRequest;
use App\Services\Admin\UserService;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function __construct(
        protected UserService $userService,
        protected EstateContextService $estateContext
    ) {}

    public function index(): Response
    {
        $estate = $this->estateContext->getEstate();
        $settings = $estate->settings;

        // Create settings with defaults if they don't exist
        if (! $settings) {
            $settings = $estate->settings()->create([]);
        }

        return Inertia::render('Admin/Settings/Index', [
            'settings' => [
                'access_codes_enabled' => $settings->access_codes_enabled,
                'access_code_min_lifespan_minutes' => $settings->access_code_min_lifespan_minutes,
                'access_code_max_lifespan_minutes' => $settings->access_code_max_lifespan_minutes,
                'access_code_single_use' => $settings->access_code_single_use,
                'access_code_grace_period_minutes' => $settings->access_code_grace_period_minutes,
                'access_code_daily_limit_per_resident' => $settings->access_code_daily_limit_per_resident,
                'access_code_require_confirmation' => $settings->access_code_require_confirmation,
                'free_trial_enabled' => $settings->free_trial_enabled,
                'free_trial_days' => $settings->free_trial_days,
                'grace_period_days' => $settings->grace_period_days,
                'contacts' => $settings->contacts ?? [],
            ],
        ]);
    }

    public function update(UpdateEstateSettingsRequest $request, UpdateEstateSettingsAction $action): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();
        $settings = $estate->settings;

        if (! $settings) {
            $settings = $estate->settings()->create([]);
        }

        $action->execute($settings, $request->validated());

        return back()->with('success', 'Settings updated successfully.');
    }
}
