<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\RecordCheckInAction;
use App\Actions\Security\RecordCheckOutAction;
use App\Actions\Security\ValidateAccessCodeAction;
use App\Enums\AccessCodeStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Security\ValidateAccessCodeRequest;
use App\Models\AccessCode;
use App\Models\AccessLog;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class VerifyController extends Controller
{
    public function __construct(
        protected ValidateAccessCodeAction $validateAccessCodeAction,
        protected RecordCheckInAction $recordCheckInAction,
        protected RecordCheckOutAction $recordCheckOutAction,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $estate = $user->getCurrentEstate();
        $settings = \App\Models\EstateSettings::forEstate($estate->id);

        return Inertia::render('Security/Verify', [
            'estateName' => $estate->name,
            'gateName' => 'Main Entrance',
            'accessCodesEnabled' => (bool) $settings->access_codes_enabled,
            'visitorCheckoutEnabled' => (bool) $settings->visitor_checkout_enabled,
            'requireVehicleInformation' => (bool) $settings->require_vehicle_information,
        ]);
    }

    public function validate(ValidateAccessCodeRequest $request): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        $estate = $user->getCurrentEstate();

        $result = $this->validateAccessCodeAction->execute(
            code: $request->validated('code'),
            estateId: $estate->id,
        );

        if ($result['valid']) {
            if (isset($result['action']) && $result['action'] === 'checkout') {
                $log = $this->recordCheckOutAction->execute(
                    code: $request->validated('code'),
                    estateId: $estate->id,
                    verifiedBy: $user
                );

                $result['access_log_id'] = $log->id;
                $result['checked_out_at'] = $log->checked_out_at?->toIso8601String();
                $result['duration_minutes'] = $log->checked_out_at ? (int) $log->checked_out_at->diffInMinutes($log->verified_at) : 0;
            } elseif (isset($result['action']) && $result['action'] === 'checkout_pending') {
                // Do not auto check-in when checkout is pending
            } else {
                // Check in immediately upon successful validation
                $log = $this->recordCheckInAction->execute(
                    code: $request->validated('code'),
                    estateId: $estate->id,
                    verifiedBy: $user,
                    vehicleData: [],
                    verificationMethod: $request->validated('source')
                );

                $result['access_log_id'] = $log->id;
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
        $estate = $user->getCurrentEstate();

        activity()
            ->causedBy($user)
            ->withProperties([
                'estate_id' => $estate->id,
                'code' => $request->input('code'),
                'decision' => $request->input('decision'),
                'reason' => $request->input('reason'),
            ])
            ->log('Security guard recorded entry decision');

        if ($request->input('decision') === 'admit') {
            if ($request->filled('access_log_id')) {
                AccessLog::where('id', $request->input('access_log_id'))->update([
                    'vehicle_make' => $request->input('vehicle_make'),
                    'vehicle_model' => $request->input('vehicle_model'),
                    'vehicle_plate_number' => $request->input('vehicle_plate_number'),
                ]);
            } else {
                $this->recordCheckInAction->execute(
                    code: $request->input('code'),
                    estateId: $estate->id,
                    verifiedBy: $user,
                    vehicleData: $request->only(['vehicle_make', 'vehicle_model', 'vehicle_plate_number'])
                );
            }
        }

        if ($request->input('decision') === 'checkout') {
            $this->recordCheckOutAction->execute(
                code: $request->input('code'),
                estateId: $estate->id,
                verifiedBy: $user
            );
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
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
            $estate = $user->getCurrentEstate();

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

            return response()->json([
                'success' => true,
                'synced_count' => 0,
                'codes' => $cachedCodes,
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
        $estate = $user->getCurrentEstate();
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
                        $this->recordCheckInAction->execute(
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
