<?php

namespace App\Http\Controllers\Admin;

use App\Actions\EstateBoard\CreatePostAction;
use App\Actions\EstateBoard\DeletePostAction;
use App\Actions\EstateBoard\UpdatePostAction;
use App\Enums\EstateBoardPostAudience;
use App\Http\Controllers\Controller;
use App\Http\Requests\EstateBoard\StorePostRequest;
use App\Http\Requests\EstateBoard\UpdatePostRequest;
use App\Models\EstateBoardPost;
use App\Models\Property;
use App\Models\User;
use App\Services\Admin\EstateBoardService;
use App\Services\Admin\UserService;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EstateBoardController extends Controller
{
    public function __construct(
        protected EstateBoardService $boardService,
        protected UserService $userService,
        protected EstateContextService $estateContext
    ) {}

    /**
     * Display the estate board feed.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', EstateBoardPost::class);

        $estateId = $this->estateContext->getEstateId();

        $search = request('search');
        $audience = request('audience');
        $category = request('category');
        $priority = request('priority');
        $audiences = ($audience && $audience !== 'all')
            ? [EstateBoardPostAudience::from($audience)]
            : null;

        $posts = $this->boardService->getFeed($estateId, 10, $audiences, null, $search, $category, $priority);
        $metrics = $this->boardService->getFeedMetrics($estateId, null);

        return Inertia::render('Admin/EstateBoard/Index', [
            'posts' => $posts,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search ?? '',
                'audience' => $audience ?? 'all',
                'category' => $category ?? '',
                'priority' => $priority ?? '',
            ],
        ]);
    }

    /**
     * Display admin management view.
     */
    public function manage(): Response
    {
        $this->authorize('create', EstateBoardPost::class);

        $estateId = $this->estateContext->getEstateId();
        $posts = $this->boardService->getAdminPosts($estateId);

        return Inertia::render('Admin/EstateBoard/Manage', [
            'posts' => $posts,
        ]);
    }

    /**
     * Show form to create a new post.
     */
    public function create(): Response
    {
        $this->authorize('create', EstateBoardPost::class);

        return Inertia::render('Admin/EstateBoard/Create');
    }

    /**
     * Store a new post.
     */
    public function store(StorePostRequest $request, CreatePostAction $action): RedirectResponse
    {
        $this->authorize('create', EstateBoardPost::class);

        $estate = $this->estateContext->getEstate();
        $action->execute($request->validated(), $estate);

        return redirect()
            ->route('admin.estate-board.manage')
            ->with('success', 'Post created successfully.');
    }

    /**
     * Show a single post.
     */
    public function show(EstateBoardPost $post): Response
    {
        $this->authorize('view', $post);

        $estateId = $this->estateContext->getEstateId();
        $postData = $this->boardService->getPost($post->id, $estateId);

        $targetsCount = 0;
        if ($postData->applies_to === 'all') {
            // Need to estimate total users for this post
            if ($postData->property_owner_id) {
                $targetsCount = User::query()
                    ->whereHas('estates', fn ($q) => $q->where('estates.id', $estateId)->where('estate_users_membership.property_owner_id', $postData->property_owner_id))
                    ->forEstate($estateId)
                    ->active()
                    ->count();
            } else {
                $query = User::forEstate($estateId)->active();
                if ($postData->audience === EstateBoardPostAudience::Residents) {
                    $query->role('resident');
                } elseif ($postData->audience === EstateBoardPostAudience::Security) {
                    $query->role('security');
                }
                $targetsCount = $query->count();
            }
        } else {
            foreach ($postData->targets as $target) {
                if ($target->target_type === 'user') {
                    $targetsCount += 1;
                } else {
                    $propertyUsersCount = User::query()
                        ->whereHas('profile', fn ($q) => $q->where('property_id', $target->target_id))
                        ->active()
                        ->count();
                    $targetsCount += $propertyUsersCount;
                }
            }
        }

        $readsCount = $postData->reads_count ?? 0;
        $readRate = $targetsCount > 0 ? round(($readsCount / $targetsCount) * 100) : 0;

        $formattedTargets = $postData->targets->map(function ($target) {
            if ($target->target_type === 'user') {
                $user = User::find($target->target_id);

                return ['type' => 'Resident', 'name' => $user ? $user->name : 'Unknown'];
            } else {
                $property = Property::find($target->target_id);

                return ['type' => 'Property', 'name' => $property ? $property->name : 'Unknown'];
            }
        })->values()->all();

        return Inertia::render('Admin/EstateBoard/Show', [
            'post' => $postData,
            'comments' => Inertia::defer(fn () => $this->boardService->getComments($post->id, $estateId)),
            'metrics' => [
                'targets_count' => $targetsCount,
                'reads_count' => $readsCount,
                'read_rate' => $readRate,
            ],
            'targets' => $formattedTargets,
        ]);
    }

    /**
     * Show form to edit a post.
     */
    public function edit(EstateBoardPost $post): Response
    {
        $this->authorize('update', $post);

        $post->load(['media']);

        return Inertia::render('Admin/EstateBoard/Edit', [
            'post' => $post,
        ]);
    }

    /**
     * Update a post.
     */
    public function update(UpdatePostRequest $request, EstateBoardPost $post, UpdatePostAction $action): RedirectResponse
    {
        $this->authorize('update', $post);

        $estate = $this->estateContext->getEstate();
        $action->execute($post, $request->validated(), $estate);

        return redirect()
            ->route('admin.estate-board.manage')
            ->with('success', 'Post updated successfully.');
    }

    /**
     * Delete a post.
     */
    public function destroy(EstateBoardPost $post, DeletePostAction $action): RedirectResponse
    {
        $this->authorize('delete', $post);

        if ($post->comments()->exists()) {
            return back()->withErrors(['message' => 'Post cannot be deleted because it has comments.']);
        }

        $estate = $this->estateContext->getEstate();
        $action->execute($post, $estate);

        return redirect()
            ->route('admin.estate-board.manage')
            ->with('success', 'Post deleted successfully.');
    }
}
