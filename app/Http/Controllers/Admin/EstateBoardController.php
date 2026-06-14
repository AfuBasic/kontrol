<?php

namespace App\Http\Controllers\Admin;

use App\Actions\EstateBoard\CreatePostAction;
use App\Actions\EstateBoard\DeletePostAction;
use App\Actions\EstateBoard\UpdatePostAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\EstateBoard\StorePostRequest;
use App\Http\Requests\EstateBoard\UpdatePostRequest;
use App\Models\EstateBoardPost;
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
        $audiences = ($audience && $audience !== 'all') 
            ? [\App\Enums\EstateBoardPostAudience::from($audience)] 
            : null;

        $posts = $this->boardService->getFeed($estateId, 10, $audiences, null, $search);

        return Inertia::render('Admin/EstateBoard/Index', [
            'posts' => $posts,
            'filters' => [
                'search' => $search ?? '',
                'audience' => $audience ?? 'all',
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
        $comments = $this->boardService->getComments($post->id, $estateId);

        return Inertia::render('Admin/EstateBoard/Show', [
            'post' => $postData,
            'comments' => $comments,
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
