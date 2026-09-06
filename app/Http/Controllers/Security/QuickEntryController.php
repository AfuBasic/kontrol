<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\CheckoutQuickEntryAction;
use App\Actions\Security\RecordQuickEntryAction;
use App\Actions\Security\ReserveQuickEntryTagsAction;
use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use App\Models\EstateOrganization;
use App\Services\EstateContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class QuickEntryController extends Controller
{
    public function __construct(
        protected ReserveQuickEntryTagsAction $reserveTagsAction,
        protected RecordQuickEntryAction $recordQuickEntryAction,
        protected CheckoutQuickEntryAction $checkoutQuickEntryAction,
    ) {}

    /**
     * Reserve a block of Quick Entry tags for offline/online gate use.
     */
    public function reserve(Request $request): JsonResponse
    {
        $estate = app(EstateContextService::class)->getEstate();
        $user = $request->user();

        $count = (int) $request->input('count', 50);
        $deviceFingerprint = $request->input('device_fingerprint');

        $result = $this->reserveTagsAction->execute(
            estateId: $estate->id,
            guard: $user,
            deviceFingerprint: $deviceFingerprint,
            count: max(10, min($count, 100)),
        );

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Log a Quick Entry arrival in real-time.
     */
    public function store(Request $request): JsonResponse
    {
        $estate = app(EstateContextService::class)->getEstate();
        $user = $request->user();

        $validated = $request->validate([
            'tag' => ['required', 'string', 'size:4'],
            'organization_id' => [
                'required',
                'integer',
                Rule::exists('estate_organizations', 'id')->where('estate_id', $estate->id),
            ],
            'visitor_name' => ['nullable', 'string', 'max:255'],
            'vehicle_plate_number' => ['nullable', 'string', 'max:50'],
            'vehicle_make' => ['nullable', 'string', 'max:50'],
            'vehicle_model' => ['nullable', 'string', 'max:50'],
            'allocation_id' => ['nullable', 'integer'],
        ]);

        $log = $this->recordQuickEntryAction->execute(
            estateId: $estate->id,
            verifiedBy: $user,
            data: $validated,
        );

        return response()->json([
            'success' => true,
            'message' => 'Quick entry recorded successfully.',
            'log' => $log,
        ]);
    }

    /**
     * Sync batched offline Quick Entry logs.
     */
    public function sync(Request $request): JsonResponse
    {
        $estate = app(EstateContextService::class)->getEstate();
        $user = $request->user();

        $request->validate([
            'logs' => ['required', 'array'],
            'logs.*.tag' => ['required', 'string'],
            'logs.*.organization_id' => ['required', 'integer'],
            'logs.*.verified_at' => ['required', 'string'],
            'logs.*.visitor_name' => ['nullable', 'string'],
            'logs.*.vehicle_plate_number' => ['nullable', 'string'],
            'logs.*.vehicle_make' => ['nullable', 'string'],
            'logs.*.vehicle_model' => ['nullable', 'string'],
            'logs.*.allocation_id' => ['nullable', 'integer'],
        ]);

        $logs = $request->input('logs', []);
        $syncedCount = 0;
        $errors = [];

        foreach ($logs as $index => $logData) {
            try {
                $this->recordQuickEntryAction->execute(
                    estateId: $estate->id,
                    verifiedBy: $user,
                    data: $logData,
                );
                $syncedCount++;
            } catch (Throwable $e) {
                $errors[] = [
                    'index' => $index,
                    'tag' => $logData['tag'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'synced_count' => $syncedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Lookup active quick entry by tag before checkout.
     */
    public function lookup(Request $request): JsonResponse
    {
        $estate = app(EstateContextService::class)->getEstate();
        $tag = strtoupper(trim((string) $request->input('tag', '')));

        if (empty($tag)) {
            return response()->json(['success' => false, 'message' => 'Tag is required.'], 422);
        }

        $log = AccessLog::withoutGlobalScopes()
            ->where('estate_id', $estate->id)
            ->whereNull('access_code_id')
            ->where('meta->tag', $tag)
            ->whereNull('checked_out_at')
            ->latest('verified_at')
            ->first();

        if (! $log) {
            return response()->json([
                'success' => false,
                'message' => "No active Quick Entry found for tag '{$tag}'.",
            ], 404);
        }

        return response()->json([
            'success' => true,
            'log' => [
                'id' => $log->id,
                'tag' => $log->meta['tag'] ?? $tag,
                'visitor_name' => $log->meta['visitor_name'] ?? 'Visitor',
                'organization_name' => $log->meta['organization_name'] ?? 'Organization',
                'entry_point' => $log->entry_point,
                'verified_at' => $log->verified_at->toIso8601String(),
                'vehicle_plate_number' => $log->vehicle_plate_number,
            ],
        ]);
    }

    /**
     * Check out a Quick Entry visitor by tag.
     */
    public function checkout(Request $request): JsonResponse
    {
        $estate = app(EstateContextService::class)->getEstate();
        $user = $request->user();

        $request->validate([
            'tag' => ['required', 'string'],
        ]);

        $log = $this->checkoutQuickEntryAction->execute(
            tag: $request->input('tag'),
            estateId: $estate->id,
            verifiedBy: $user,
        );

        return response()->json([
            'success' => true,
            'message' => 'Visitor checked out successfully.',
            'log' => $log,
        ]);
    }
}
