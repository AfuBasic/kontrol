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

        $totalUnfiltered = EstateBoardPost::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->count();

        $query = EstateBoardPost::query()
            ->where('estate_id', $estate->id)
            ->where('property_owner_id', $user->id)
            ->withCount(['targets'])
            ->latest();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%'.$request->search.'%')
                    ->orWhere('body', 'like', '%'.$request->search.'%');
            });
        }

        $paginated = $query->paginate(10);

        $announcementsData = collect($paginated->items())->map(fn ($p) => [
            'id' => $p->id,
            'hashid' => $p->hashid,
            'title' => $p->title,
            'body' => $p->body,
            'status' => $p->status->value,
            'applies_to' => $p->applies_to,
            'targets_count' => $p->targets_count,
            'created_at' => $p->created_at->format('M d, Y'),
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
            'totalUnfiltered' => $totalUnfiltered,
            'filters' => [
                'search' => $request->search ?? '',
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
            ->whereHas('profile', fn ($q) => $q->where('property_owner_id', $user->id))
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
                        if (! $targetUser || $targetUser->profile?->property_owner_id !== $user->id) {
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
                    ->whereHas('profile', fn ($q) => $q->where('property_owner_id', $user->id))
                    ->forEstate($estate->id)
                    ->active()
                    ->get();
            } else {
                foreach ($validated['targets'] as $t) {
                    if ($t['type'] === 'user') {
                        $targetUser = User::find($t['id']);
                        if ($targetUser && $targetUser->profile?->property_owner_id === $user->id) {
                            $usersToNotify->push($targetUser);
                        }
                    } else {
                        $propertyUsers = User::query()
                            ->whereHas('profile', fn ($q) => $q->where('property_id', $t['id'])->where('property_owner_id', $user->id))
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

        $announcement->load(['targets']);

        // Format targets for UI display
        $formattedTargets = [];
        foreach ($announcement->targets as $target) {
            if ($target->target_type === 'user') {
                $item = User::find($target->target_id);
                if ($item) {
                    $formattedTargets[] = ['type' => 'Resident', 'name' => $item->name];
                }
            } else {
                $item = Property::find($target->target_id);
                if ($item) {
                    $formattedTargets[] = ['type' => 'Property', 'name' => $item->name];
                }
            }
        }

        return Inertia::render('Resident/PropertyOwner/Announcements/Show', [
            'announcement' => [
                'id' => $announcement->id,
                'hashid' => $announcement->hashid,
                'title' => $announcement->title,
                'body' => $announcement->body,
                'applies_to' => $announcement->applies_to,
                'created_at' => $announcement->created_at->format('M d, Y'),
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

        $announcement->delete();

        return redirect()
            ->route('resident.property-owner.announcements.index')
            ->with('success', 'Announcement deleted successfully.');
    }
}
