<?php

namespace App\Http\Controllers\Security;

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
    ) {}

    public function __invoke(): Response
    {
        $user = auth()->user();
        $estate = $user->getCurrentEstate();

        return Inertia::render('Security/Verify', [
            'estateName' => $estate->name,
            'gateName' => 'Main Entrance',
        ]);
    }

    public function validate(ValidateAccessCodeRequest $request): RedirectResponse
    {
        $user = auth()->user();
        $estate = $user->getCurrentEstate();

        $result = $this->validateAccessCodeAction->execute(
            code: $request->validated('code'),
            estateId: $estate->id,
            verifiedBy: $user,
        );

        if ($result['valid']) {
            return back()->with([
                'success' => "Access Granted: {$result['visitor_name']} admitted successfully.",
                'validation_result' => $result,
            ]);
        }

        return back()->with('validation_result', $result);
    }

    public function decision(Request $request): RedirectResponse
    {
        $request->validate([
            'decision' => 'required|in:admit,reject',
            'code' => 'required|string',
            'reason' => 'nullable|string|max:500',
        ]);

        $user = auth()->user();
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

        return back();
    }
}
