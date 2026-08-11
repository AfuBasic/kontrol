<?php

namespace App\Http\Controllers\Resident\PropertyOwner;

use App\Enums\EstateBoardPostAudience;
use App\Enums\EstateBoardPostStatus;
use App\Http\Controllers\Controller;
use App\Models\EstateBoardPost;
use App\Models\EstateBoardPostTarget;
use App\Models\Property;
use App\Models\User;
use App\Notifications\EstateBoard\NewPostNotification;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function __construct(
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display a listing of announcements created by this Property Owner.
     */
    public function index(Request $request): Response
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        $totalBroadcasts = EstateBoardPost::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->count();

        $thisMonthBroadcasts = EstateBoardPost::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $lastBroadcast = EstateBoardPost::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->latest()
            ->first();

        $lastBroadcastDate = $lastBroadcast ? $lastBroadcast->created_at->diffForHumans() : null;

        $query = EstateBoardPost::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->withCount(['targets', 'reads'])
            ->latest();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%'.$request->search.'%')
                    ->orWhere('body', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        $paginated = $query->paginate(10);

        $announcementsData = collect($paginated->items())->map(fn ($p) => [
            'id' => $p->id,
            'hashid' => $p->hashid,
            'title' => $p->title,
            'body' => $p->body,
            'status' => $p->status->value,
            'category' => $p->category?->value,
            'priority' => $p->priority?->value,
            'applies_to' => $p->applies_to,
            'targets_count' => $p->targets_count,
            'reads_count' => $p->reads_count,
            'created_at' => $p->created_at->diffForHumans(),
        ]);

        $announcements = [
            'data' => $announcementsData,
            'total' => $paginated->total(),
            'per_page' => $paginated->perPage(),
            'current_page' => $paginated->currentPage(),
            'links' => $paginated->linkCollection()->toArray(),
        ];

        return Inertia::render('Resident/PropertyOwner/Announcements/Index', [
            'announcements' => $announcements,
            'metrics' => [
                'total' => $totalBroadcasts,
                'this_month' => $thisMonthBroadcasts,
                'last_broadcast' => $lastBroadcastDate,
            ],
            'filters' => [
                'search' => $request->search ?? '',
                'category' => $request->category ?? '',
                'priority' => $request->priority ?? '',
            ],
        ]);
    }

    /**
     * Show form for creating a new announcement.
     */
    public function create(): Response
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        $residents = User::query()
            ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.property_owner_id', $user->id))
            ->forEstate($estate->id)
            ->get(['id', 'name']);

        $properties = Property::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->whereNull('archived_at')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Resident/PropertyOwner/Announcements/Create', [
            'residents' => $residents,
            'properties' => $properties,
        ]);
    }

    /**
     * Store a newly created announcement.
     */
    public function store(Request $request): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();
        $user = auth()->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:10000'],
            'category' => ['required', 'string', 'in:general,meeting,maintenance,security,event'],
            'priority' => ['required', 'string', 'in:normal,important,critical'],
            'applies_to' => ['required', 'string', 'in:all,target'],
            'targets' => ['required_if:applies_to,target', 'array'],
            'targets.*.type' => ['required', 'string', 'in:user,property'],
            'targets.*.id' => ['required', 'integer'],
        ]);

        DB::transaction(function () use ($estate, $user, $validated) {
            $post = EstateBoardPost::create([
                'estate_id' => $estate->id,
                'user_id' => $user->id,
                'property_owner_id' => $user->id,
                'title' => $validated['title'],
                'body' => $validated['body'],
                'category' => $validated['category'],
                'priority' => $validated['priority'],
                'status' => EstateBoardPostStatus::Published,
                'audience' => EstateBoardPostAudience::Residents,
                'applies_to' => $validated['applies_to'],
                'published_at' => now(),
            ]);

            if ($post->applies_to === 'target') {
                foreach ($validated['targets'] as $t) {
                    $targetType = $t['type'] === 'user' ? User::class : Property::class;

                    // Security check: ensure target user or property is owned/managed by the Property Owner
                    if ($t['type'] === 'user') {
                        $targetUser = User::find($t['id']);
                        if (! $targetUser || $targetUser->getPropertyOwnerForEstate($estate)?->id !== $user->id) {
                            continue;
                        }
                    } else {
                        $targetProperty = Property::find($t['id']);
                        if (! $targetProperty || $targetProperty->property_owner_id !== $user->id) {
                            continue;
                        }
                    }

                    EstateBoardPostTarget::create([
                        'estate_board_post_id' => $post->id,
                        'target_type' => $t['type'],
                        'target_id' => $t['id'],
                    ]);
                }
            }

            // Notify relevant residents
            $usersToNotify = collect();

            if ($post->applies_to === 'all') {
                $usersToNotify = User::query()
                    ->whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.property_owner_id', $user->id))
                    ->forEstate($estate->id)
                    ->active()
                    ->get();
            } else {
                foreach ($validated['targets'] as $t) {
                    if ($t['type'] === 'user') {
                        $targetUser = User::find($t['id']);
                        if ($targetUser && $targetUser->getPropertyOwnerForEstate($estate)?->id === $user->id) {
                            $usersToNotify->push($targetUser);
                        }
                    } else {
                        $propertyUsers = User::whereHas('estates', fn ($q) => $q->where('estates.id', $estate->id)->where('estate_users_membership.property_owner_id', $user->id))
                            ->whereHas('profile', fn ($q) => $q->where('property_id', $t['id']))
                            ->active()
                            ->get();
                        $usersToNotify = $usersToNotify->merge($propertyUsers);
                    }
                }
                $usersToNotify = $usersToNotify->unique('id');
            }

            if ($usersToNotify->isNotEmpty()) {
                Notification::send($usersToNotify, new NewPostNotification($post));
            }
        });

        return redirect()
            ->route('resident.property-owner.announcements.index')
            ->with('success', 'Announcement published successfully.');
    }

    /**
     * View details of an announcement.
     */
    public function show(EstateBoardPost $announcement): Response
    {
        $user = auth()->user();
        abort_if($announcement->property_owner_id !== $user->id, 403);

        $announcement->load(['targets', 'reads']);

        // Calculate delivery insights
        $targetsCount = 0;
        if ($announcement->applies_to === 'all') {
            $targetsCount = User::whereHas('estates', fn ($q) => $q->where('estates.id', $announcement->estate_id)->where('estate_users_membership.property_owner_id', $user->id))
                ->forEstate($announcement->estate_id)
                ->active()
                ->count();
        } else {
            foreach ($announcement->targets as $target) {
                if ($target->target_type === 'user') {
                    $targetsCount += 1;
                } else {
                    $propertyUsersCount = User::whereHas('estates', fn ($q) => $q->where('estates.id', $announcement->estate_id)->where('estate_users_membership.property_owner_id', $user->id))
                        ->whereHas('profile', fn ($q) => $q->where('property_id', $target->target_id))
                        ->active()
                        ->count();
                    $targetsCount += $propertyUsersCount;
                }
            }
        }

        $readsCount = $announcement->reads_count ?? $announcement->reads->count();
        $readRate = $targetsCount > 0 ? round(($readsCount / $targetsCount) * 100) : 0;

        $formattedTargets = $announcement->targets->map(function ($target) {
            if ($target->target_type === 'user') {
                $user = User::find($target->target_id);

                return ['type' => 'Resident', 'name' => $user ? $user->name : 'Unknown'];
            } else {
                $property = Property::find($target->target_id);

                return ['type' => 'Property', 'name' => $property ? $property->name : 'Unknown'];
            }
        })->values()->all();

        return Inertia::render('Resident/PropertyOwner/Announcements/Show', [
            'announcement' => [
                'id' => $announcement->id,
                'hashid' => $announcement->hashid,
                'title' => $announcement->title,
                'body' => $announcement->body,
                'category' => $announcement->category?->value,
                'priority' => $announcement->priority?->value,
                'applies_to' => $announcement->applies_to,
                'created_at' => $announcement->created_at->format('M d, Y'),
            ],
            'metrics' => [
                'targets_count' => $targetsCount,
                'reads_count' => $readsCount,
                'read_rate' => $readRate,
            ],
            'targets' => $formattedTargets,
        ]);
    }

    /**
     * Delete/archive an announcement.
     */
    public function destroy(EstateBoardPost $announcement): RedirectResponse
    {
        $user = auth()->user();
        abort_if($announcement->property_owner_id !== $user->id, 403);

        if ($announcement->comments()->exists()) {
            return back()->withErrors(['message' => 'Announcement cannot be deleted because it has comments.']);
        }

        $announcement->delete();

        return redirect()
            ->route('resident.property-owner.announcements.index')
            ->with('success', 'Announcement deleted successfully.');
    }
}
