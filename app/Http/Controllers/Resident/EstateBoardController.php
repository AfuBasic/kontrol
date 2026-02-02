<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\EstateBoardPost;
use App\Services\Admin\EstateBoardService;
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

        return Inertia::render('resident/estate-board/Index', [
            'posts' => $posts,
        ]);
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

        return Inertia::render('resident/estate-board/Show', [
            'post' => $postData,
            'comments' => $comments,
        ]);
    }
}
