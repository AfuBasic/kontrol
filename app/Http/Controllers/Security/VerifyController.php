<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\RecordCheckInAction;
use App\Actions\Security\ValidateAccessCodeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Security\ValidateAccessCodeRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerifyController extends Controller
{
    public function __construct(
        protected ValidateAccessCodeAction $validateAccessCodeAction,
        protected RecordCheckInAction $recordCheckInAction,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $estate = $user->getCurrentEstate();

        return Inertia::render('Security/Verify', [
            'estateName' => $estate->name,
            'gateName' => 'Main Entrance',
        ]);
    }

    public function validate(ValidateAccessCodeRequest $request): RedirectResponse
    {
        $user = $request->user();
        $estate = $user->getCurrentEstate();

        $result = $this->validateAccessCodeAction->execute(
            code: $request->validated('code'),
            estateId: $estate->id,
        );

        if ($result['valid']) {
            // Check in immediately upon successful validation
            $log = $this->recordCheckInAction->execute(
                code: $request->validated('code'),
                estateId: $estate->id,
                verifiedBy: $user,
                vehicleData: []
            );

            $result['access_log_id'] = $log->id;

            return back()->with([
                'success' => "Code Verified: Found access code for {$result['visitor_name']}.",
                'validation_result' => $result,
            ]);
        }

        return back()->with('validation_result', $result);
    }

    public function decision(Request $request): RedirectResponse
    {
        $request->validate([
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
                \App\Models\AccessLog::where('id', $request->input('access_log_id'))->update([
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

        return back();
    }
}
