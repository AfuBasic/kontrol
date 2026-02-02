<?php

namespace App\Http\Controllers\Resident;

use App\Enums\EstateBoardPostAudience;
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
     * Audiences visible to residents.
     *
     * @var array<EstateBoardPostAudience>
     */
    protected array $allowedAudiences = [
        EstateBoardPostAudience::All,
        EstateBoardPostAudience::Residents,
    ];

    /**
     * Display the estate board feed.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', EstateBoardPost::class);

        $estateId = $this->boardService->getCurrentEstateId();
        $posts = $this->boardService->getFeed($estateId, 10, $this->allowedAudiences);

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
        $postData = $this->boardService->getPost($post->id, $estateId, $this->allowedAudiences);

        abort_if($postData === null, 404);

        $comments = $this->boardService->getComments($post->id, $estateId);

        return Inertia::render('resident/estate-board/Show', [
            'post' => $postData,
            'comments' => $comments,
        ]);
    }
}
