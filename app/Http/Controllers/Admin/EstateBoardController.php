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
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class EstateBoardController extends Controller
{
    public function __construct(
        protected EstateBoardService $boardService
    ) {}

    /**
     * Display the estate board feed.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', EstateBoardPost::class);

        $estateId = $this->boardService->getCurrentEstateId();
        $posts = $this->boardService->getFeed($estateId);

        return Inertia::render('admin/estate-board/Index', [
            'posts' => $posts,
        ]);
    }

    /**
     * Display admin management view.
     */
    public function manage(): Response
    {
        $this->authorize('create', EstateBoardPost::class);

        $estateId = $this->boardService->getCurrentEstateId();
        $posts = $this->boardService->getAdminPosts($estateId);

        return Inertia::render('admin/estate-board/Manage', [
            'posts' => $posts,
        ]);
    }

    /**
     * Show form to create a new post.
     */
    public function create(): Response
    {
        $this->authorize('create', EstateBoardPost::class);

        return Inertia::render('admin/estate-board/Create');
    }

    /**
     * Store a new post.
     */
    public function store(StorePostRequest $request, CreatePostAction $action): RedirectResponse
    {
        $this->authorize('create', EstateBoardPost::class);

        $estate = $this->boardService->getCurrentEstate();
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

        $estateId = $this->boardService->getCurrentEstateId();
        $postData = $this->boardService->getPost($post->id, $estateId);
        $comments = $this->boardService->getComments($post->id, $estateId);

        return Inertia::render('admin/estate-board/Show', [
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

        return Inertia::render('admin/estate-board/Edit', [
            'post' => $post,
        ]);
    }

    /**
     * Update a post.
     */
    public function update(UpdatePostRequest $request, EstateBoardPost $post, UpdatePostAction $action): RedirectResponse
    {
        $this->authorize('update', $post);

        $estate = $this->boardService->getCurrentEstate();
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

        $estate = $this->boardService->getCurrentEstate();
        $action->execute($post, $estate);

        return redirect()
            ->route('admin.estate-board.manage')
            ->with('success', 'Post deleted successfully.');
    }
}
