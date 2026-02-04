<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\ValidateAccessCodeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Security\ValidateAccessCodeRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(
        protected ValidateAccessCodeAction $validateAccessCodeAction,
    ) {}

    public function __invoke(): Response
    {
        $user = auth()->user();
        $estate = $user->getCurrentEstate();

        return Inertia::render('security/home', [
            'estateName' => $estate->name,
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

        return redirect()->back()->with('validation_result', $result);
    }
}
