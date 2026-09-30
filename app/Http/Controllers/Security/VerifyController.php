<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\CheckoutQuickEntryAction;
use App\Actions\Security\RecordCheckInAction;
use App\Actions\Security\RecordCheckOutAction;
use App\Actions\Security\ValidateAccessCodeAction;
use App\Enums\AccessCodeStatus;
use App\Http\Controllers\Controller;
use App\Models\AccessCode;
use App\Models\AccessLog;
use App\Models\Estate;
use App\Models\EstateSettings;
use App\Services\EstateContextService;
use App\Services\Security\CheckpointClaimService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class VerifyController extends Controller
{
    public function __construct(private CheckpointClaimService $checkpointClaim) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $estate = Estate::findOrFail($request->attributes->get('estate_id'));
        $gateName = $this->checkpointClaim->getCurrentCheckpoint($estate->id, $user);
        $settings = EstateSettings::forEstate($estate->id);

        $organizations = $estate->organizations()
            ->where('is_active', true)
            ->where('quick_entry_enabled', true)
            ->select(['id', 'name', 'type', 'access_policy'])
            ->orderBy('name')
            ->get()
            ->map(fn ($org) => [
                'id' => $org->id,
                'name' => $org->name,
                'type' => $org->type,
                'access_policy' => $org->access_policy,
                'is_open' => $org->isWithinPublicWindow(),
            ])
            ->values()
            ->all();

        return Inertia::render('Security/Verify', [
            'estateName' => $estate->name,
            'gateName' => $gateName ?? 'Main Entrance',
            'accessCodesEnabled' => (bool) $settings->access_codes_enabled,
            'visitorCheckoutEnabled' => (bool) $settings->visitor_checkout_enabled,
            'quickEntryEnabled' => (bool) $settings->quick_entry_enabled,
            'requireVehicleInformation' => (bool) $settings->require_vehicle_information,
            'organizations' => $organizations,
        ]);
    }

    public function validate(Request $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        $estate = Estate::findOrFail($request->attributes->get('estate_id'));

        $request->validate([
            'code' => ['required', 'string'],
            'source' => ['required', 'in:manual,quick_entry,access_code'],
        ]);

        $result = app(ValidateAccessCodeAction::class)->execute(
            code: $request->input('code'),
            estateId: $estate->id,
        );

        if ($result['valid']) {
            if (isset($result['action']) && $result['action'] === 'checkout') {
                $log = app(RecordCheckOutAction::class)->execute(
                    code: $request->input('code'),
                    estateId: $estate->id,
                    verifiedBy: $user
                );

                $result['access_log_id'] = $log->id;
                $result['checked_out_at'] = $log->checked_out_at?->toIso8601String();
                $result['duration_minutes'] = $log->checked_out_at && $log->verified_at
                    ? (int) $log->checked_out_at->diffInMinutes($log->verified_at)
                    : 0;
            } else {
                $log = app(RecordCheckInAction::class)->execute(
                    code: $request->input('code'),
                    estateId: $estate->id,
                    verifiedBy: $user,
                    vehicleData: [],
                    verificationMethod: $request->input('source')
                );

                $result['access_log_id'] = $log->id;
                $result['verified_at'] = $log->verified_at?->toIso8601String();
                $result['entry_point'] = $log->entry_point;
            }

            $accessCodeId = isset($log) ? $log->access_code_id : AccessLog::where('id', $result['access_log_id'])->value('access_code_id');
            $result['uses_count'] = AccessLog::where('access_code_id', $accessCodeId)->count();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'validation_result' => $result,
                ]);
            }

            return back()->with([
                'success' => "Code Verified: Found access code for {$result['visitor_name']}.",
                'validation_result' => $result,
            ]);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => false,
                'validation_result' => $result,
            ]);
        }

        return back()->with('validation_result', $result);
    }

    public function decision(Request $request): RedirectResponse|JsonResponse
    {
        $request->validate([
            'decision' => 'required|in:admit,reject,checkout',
            'reason' => 'nullable|string|max:500',
            'access_log_id' => 'nullable|exists:access_logs,id',
            'vehicle_make' => 'nullable|string|max:255',
            'vehicle_model' => 'nullable|string|max:255',
            'vehicle_plate_number' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $estate = Estate::findOrFail($request->attributes->get('estate_id'));

        if ($request->input('decision') === 'admit') {
            if ($request->filled('access_log_id')) {
                AccessLog::where('id', $request->input('access_log_id'))->update([
                    'vehicle_make' => $request->input('vehicle_make'),
                    'vehicle_model' => $request->input('vehicle_model'),
                    'vehicle_plate_number' => $request->input('vehicle_plate_number'),
                ]);
            } else {
                app(RecordCheckInAction::class)->execute(
                    code: $request->input('code'),
                    estateId: $estate->id,
                    verifiedBy: $user,
                    vehicleData: $request->only(['vehicle_make', 'vehicle_model', 'vehicle_plate_number'])
                );
            }
        }

        if ($request->input('decision') === 'checkout') {
            $code = (string) $request->input('code');
            $accessLogId = $request->input('access_log_id');
            $targetLog = null;

            if ($accessLogId) {
                $targetLog = AccessLog::withoutGlobalScopes()
                    ->where('estate_id', $estate->id)
                    ->where('id', $accessLogId)
                    ->first();
            }

            $isQuickEntry = ($targetLog && ($targetLog->meta['entry_type'] ?? null) === 'quick_entry')
                || ($targetLog && empty($targetLog->access_code_id))
                || (! AccessCode::query()->forEstate($estate->id)->where('code', $code)->exists() && ! str_starts_with($code, 'kontrol://pass/'));

            if ($isQuickEntry) {
                $tag = $targetLog->meta['tag'] ?? $code;
                app(CheckoutQuickEntryAction::class)->execute(
                    tag: $tag,
                    estateId: $estate->id,
                    verifiedBy: $user
                );
            } else {
                app(RecordCheckOutAction::class)->execute(
                    code: $code,
                    estateId: $estate->id,
                    verifiedBy: $user
                );
            }
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Decision recorded successfully.');
    }

    /**
     * Download active pass hashes for offline verification.
     * HEAD requests are used as a lightweight connectivity ping.
     */
    public function syncData(Request $request): JsonResponse
    {
        if ($request->isMethod('HEAD')) {
            return response()->json(['success' => true]);
        }

        try {
            $user = $request->user();
            $estate = app(EstateContextService::class)->getEstate();

            $activeCodes = AccessCode::query()
                ->forEstate($estate->id)
                ->active()
                ->with('user:id,name')
                ->withCount('accessLogs')
                ->get();

            $cachedCodes = $activeCodes->map(function (AccessCode $code) {
                return [
                    'hash' => hash('sha256', strtoupper(trim($code->code))),
                    'visitor_name' => $code->visitor_name ?? 'Guest',
                    'host_name' => $code->user?->name ?? 'Resident',
                    'expires_at' => $code->expires_at?->toIso8601String(),
                    'has_vehicle' => (bool) $code->has_vehicle,
                    'purpose' => $code->purpose,
                    'code_type' => $code->type,
                    'guest_limit' => $code->guest_limit,
                    'uses_count' => $code->access_logs_count ?? 0,
                    'starts_at' => $code->starts_at?->toIso8601String(),
                ];
            });

            $organizations = $estate->organizations()
                ->quickEntryEnabled()
                ->select(['id', 'name', 'type', 'access_policy'])
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'synced_count' => 0,
                'codes' => $cachedCodes,
                'organizations' => $organizations,
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'synced_count' => 0,
                'codes' => [],
                'error' => 'Unable to refresh offline pass cache.',
                'code' => 'SYNC_DATA_FAILED',
                'retryable' => true,
            ], 500);
        }
    }

    /**
     * Replay offline admission logs. Partial failures return partial success.
     */
    public function syncLogs(Request $request): JsonResponse
    {
        $request->validate([
            'logs' => 'required|array',
            'logs.*.code' => 'required|string',
            'logs.*.decision' => 'required|in:admit,reject',
            'logs.*.vehicle_make' => 'nullable|string',
            'logs.*.vehicle_model' => 'nullable|string',
            'logs.*.vehicle_plate_number' => 'nullable|string',
            'logs.*.created_at' => 'required|string',
        ]);

        $user = $request->user();
        $estate = app(EstateContextService::class)->getEstate();
        $syncedCount = 0;
        $failedCount = 0;
        $errors = [];

        foreach ($request->input('logs') as $index => $logData) {
            try {
                $code = $logData['code'];
                $decision = $logData['decision'];
                $timestamp = CarbonImmutable::parse($logData['created_at']);

                if ($decision === 'admit') {
                    $accessCode = AccessCode::query()
                        ->forEstate($estate->id)
                        ->where('code', $code)
                        ->first();

                    if ($accessCode && $accessCode->status === AccessCodeStatus::Active) {
                        app(RecordCheckInAction::class)->execute(
                            code: $code,
                            estateId: $estate->id,
                            verifiedBy: $user,
                            vehicleData: [
                                'vehicle_make' => $logData['vehicle_make'] ?? null,
                                'vehicle_model' => $logData['vehicle_model'] ?? null,
                                'vehicle_plate_number' => $logData['vehicle_plate_number'] ?? null,
                            ],
                            verificationMethod: 'offline_sync',
                            verifiedAt: $timestamp
                        );
                    } else {
                        AccessLog::create([
                            'estate_id' => $estate->id,
                            'access_code_id' => $accessCode?->id,
                            'verified_by' => $user->id,
                            'verified_at' => $timestamp,
                            'vehicle_make' => $logData['vehicle_make'] ?? null,
                            'vehicle_model' => $logData['vehicle_model'] ?? null,
                            'vehicle_plate_number' => $logData['vehicle_plate_number'] ?? null,
                            'meta' => [
                                'visitor_name' => $accessCode?->visitor_name ?? 'Unknown (Offline Override)',
                                'host_id' => $accessCode?->user_id,
                                'offline_code' => $code,
                                'offline_override' => true,
                                'sync_status' => $accessCode ? 'code_exists_but_'.$accessCode->status->value : 'code_not_found',
                            ],
                        ]);
                    }
                }

                if ($decision === 'reject') {
                    activity()
                        ->causedBy($user)
                        ->withProperties([
                            'estate_id' => $estate->id,
                            'code' => $code,
                            'decision' => 'reject',
                            'offline_sync' => true,
                            'created_at' => $timestamp->toIso8601String(),
                        ])
                        ->log('Security guard rejected entry offline');
                }

                $syncedCount++;
            } catch (Throwable $e) {
                report($e);
                $failedCount++;
                $errors[] = [
                    'index' => $index,
                    'code' => $logData['code'] ?? null,
                    'error' => 'Failed to sync log entry.',
                    'retryable' => true,
                ];
            }
        }

        activity()
            ->causedBy($user)
            ->withProperties([
                'estate_id' => $estate->id,
                'synced_count' => $syncedCount,
                'failed_count' => $failedCount,
                'total' => count($request->input('logs', [])),
            ])
            ->log('Offline security logs replayed');

        $success = $failedCount === 0;

        return response()->json([
            'success' => $success,
            'synced_count' => $syncedCount,
            'failed_count' => $failedCount,
            'errors' => $errors,
            'error' => $success ? null : 'Some offline logs could not be synced.',
            'code' => $success ? null : 'SYNC_PARTIAL_FAILURE',
            'retryable' => $failedCount > 0,
        ], $success ? 200 : 207);
    }
}
