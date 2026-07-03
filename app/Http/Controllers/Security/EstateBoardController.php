<?php

namespace App\Http\Controllers\Security;

use App\Actions\EstateBoard\RecordPostReadAction;
use App\Enums\EstateBoardPostAudience;
use App\Http\Controllers\Controller;
use App\Models\EstateBoardPost;
use App\Services\Admin\EstateBoardService;
use App\Services\EstateContextService;
use Inertia\Inertia;
use Inertia\Response;

class EstateBoardController extends Controller
{
    public function __construct(
        protected EstateBoardService $boardService,
        protected EstateContextService $estateContext
    ) {}

    /**
     * Audiences visible to security personnel.
     *
     * @var array<EstateBoardPostAudience>
     */
    protected array $allowedAudiences = [
        EstateBoardPostAudience::All,
        EstateBoardPostAudience::Security,
    ];

    /**
     * Display the estate board feed.
     */
    public function index(): Response
    {
        $this->authorize('viewAny', EstateBoardPost::class);

        $estateId = $this->estateContext->getEstateId();
        $posts = $this->boardService->getFeed($estateId, 10, $this->allowedAudiences);

        return Inertia::render('Security/Feed/Index', [
            'posts' => $posts,
        ]);
    }

    /**
     * Show a single post.
     */
    public function show(EstateBoardPost $post, RecordPostReadAction $recordPostRead): Response
    {
        $this->authorize('view', $post);

        $estateId = $this->estateContext->getEstateId();
        $recordPostRead->execute($post, auth()->user());

        $postData = $this->boardService->getPost($post->id, $estateId, $this->allowedAudiences);

        abort_if($postData === null, 404);

        $comments = $this->boardService->getComments($post->id, $estateId);

        return Inertia::render('Security/Feed/Show', [
            'post' => $postData,
            'comments' => $comments,
        ]);
    }
}
