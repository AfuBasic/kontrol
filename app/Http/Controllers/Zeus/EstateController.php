<?php

namespace App\Http\Controllers\Zeus;

use App\Actions\Zeus\CreateEstateAction;
use App\Actions\Zeus\DeleteEstateAction;
use App\Actions\Zeus\ResetEstateAdminPasswordAction;
use App\Actions\Zeus\ToggleEstateStatusAction;
use App\Actions\Zeus\UpdateEstateAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Zeus\StoreEstateRequest;
use App\Http\Requests\Zeus\UpdateEstateRequest;
use App\Models\Estate;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EstateController extends Controller
{
    public function index(): Response
    {
        $search = request('search');
        $status = request('status');

        $query = Estate::query()
            ->with('subscriptionRecord.plan:id,name,billing_interval');

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%");
        }

        if ($status) {
            $query->where('status', $status);
        }

        $estates = $query->paginate(15);

        return Inertia::render('Zeus/Estates/Index', [
            'estates' => $estates,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Zeus/Estates/Create', [
            'plans' => Plan::with('features')->get(),
        ]);
    }

    public function store(StoreEstateRequest $request, CreateEstateAction $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()
            ->route('zeus.estates.index')
            ->with('success', 'Estate created successfully. An invitation has been sent.');
    }

    public function edit(Estate $estate): Response
    {
        return Inertia::render('Zeus/Estates/Edit', [
            'estate' => array_merge(
                $estate->only(['id', 'name', 'email', 'address', 'status']),
                ['admin_accepted' => $estate->hasAcceptedAdmin()],
                ['charge_type' => $estate->settings?->charge_type ?? 'residents'],
                ['free_trial_enabled' => $estate->settings?->free_trial_enabled ?? true],
                ['free_trial_days' => $estate->settings?->free_trial_days ?? 30]
            ),
        ]);
    }

    public function update(UpdateEstateRequest $request, Estate $estate, UpdateEstateAction $action): RedirectResponse
    {
        $action->execute($estate, $request->validated());

        return redirect()
            ->route('zeus.estates.edit', $estate->id)
            ->with('success', 'Estate updated successfully.');
    }

    public function toggleStatus(Estate $estate, ToggleEstateStatusAction $action): RedirectResponse
    {
        $action->execute($estate);

        $status = $estate->fresh()->status;

        return redirect()
            ->route('zeus.estates.index')
            ->with('success', "Estate {$status} successfully.");
    }

    public function resetPassword(Estate $estate, ResetEstateAdminPasswordAction $action): RedirectResponse
    {
        $action->execute($estate);

        return redirect()
            ->route('zeus.estates.index')
            ->with('success', 'Password reset link has been sent to the estate admin.');
    }

    public function destroy(Estate $estate, DeleteEstateAction $action): RedirectResponse
    {
        $action->execute($estate);

        return redirect()
            ->route('zeus.estates.index')
            ->with('success', 'Estate deleted successfully.');
    }
}
