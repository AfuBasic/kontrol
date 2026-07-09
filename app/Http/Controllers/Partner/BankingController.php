<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use App\Services\Banking\BankNameMatcher;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class BankingController extends Controller
{
    public function __construct(
        private PaystackService $paystackService,
        private BankNameMatcher $bankNameMatcher,
    ) {}

    /**
     * Resolve account number and check name match against partner identity.
     */
    public function resolve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_number' => ['required', 'string', 'digits:10'],
            'bank_code' => ['required', 'string'],
        ]);

        $partner = $request->user()->partner;

        if (! $partner) {
            return response()->json([
                'success' => false,
                'message' => 'No partner organization is linked to this account.',
            ], 403);
        }

        try {
            $resolution = $this->paystackService->resolveAccountNumber(
                $validated['account_number'],
                $validated['bank_code']
            );

            $accountName = $resolution['account_name'] ?? null;

            if (! $accountName) {
                return response()->json([
                    'success' => false,
                    'message' => 'Could not verify account name. Please check the details.',
                ], 422);
            }

            $match = $this->bankNameMatcher->match(
                $this->expectedNames($partner, $request->user()->name),
                $accountName
            );

            return response()->json([
                'success' => true,
                'account_name' => $accountName,
                'match' => $match,
            ]);
        } catch (\Exception $e) {
            Log::warning('Partner bank resolve failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Could not verify account. Please try again.',
            ], 422);
        }
    }

    /**
     * Save verified payout bank details for the partner organization.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bank_code' => ['required', 'string'],
            'bank_name' => ['required', 'string', 'max:255'],
            'account_number' => ['required', 'string', 'digits:10'],
        ]);

        $partner = $request->user()->partner;

        if (! $partner) {
            return back()->withErrors(['message' => 'No partner organization is linked to this account.']);
        }

        try {
            $resolution = $this->paystackService->resolveAccountNumber(
                $validated['account_number'],
                $validated['bank_code']
            );

            $accountName = $resolution['account_name'] ?? null;

            if (! $accountName) {
                throw ValidationException::withMessages([
                    'account_number' => 'Could not verify account name. Please check the details.',
                ]);
            }

            $match = $this->bankNameMatcher->match(
                $this->expectedNames($partner, $request->user()->name),
                $accountName
            );

            if (! $match['accepted']) {
                throw ValidationException::withMessages([
                    'account_number' => 'The account name ('.$accountName.') does not match your partner or contact name closely enough. Use an account registered in your business or contact name.',
                ]);
            }

            $partner->update([
                'bank_name' => $validated['bank_name'],
                'bank_code' => $validated['bank_code'],
                'account_number' => $validated['account_number'],
                'account_name' => $accountName,
                'account_verified_at' => now(),
            ]);

            return back()->with('success', 'Payout bank account updated successfully.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Partner banking update failed', ['error' => $e->getMessage()]);

            return back()->withErrors(['message' => 'Could not save bank details. Please try again.']);
        }
    }

    /**
     * @return list<string>
     */
    private function expectedNames(Partner $partner, ?string $memberName): array
    {
        return array_values(array_filter([
            $partner->name,
            $partner->contact_person,
            $memberName,
        ], fn (?string $name) => filled($name)));
    }
}
