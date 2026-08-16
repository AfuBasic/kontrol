<?php

namespace App\Http\Controllers\Admin;

use App\Auth\ContextManager;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProfileRequest;
use App\Models\AdministrativeAssignment;
use App\Models\Estate;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        protected PaystackService $paystackService
    ) {}

    public function edit(Request $request): Response
    {
        $user = $request->user();
        $context = app(ContextManager::class)->current();
        $estate = $context ? Estate::query()->find($context->estateId) : null;
        $assignment = ($context && $context->assignmentId > 0)
            ? AdministrativeAssignment::query()->with(['role', 'zone'])->find($context->assignmentId)
            : null;

        $canSwitchEstate = AdministrativeAssignment::query()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->count() > 1;

        $roleLabel = $this->formatRoleLabel($assignment?->role?->name);

        return Inertia::render('Admin/Profile/Index', [
            'user' => $user->only(['name', 'email']),
            'account' => [
                'name' => $user->name,
                'email' => $user->email,
                'role_label' => $roleLabel,
            ],
            'estate_context' => $estate ? [
                'name' => $estate->name,
                'access_label' => $roleLabel,
                'scope_label' => $this->formatScopeLabel($context?->isZoneScoped() ?? false, $assignment?->zone?->name),
                'can_switch' => $canSwitchEstate,
            ] : null,
        ]);
    }

    public function resolveBank(Request $request): JsonResponse
    {
        $request->validate([
            'account_number' => 'required|string|size:10',
            'bank_code' => 'required|string',
        ]);

        try {
            $data = $this->paystackService->resolveAccountNumber(
                $request->account_number,
                $request->bank_code
            );

            return response()->json([
                'success' => true,
                'account_name' => $data['account_name'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not resolve account: '.$e->getMessage(),
            ], 422);
        }
    }

    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = $request->user();
        $user->name = $validated['name'];

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return back()->with('success', 'Profile updated successfully.');
    }

    private function formatRoleLabel(?string $roleName): string
    {
        if (! filled($roleName)) {
            return 'Administrator';
        }

        return match ($roleName) {
            'admin' => 'Administrator',
            'property_owner' => 'Property Owner',
            default => Str::title(str_replace('_', ' ', $roleName)),
        };
    }

    private function formatScopeLabel(bool $isZoneScoped, ?string $zoneName): string
    {
        if ($isZoneScoped) {
            return filled($zoneName) ? 'Zone · '.$zoneName : 'Zone-scoped';
        }

        return 'Estate-wide';
    }
}
