<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\ReserveQuickEntryAction;
use App\Models\EstateOrganization;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ReserveController
{
    public function __construct(private ReserveQuickEntryAction $reserveAction) {}

    public function __invoke(Request $request): JsonResponse
    {
        $estateId = $request->attributes->get('estate_id');

        $validated = $request->validate([
            'organization_id' => ['required', 'exists:estate_organizations,id'],
            'visitor_name' => ['nullable', 'string', 'max:255'],
            'vehicle_plate_number' => ['nullable', 'string', 'max:20'],
            'vehicle_make' => ['nullable', 'string', 'max:50'],
            'vehicle_model' => ['nullable', 'string', 'max:50'],
            'arrival_in_minutes' => ['nullable', 'integer', 'min:1', 'max:120'],
            'id_photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $organization = EstateOrganization::where('estate_id', $estateId)
            ->where('id', $validated['organization_id'])
            ->firstOrFail();

        if (! $organization->is_active || ! $organization->quick_entry_enabled) {
            throw ValidationException::withMessages([
                'organization_id' => ['Quick entry is currently disabled for this organization.'],
            ]);
        }

        if (! $organization->isWithinPublicWindow()) {
            throw ValidationException::withMessages([
                'organization_id' => ['Quick Entry is not permitted right now. This organization has no active public window at the current time.'],
            ]);
        }

        $reservation = $this->reserveAction->execute(
            $estateId,
            $request->user(),
            $validated,
            $organization
        );

        return response()->json([
            'success' => true,
            'reservation' => [
                'id' => $reservation->id,
                'tag' => $reservation->meta['tag'],
                'status' => $reservation->meta['status'],
                'arrival_deadline' => $reservation->meta['arrival_deadline'],
                'expires_at' => $reservation->meta['expires_at'],
                'visitor_name' => $reservation->meta['visitor_name'],
                'visitor_profile_id' => $reservation->meta['visitor_profile_id'],
                'organization_name' => $organization->name,
                'entry_type' => $reservation->meta['entry_type'],
                'requires_confirmation' => $organization->requiresArrivalConfirmation(),
            ],
        ]);
    }
}
