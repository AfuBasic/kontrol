<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Support\ProfileCompleteness;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProfileNudgeController extends Controller
{
    /**
     * "Not now" on the dashboard reminder.
     */
    public function dismiss(Request $request): RedirectResponse
    {
        ProfileCompleteness::dismiss($request->user());

        return back();
    }

    /**
     * Save just the address from where the gap is noticed (the pass form), without leaving it.
     */
    public function saveAddress(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'unit_number' => ['nullable', 'string', 'max:50', 'required_without:address'],
            'address' => ['nullable', 'string', 'max:255', 'required_without:unit_number'],
        ], [
            'unit_number.required_without' => 'Add your unit number or your address.',
            'address.required_without' => 'Add your unit number or your address.',
        ]);

        $request->user()->profile()->updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'unit_number' => filled($validated['unit_number'] ?? null) ? trim($validated['unit_number']) : null,
                'address' => filled($validated['address'] ?? null) ? trim($validated['address']) : null,
            ],
        );

        // Drop the cached copy so the rest of this session sees the saved address straight away.
        $request->user()->unsetRelation('profile');

        return back()->with('success', 'Address saved.');
    }
}
