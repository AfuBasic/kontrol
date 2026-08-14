<?php

namespace App\Http\Controllers\Zeus;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\CouponLog;
use App\Models\Estate;
use App\Models\Plan;
use App\Models\User;
use App\Notifications\Resident\CouponIssuedNotification;
use App\Services\ZoneAudienceResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
                $query->where('status', 'active')->withinValidityPeriod();
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
                'usage_limit' => $coupon->totalUsageLimit(),
                'used_count' => $coupon->logs()->count(),
            ]);

        // Calculate aggregates/stats
        $totalCoupons = Coupon::count();
        $now = now();
        $activeCoupons = Coupon::where('status', 'active')
            ->withinValidityPeriod()
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
        $estates = Estate::query()
            ->with(['zones' => fn ($q) => $q->orderBy('name')->select('id', 'estate_id', 'name')])
            ->orderBy('name')
            ->get(['id', 'name']);

        $residents = User::whereHas('roles', function ($query) {
            $query->where('name', 'resident');
        })->orderBy('name')->limit(20)->get(['id', 'name', 'email']);

        $plans = Plan::orderBy('price')->get(['id', 'name', 'price', 'billing_interval']);

        return Inertia::render('Zeus/Coupons/Create', [
            'estates' => $estates,
            'residents' => $residents,
            'plans' => $plans,
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
        $totalRedemptions = CouponLog::where('coupon_id', $coupon->id)->count();
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
                'formatted_value' => $coupon->type === 'percentage' ? "{$coupon->value}%" : '₦'.number_format($coupon->value / 100),
                'min_purchase' => $coupon->min_purchase,
                'formatted_min_purchase' => $coupon->min_purchase ? '₦'.number_format($coupon->min_purchase / 100) : null,
                'expires_at' => $coupon->expires_at?->toDateString(),
                'starts_at' => $coupon->starts_at?->toDateString(),
                'usage_limit' => $coupon->totalUsageLimit(),
                'used_count' => $totalRedemptions,
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
        if ($request->has('user_id') && ! $request->has('user_ids')) {
            $request->merge([
                'user_ids' => [$request->user_id],
            ]);
        }

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
            'zone_id' => [
                'nullable',
                'integer',
                Rule::exists('zones', 'id')->where(fn ($q) => $q->where('estate_id', $request->integer('estate_id'))),
            ],
            'user_ids' => ['required_if:scope,resident', 'nullable', 'array'],
            'user_ids.*' => ['exists:users,id'],
            'eligible_plans' => ['nullable', 'array'],
            'eligible_plans.*' => ['exists:plans,id'],
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
        if (in_array($validated['scope'], ['estate', 'resident']) && is_null($usageLimit)) {
            $usageLimit = 1;
        }

        $eligiblePlans = $validated['eligible_plans'] ?? null;

        if ($validated['scope'] === 'resident' && ! empty($validated['user_ids'])) {
            $userIds = $validated['user_ids'];
            $isMultiple = count($userIds) > 1;

            foreach ($userIds as $userId) {
                $code = $isMultiple ? ($validated['code'].'-'.$userId) : $validated['code'];

                // If multiple user coupons, ensure absolute uniqueness
                if ($isMultiple) {
                    $suffix = 1;
                    while (Coupon::where('code', $code)->exists()) {
                        $code = $validated['code'].'-'.$userId.'-'.$suffix;
                        $suffix++;
                    }
                }

                $coupon = Coupon::create([
                    'campaign_name' => $validated['campaign_name'],
                    'description' => $validated['description'] ?? null,
                    'code' => $code,
                    'type' => $validated['type'],
                    'value' => $value,
                    'estate_id' => null,
                    'user_id' => $userId,
                    'eligible_plans' => $eligiblePlans,
                    'expires_at' => $validated['expires_at'] ?? null,
                    'usage_limit' => $usageLimit,
                    'creator_id' => auth()->id(),
                    'status' => 'active',
                ]);

                $residentUser = User::find($userId);
                if ($residentUser) {
                    $residentUser->notify(new CouponIssuedNotification($coupon));
                }
            }
        } else {
            $coupon = Coupon::create([
                'campaign_name' => $validated['campaign_name'],
                'description' => $validated['description'] ?? null,
                'code' => $validated['code'],
                'type' => $validated['type'],
                'value' => $value,
                'estate_id' => $validated['scope'] === 'estate' ? ($validated['estate_id'] ?? null) : null,
                'zone_id' => $validated['scope'] === 'estate' ? ($validated['zone_id'] ?? null) : null,
                'user_id' => null,
                'eligible_plans' => $eligiblePlans,
                'expires_at' => $validated['expires_at'] ?? null,
                'usage_limit' => $usageLimit,
                'creator_id' => auth()->id(),
                'status' => 'active',
            ]);

            if ($validated['scope'] === 'estate' && $coupon->estate_id) {
                $estateResidents = User::whereHas('estates', function ($q) use ($coupon) {
                    $q->where('estates.id', $coupon->estate_id);
                })->whereHas('roles', function ($q) {
                    $q->where('name', 'resident');
                })->when($coupon->zone_id, function ($q) use ($coupon) {
                    $zoneUserIds = app(ZoneAudienceResolver::class)->userIdsInZones((int) $coupon->estate_id, [(int) $coupon->zone_id], false);
                    $q->whereIn('id', $zoneUserIds);
                })->get();

                foreach ($estateResidents as $residentUser) {
                    $residentUser->notify(new CouponIssuedNotification($coupon));
                }
            }
        }

        return redirect()->route('zeus.coupons.index')->with('success', 'Coupon created successfully.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $coupon->delete();

        return redirect()->route('zeus.coupons.index')->with('success', 'Coupon deleted successfully.');
    }
}
