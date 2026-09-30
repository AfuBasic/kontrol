<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\ReserveQuickEntryAction;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ConfirmController
{
    public function __construct(private ReserveQuickEntryAction $reserveAction) {}

    /**
     * Confirm an arrival at the checkpoint.
     */
    public function __invoke(Request $request, string $tag): JsonResponse
    {
        $estateId = $request->attributes->get('estate_id');
        $user = $request->user();

        try {
            $log = $this->reserveAction->confirmArrival($tag, $estateId, $user);
        } catch (ModelNotFoundException $e) {
            throw ValidationException::withMessages([
                'tag' => ['Invalid or expired tag.'],
            ]);
        }

        return response()->json([
            'success' => true,
            'tag' => $log->meta['tag'],
            'visitor_name' => $log->meta['visitor_name'],
            'status' => 'confirmed',
            'arrival_confirmed_at' => $log->meta['arrival_confirmed_at'] ?? now()->toIso8601String(),
            'organization_name' => $log->meta['organization_name'],
        ]);
    }
}
