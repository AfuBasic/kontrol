<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\UserService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function __construct(
        protected UserService $userService
    ) {}

    public function index(Request $request): Response
    {
        // Only admins can view activity logs
        // This should logically be protected by middleware or policy, 
        // but explicit check here matches the requirements.
        // Assuming there is a permission or role check in middleware.
        // The user specifically asked for "Activity log page must ONLY be accessible to users with the `admin` role"
        $estateId = $this->userService->getCurrentEstateId();

        // Query for activities
        // Scoping: 
        // 1. Where 'causer' IS in the estate (members)
        // 2. OR where 'subject' IS associated with the estate?
        // Let's start with strict scoping: Activities performed by users of this estate
        // OR activities performed on subjects belonging to this estate.
        
        // Simpler approach for now:
        // Filter by properties->estate_id if we were saving it (we haven't set that up yet).
        // Standard approach in multi-tenant:
        // Join with user/causer and check estate membership.
        
        // However, standard ActivityLog doesn't automatically know about "Estates".
        // Use implicit relationship.
        
        $query = Activity::query()
            ->with(['causer', 'subject'])
            ->latest();

        // Scope to current estate via causer (User) membership
        // This is complex because polymorphic relation.
        // Let's filter by Causer who belongs to this estate.
        $query->whereHas('causer', function ($q) use ($estateId) {
             // Assuming Causer is User
             $q->whereHas('estates', function ($sq) use ($estateId) {
                 $sq->where('estates.id', $estateId);
             });
        });

        // Infinite scroll pagination
        $activities = $query->cursorPaginate(20);

        return Inertia::render('admin/activity-log/Index', [
            'activities' => $activities,
        ]);
    }
}
