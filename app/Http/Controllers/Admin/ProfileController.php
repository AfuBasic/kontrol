<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        protected PaystackService $paystackService
    ) {}

    public function edit(Request $request): Response
    {
        return Inertia::render('Admin/Profile/Index', [
            'user' => $request->user()->only(['name', 'email']),
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

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();
        $user->name = $validated['name'];

        if (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return back()->with('success', 'Profile updated successfully.');
    }
}
