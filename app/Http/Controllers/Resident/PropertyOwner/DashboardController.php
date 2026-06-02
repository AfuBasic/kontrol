<?php

namespace App\Http\Controllers\Resident\PropertyOwner;

use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use App\Models\CollectionAssignment;
use App\Models\EstateBoardPost;
use App\Models\Payment;
use App\Models\Property;
use App\Models\User;
use App\Services\EstateContextService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    public function __invoke(): Response
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        // 1. Managed Residents
        $residentsCount = User::query()
            ->whereHas('profile', fn ($q) => $q->where('property_owner_id', $user->id))
            ->forEstate($estate->id)
            ->count();

        // 2. Outstanding Collections Count
        $outstandingCollectionsCount = CollectionAssignment::query()
            ->where('estate_id', $estate->id)
            ->whereIn('status', ['pending', 'overdue', 'grace', 'partial'])
            ->whereHas('collection', fn ($q) => $q->where('created_by', $user->id))
            ->whereHas('user.profile', fn ($q) => $q->where('property_owner_id', $user->id))
            ->count();

        // 3. Properties Count
        $propertiesCount = Property::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->whereNull('archived_at')
            ->count();

        // 4. Announcements Count
        $announcementsCount = EstateBoardPost::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->count();

        // 5. Recent Payments
        $recentPayments = Payment::query()
            ->where('estate_id', $estate->id)
            ->whereHas('assignment.collection', fn ($q) => $q->where('created_by', $user->id))
            ->whereHas('assignment.user.profile', fn ($q) => $q->where('property_owner_id', $user->id))
            ->with(['assignment.user', 'assignment.collection'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'resident_name' => $p->assignment->user->name,
                'collection_name' => $p->assignment->collection->name,
                'amount' => $p->amount,
                'status' => $p->status,
                'date' => $p->created_at->format('M d, Y'),
            ]);

        // 6. Recent Announcements
        $recentAnnouncements = EstateBoardPost::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'status' => $p->status->value,
                'published_at' => $p->published_at?->format('M d, Y'),
                'created_at' => $p->created_at->format('M d, Y'),
            ]);

        // 7. Recent Activity (visitor logs of managed residents)
        $recentActivity = AccessLog::query()
            ->whereHas('accessCode', function ($q) use ($user) {
                $q->whereHas('user.profile', fn ($qp) => $qp->where('property_owner_id', $user->id));
            })
            ->with(['accessCode.user'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'resident_name' => $log->accessCode->user->name,
                'visitor_name' => $log->accessCode->visitor_name,
                'purpose' => $log->accessCode->purpose,
                'action' => $log->action,
                'date' => $log->created_at->format('M d, Y H:i'),
            ]);

        return Inertia::render('Resident/PropertyOwner/Dashboard', [
            'residentsCount' => $residentsCount,
            'outstandingCollectionsCount' => $outstandingCollectionsCount,
            'propertiesCount' => $propertiesCount,
            'announcementsCount' => $announcementsCount,
            'recentPayments' => $recentPayments,
            'recentAnnouncements' => $recentAnnouncements,
            'recentActivity' => $recentActivity,
        ]);
    }
}
