<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\CouponLog;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Coupon::with(['estate:id,name', 'user:id,name,email']);

        // Search code/campaign
        if ($request->filled('q')) {
            $searchTerm = $request->q;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('code', 'like', "%{$searchTerm}%")
                    ->orWhere('campaign_name', 'like', "%{$searchTerm}%");
            });
        }

        // Filter type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter target scope
        if ($request->filled('scope')) {
            if ($request->scope === 'global') {
                $query->whereNull('estate_id')->whereNull('user_id');
            } elseif ($request->scope === 'estate') {
                $query->whereNotNull('estate_id');
            } elseif ($request->scope === 'resident') {
                $query->whereNotNull('user_id');
            }
        }

        // Filter status
        if ($request->filled('status')) {
            $now = now();
            if ($request->status === 'active') {
                $query->where('status', 'active')
                    ->where(function ($q) use ($now) {
                        $q->whereNull('expires_at')->orWhere('expires_at', '>', $now);
                    })
                    ->where(function ($q) use ($now) {
                        $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
                    });
            } elseif ($request->status === 'expired') {
                $query->where('expires_at', '<=', $now);
            } elseif ($request->status === 'paused') {
                $query->where('status', 'paused');
            } elseif ($request->status === 'scheduled') {
                $query->where('starts_at', '>', $now);
            }
        }

        $coupons = $query->latest()
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Coupon $coupon) => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'campaign_name' => $coupon->campaign_name,
                'marketing_tag' => $coupon->marketing_tag,
                'description' => $coupon->description,
                'estate' => $coupon->estate ? ['id' => $coupon->estate->id, 'name' => $coupon->estate->name] : null,
                'user' => $coupon->user ? ['id' => $coupon->user->id, 'name' => $coupon->user->name, 'email' => $coupon->user->email] : null,
                'status' => $coupon->status,
                'raw_status' => $coupon->status,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'formatted_value' => $coupon->type === 'percentage' ? "{$coupon->value}%" : '₦'.number_format($coupon->value / 100, 2),
                'expires_at' => $coupon->expires_at?->toDateString(),
                'starts_at' => $coupon->starts_at?->toDateString(),
                'usage_limit' => $coupon->usage_limit,
                'used_count' => $coupon->used_count,
            ]);

        // Calculate aggregates/stats
        $totalCoupons = Coupon::count();
        $now = now();
        $activeCoupons = Coupon::where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
            })
            ->count();

        $totalRedemptions = (int) Coupon::sum('used_count');
        $totalSavingsKobo = (int) CouponLog::sum('discount_amount');
        $totalSavings = '₦'.number_format($totalSavingsKobo / 100, 2);

        return Inertia::render('Zeus/Coupons/Index', [
            'coupons' => $coupons,
            'stats' => [
                'total_coupons' => $totalCoupons,
                'active_coupons' => $activeCoupons,
                'total_redemptions' => $totalRedemptions,
                'total_savings' => $totalSavings,
            ],
            'filters' => $request->only(['q', 'type', 'scope', 'status']),
        ]);
    }

    public function create(): Response
    {
        $estates = Estate::orderBy('name')->get(['id', 'name']);

        $residents = User::whereHas('roles', function ($query) {
            $query->where('name', 'resident');
        })->orderBy('name')->limit(20)->get(['id', 'name', 'email']);

        return Inertia::render('Zeus/Coupons/Create', [
            'estates' => $estates,
            'residents' => $residents,
        ]);
    }

    /**
     * Search residents dynamically for asynchronous select modals.
     */
    public function searchResidents(Request $request): JsonResponse
    {
        $query = $request->input('q');

        if (empty($query)) {
            $residents = User::whereHas('roles', function ($q) {
                $q->where('name', 'resident');
            })->orderBy('name')->limit(20)->get(['id', 'name', 'email']);

            return response()->json($residents);
        }

        $residents = User::whereHas('roles', function ($q) {
            $q->where('name', 'resident');
        })
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            })
            ->orderBy('name')
            ->limit(30)
            ->get(['id', 'name', 'email']);

        return response()->json($residents);
    }

    /**
     * Display the coupon detailed analytics, statistics, and audit activity timeline.
     */
    public function show(Coupon $coupon): Response
    {
        $coupon->load(['estate:id,name', 'user:id,name,email', 'creator:id,name,email']);

        // Load logs with user & invoice information
        $logs = CouponLog::where('coupon_id', $coupon->id)
            ->with(['user:id,name,email', 'invoice:id,amount,created_at'])
            ->latest()
            ->paginate(10);

        // Specific metrics
        $totalRedemptions = $coupon->used_count;
        $totalSavingsKobo = CouponLog::where('coupon_id', $coupon->id)->sum('discount_amount');
        $totalSavings = '₦'.number_format($totalSavingsKobo / 100, 2);

        // Determine actual status
        $status = $coupon->status;
        if ($coupon->isExpired()) {
            $status = 'expired';
        } elseif ($coupon->isScheduled()) {
            $status = 'scheduled';
        }

        return Inertia::render('Zeus/Coupons/Show', [
            'coupon' => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'description' => $coupon->description,
                'internal_notes' => $coupon->internal_notes,
                'campaign_name' => $coupon->campaign_name,
                'marketing_tag' => $coupon->marketing_tag,
                'estate' => $coupon->estate,
                'user' => $coupon->user,
                'creator' => $coupon->creator,
                'status' => $status,
                'raw_status' => $coupon->status,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'formatted_value' => $coupon->type === 'percentage' ? "{$coupon->value}%" : '₦'.number_format($coupon->value / 100, 2),
                'min_purchase' => $coupon->min_purchase,
                'formatted_min_purchase' => $coupon->min_purchase ? '₦'.number_format($coupon->min_purchase / 100, 2) : null,
                'expires_at' => $coupon->expires_at?->toDateString(),
                'starts_at' => $coupon->starts_at?->toDateString(),
                'usage_limit' => $coupon->usage_limit,
                'used_count' => $coupon->used_count,
                'created_at' => $coupon->created_at?->toDateString(),
            ],
            'logs' => $logs,
            'stats' => [
                'total_redemptions' => $totalRedemptions,
                'total_savings' => $totalSavings,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'code' => strtoupper(trim($request->code)),
        ]);

        $rules = [
            'campaign_name' => ['required', 'string', 'min:3'],
            'description' => ['nullable', 'string'],
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

        $usageLimit = $validated['usage_limit'] ?? null;
        if ($validated['scope'] === 'estate' && is_null($usageLimit) && ! empty($validated['estate_id'])) {
            $estate = Estate::find($validated['estate_id']);
            if ($estate) {
                $usageLimit = $estate->users()->whereHas('roles', function ($q) {
                    $q->where('name', 'resident');
                })->count();
            }
        } elseif ($validated['scope'] === 'resident' && is_null($usageLimit)) {
            $usageLimit = 1;
        }

        Coupon::create([
            'campaign_name' => $validated['campaign_name'],
            'description' => $validated['description'] ?? null,
            'code' => $validated['code'],
            'type' => $validated['type'],
            'value' => $value,
            'estate_id' => $validated['scope'] === 'estate' ? ($validated['estate_id'] ?? null) : null,
            'user_id' => $validated['scope'] === 'resident' ? ($validated['user_id'] ?? null) : null,
            'expires_at' => $validated['expires_at'] ?? null,
            'usage_limit' => $usageLimit,
            'creator_id' => auth()->id(),
            'status' => 'active',
        ]);

        return redirect()->route('zeus.coupons.index')->with('success', 'Coupon created successfully.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $coupon->delete();

        return redirect()->route('zeus.coupons.index')->with('success', 'Coupon deleted successfully.');
    }
}
