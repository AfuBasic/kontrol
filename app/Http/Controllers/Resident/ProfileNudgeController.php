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
     * Save the missing unit and/or address from where the gap is noticed (the pass form), without leaving it.
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

        // Only write what was sent, so saving one missing detail never blanks the other.
        $changes = array_map('trim', array_filter(
            array_intersect_key($validated, array_flip(['unit_number', 'address'])),
            filled(...),
        ));

        $request->user()->profile()->updateOrCreate(['user_id' => $request->user()->id], $changes);

        // Drop the cached copy so the rest of this session sees the saved address straight away.
        $request->user()->unsetRelation('profile');

        return back()->with('success', 'Address saved.');
    }
}
