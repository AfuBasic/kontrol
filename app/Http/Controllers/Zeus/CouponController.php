<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(): Response
    {
        $coupons = Coupon::with(['estate:id,name', 'user:id,name,email'])
            ->latest()
            ->paginate(15)
            ->through(fn (Coupon $coupon) => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'estate' => $coupon->estate ? ['id' => $coupon->estate->id, 'name' => $coupon->estate->name] : null,
                'user' => $coupon->user ? ['id' => $coupon->user->id, 'name' => $coupon->user->name, 'email' => $coupon->user->email] : null,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'formatted_value' => $coupon->type === 'percentage' ? "{$coupon->value}%" : '₦'.number_format($coupon->value / 100, 2),
                'expires_at' => $coupon->expires_at?->toDateString(),
                'usage_limit' => $coupon->usage_limit,
                'used_count' => $coupon->used_count,
            ]);

        return Inertia::render('Zeus/Coupons/Index', [
            'coupons' => $coupons,
        ]);
    }

    public function create(): Response
    {
        $estates = Estate::orderBy('name')->get(['id', 'name']);

        $residents = User::whereHas('roles', function ($query) {
            $query->where('name', 'resident');
        })->orderBy('name')->get(['id', 'name', 'email']);

        return Inertia::render('Zeus/Coupons/Create', [
            'estates' => $estates,
            'residents' => $residents,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'code' => strtoupper(trim($request->code)),
        ]);

        $rules = [
            'code' => ['required', 'string', 'unique:coupons,code'],
            'type' => ['required', 'string', 'in:percentage,fixed'],
            'value' => ['required', 'numeric', 'min:1'],
            'scope' => ['required', 'string', 'in:global,estate,resident'],
            'estate_id' => ['required_if:scope,estate', 'nullable', 'exists:estates,id'],
            'user_id' => ['required_if:scope,resident', 'nullable', 'exists:users,id'],
            'expires_at' => ['nullable', 'date', 'after:today'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
        ];

        if ($request->type === 'percentage') {
            $rules['value'][] = 'max:100';
        }

        $validated = $request->validate($rules);

        // Convert value to kobo if fixed type
        $value = (int) $validated['value'];
        if ($validated['type'] === 'fixed') {
            $value = $value * 100;
        }

        Coupon::create([
            'code' => $validated['code'],
            'type' => $validated['type'],
            'value' => $value,
            'estate_id' => $validated['scope'] === 'estate' ? ($validated['estate_id'] ?? null) : null,
            'user_id' => $validated['scope'] === 'resident' ? ($validated['user_id'] ?? null) : null,
            'expires_at' => $validated['expires_at'] ?? null,
            'usage_limit' => $validated['usage_limit'] ?? null,
        ]);

        return redirect()->route('zeus.coupons.index')->with('success', 'Coupon created successfully.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $coupon->delete();

        return redirect()->route('zeus.coupons.index')->with('success', 'Coupon deleted successfully.');
    }
}
