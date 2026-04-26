<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\EmergencyContact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmergencyContactController extends Controller
{
    /**
     * Store a newly created emergency contact.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'relationship' => ['nullable', 'string', 'max:255'],
        ]);

        $request->user()->emergencyContacts()->create($validated);

        return back()->with('success', 'Emergency contact added successfully.');
    }

    /**
     * Remove the specified emergency contact.
     */
    public function destroy(EmergencyContact $emergencyContact): RedirectResponse
    {
        // Ensure the contact belongs to the user
        if ($emergencyContact->user_id !== auth()->id()) {
            abort(403);
        }

        $emergencyContact->delete();

        return back()->with('success', 'Emergency contact removed successfully.');
    }
}
