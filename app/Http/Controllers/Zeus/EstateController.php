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
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EstateController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('zeus/estates/create');
    }

    public function store(StoreEstateRequest $request, CreateEstateAction $action): RedirectResponse
    {
        $action->execute($request->validated());

        return redirect()
            ->route('zeus.dashboard')
            ->with('success', 'Estate created successfully. An invitation has been sent.');
    }

    public function edit(Estate $estate): Response
    {
        return Inertia::render('zeus/estates/edit', [
            'estate' => $estate->only(['id', 'name', 'email', 'address', 'status']),
        ]);
    }

    public function update(UpdateEstateRequest $request, Estate $estate, UpdateEstateAction $action): RedirectResponse
    {
        $action->execute($estate, $request->validated());

        return redirect()
            ->route('zeus.dashboard')
            ->with('success', 'Estate updated successfully.');
    }

    public function toggleStatus(Estate $estate, ToggleEstateStatusAction $action): RedirectResponse
    {
        $action->execute($estate);

        $status = $estate->fresh()->status;

        return redirect()
            ->route('zeus.dashboard')
            ->with('success', "Estate {$status} successfully.");
    }

    public function resetPassword(Estate $estate, ResetEstateAdminPasswordAction $action): RedirectResponse
    {
        $action->execute($estate);

        return redirect()
            ->route('zeus.dashboard')
            ->with('success', 'Password reset link has been sent to the estate admin.');
    }

    public function destroy(Estate $estate, DeleteEstateAction $action): RedirectResponse
    {
        $action->execute($estate);

        return redirect()
            ->route('zeus.dashboard')
            ->with('success', 'Estate deleted successfully.');
    }
}
