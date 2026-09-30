<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\CheckoutQuickEntryAction;
use App\Actions\Security\RecordQuickEntryAction;
use App\Models\EstateOrganization;
use App\Models\VisitorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class QuickEntryController
{
    public function __construct(
        private RecordQuickEntryAction $recordAction,
        private CheckoutQuickEntryAction $checkoutAction,
    ) {}

    /**
     * Log a quick entry admission.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $estateId = $request->attributes->get('estate_id');

        $validated = $request->validate([
            'organization_id' => ['required', 'exists:estate_organizations,id'],
            'visitor_name' => ['nullable', 'string', 'max:255'],
            'id_photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'vehicle_plate_number' => ['nullable', 'string', 'max:20'],
            'vehicle_make' => ['nullable', 'string', 'max:50'],
            'vehicle_model' => ['nullable', 'string', 'max:50'],
            'entry_point' => ['nullable', 'string', 'max:100'],
        ]);

        // Ensure the org belongs to this estate
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

        $log = $this->recordAction->execute($estateId, $user, $validated);

        $isReturning = $log->meta['visitor_profile_id'] !== null
            && VisitorProfile::find($log->meta['visitor_profile_id'])?->visit_count > 1;

        return response()->json([
            'success' => true,
            'tag' => $log->meta['tag'],
            'visitor_name' => $log->meta['visitor_name'],
            'visitor_profile_id' => $log->meta['visitor_profile_id'],
            'organization_name' => $organization->name,
            'entry_type' => $log->meta['entry_type'],
            'is_returning_visitor' => $isReturning,
            'verified_at' => $log->verified_at,
            'entry_point' => $log->entry_point,
        ]);
    }

    /**
     * Sync offline quick entry logs.
     */
    public function sync(Request $request): JsonResponse
    {
        $user = $request->user();
        $estateId = $request->attributes->get('estate_id');

        $validated = $request->validate([
            'logs' => ['required', 'array', 'min:1'],
            'logs.*.tag' => ['required', 'string', 'max:4'],
            'logs.*.organization_id' => ['required', 'integer', 'exists:estate_organizations,id'],
            'logs.*.visitor_name' => ['nullable', 'string', 'max:255'],
            'logs.*.verified_at' => ['nullable', 'string'],
            'logs.*.vehicle_plate_number' => ['nullable', 'string', 'max:20'],
            'logs.*.vehicle_make' => ['nullable', 'string', 'max:50'],
            'logs.*.vehicle_model' => ['nullable', 'string', 'max:50'],
        ]);

        $syncedCount = 0;
        $errors = [];

        foreach ($validated['logs'] as $index => $logData) {
            try {
                $organization = EstateOrganization::where('estate_id', $estateId)
                    ->where('id', $logData['organization_id'])
                    ->firstOrFail();

                if (! $organization->is_active || ! $organization->quick_entry_enabled) {
                    $errors[] = ['index' => $index, 'tag' => $logData['tag'], 'error' => 'Organization not eligible for quick entry.'];

                    continue;
                }

                $this->recordAction->execute($estateId, $user, $logData);
                $syncedCount++;
            } catch (\Throwable $e) {
                $errors[] = ['index' => $index, 'tag' => $logData['tag'], 'error' => $e->getMessage()];
            }
        }

        return response()->json([
            'success' => $syncedCount > 0,
            'synced_count' => $syncedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Look up an active quick entry visitor by tag.
     */
    public function lookup(Request $request): JsonResponse
    {
        $estateId = $request->attributes->get('estate_id');

        $request->validate([
            'tag' => ['required', 'string', 'max:4'],
        ]);

        $tag = strtoupper($request->input('tag'));

        $log = AccessLog::withoutGlobalScopes()
            ->where('estate_id', $estateId)
            ->whereNull('access_code_id')
            ->where('meta->entry_type', 'quick_entry')
            ->where('meta->tag', $tag)
            ->whereNull('checked_out_at')
            ->latest('verified_at')
            ->first();

        if (! $log) {
            return response()->json([
                'found' => false,
                'tag' => $tag,
            ]);
        }

        return response()->json([
            'found' => true,
            'tag' => $log->meta['tag'],
            'visitor_name' => $log->meta['visitor_name'],
            'organization_name' => $log->meta['organization_name'] ?? null,
            'verified_at' => $log->verified_at?->toIso8601String(),
            'entry_point' => $log->entry_point,
        ]);
    }

    /**
     * Checkout a quick entry visitor by tag.
     */
    public function checkout(Request $request): JsonResponse
    {
        $user = $request->user();
        $estateId = $request->attributes->get('estate_id');

        $validated = $request->validate([
            'tag' => ['required', 'string', 'max:4'],
        ]);

        $log = $this->checkoutAction->execute(
            $validated['tag'],
            $estateId,
            $user
        );

        return response()->json([
            'success' => true,
            'tag' => $log->meta['tag'],
            'visitor_name' => $log->meta['visitor_name'],
            'checked_out_at' => $log->checked_out_at,
            'exit_point' => $log->meta['exit_point'] ?? null,
        ]);
    }
}
