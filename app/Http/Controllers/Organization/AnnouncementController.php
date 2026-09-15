<?php

namespace App\Http\Controllers\Organization;

use App\Actions\EstateBoard\AddCommentAction;
use App\Actions\EstateBoard\DeleteCommentAction;
use App\Actions\EstateBoard\RecordPostReadAction;
use App\Enums\EstateBoardPostAudience;
use App\Enums\EstateBoardPostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Organization\StoreAnnouncementCommentRequest;
use App\Models\EstateBoardComment;
use App\Models\EstateBoardPost;
use App\Models\EstateBoardPostRead;
use App\Models\EstateOrganization;
use App\Services\Admin\EstateBoardService;
use App\Services\OrganizationContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
        private EstateBoardService $boardService,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();
        $user = $request->user();

        $baseQuery = EstateBoardPost::query()
            ->where('estate_id', $organization->estate_id)
            ->where('status', EstateBoardPostStatus::Published)
            ->whereIn('audience', [EstateBoardPostAudience::All]);

        $unreadCount = 0;
        if ($user) {
            $unreadCount = (clone $baseQuery)
                ->whereDoesntHave('reads', fn ($q) => $q->where('user_id', $user->id))
                ->count();
        }

        $posts = (clone $baseQuery)
            ->with(['author:id,name', 'media'])
            ->withCount('comments')
            ->when($user, function ($q) use ($user) {
                $q->withExists(['reads as is_read' => fn ($sub) => $sub->where('user_id', $user->id)])
                    ->selectSub(
                        EstateBoardPostRead::query()
                            ->select('created_at')
                            ->whereColumn('estate_board_post_id', 'estate_board_posts.id')
                            ->where('user_id', $user->id)
                            ->limit(1),
                        'read_at'
                    );
            })
            ->latest('published_at')
            ->latest('id')
            ->cursorPaginate(10)
            ->through(fn (EstateBoardPost $post) => [
                'id' => $post->id,
                'hashid' => $post->hashid,
                'title' => $post->title,
                'body' => $post->body,
                'category' => $post->category?->value ?? 'general',
                'priority' => $post->priority?->value ?? 'normal',
                'is_read' => (bool) ($post->is_read ?? false),
                'read_at' => $post->read_at ? (string) $post->read_at : null,
                'published_at' => $post->published_at?->toISOString(),
                'published_at_human' => $post->published_at?->diffForHumans() ?? $post->created_at?->diffForHumans(),
                'publisher_name' => $organization->estate?->name ?? 'Estate Management',
                'publisher_role' => 'Estate Management',
                'author_name' => $post->author?->name,
                'comments_count' => (int) ($post->comments_count ?? 0),
                'media_count' => $post->media->count(),
                'media' => $post->media->map(fn ($media) => [
                    'id' => $media->id,
                    'url' => $media->url,
                    'mime_type' => $media->mime_type,
                    'width' => $media->width,
                    'height' => $media->height,
                    'sort_order' => $media->sort_order,
                ])->values(),
            ]);

        return Inertia::render('Organization/Announcements', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'type' => $organization->type,
                'estate_name' => $organization->estate?->name ?? 'Estate',
            ],
            'estate' => [
                'id' => $organization->estate_id,
                'name' => $organization->estate?->name ?? 'Estate',
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'unread_count' => $unreadCount,
            'posts' => $posts,
        ]);
    }

    public function show(Request $request, EstateBoardPost $post, RecordPostReadAction $recordPostRead): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();
        $user = $request->user();

        // Verify that the post belongs to the organization's estate, is published, and is accessible to All audience
        abort_unless(
            $post->estate_id === $organization->estate_id
            && $post->status === EstateBoardPostStatus::Published
            && $post->audience === EstateBoardPostAudience::All,
            404
        );

        if ($user) {
            $recordPostRead->execute($post, $user);
        }

        $post->load(['author:id,name', 'media']);
        $post->loadCount('comments');

        $comments = $this->boardService->getComments($post->id, $organization->estate_id);

        return Inertia::render('Organization/AnnouncementDetail', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
                'type' => $organization->type,
                'estate_name' => $organization->estate?->name ?? 'Estate',
            ],
            'estate' => [
                'id' => $organization->estate_id,
                'name' => $organization->estate?->name ?? 'Estate',
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'post' => [
                'id' => $post->id,
                'hashid' => $post->hashid,
                'title' => $post->title,
                'body' => $post->body,
                'category' => $post->category?->value ?? 'general',
                'priority' => $post->priority?->value ?? 'normal',
                'is_read' => true,
                'published_at' => $post->published_at?->toISOString(),
                'published_at_human' => $post->published_at?->diffForHumans() ?? $post->created_at?->diffForHumans(),
                'publisher_name' => $organization->estate?->name ?? 'Estate Management',
                'publisher_role' => 'Estate Management',
                'author_name' => $post->author?->name,
                'comments_count' => (int) ($post->comments_count ?? 0),
                'media' => $post->media->map(fn ($media) => [
                    'id' => $media->id,
                    'url' => $media->url,
                    'mime_type' => $media->mime_type,
                    'width' => $media->width,
                    'height' => $media->height,
                    'sort_order' => $media->sort_order,
                ])->values(),
            ],
            'comments' => $comments,
        ]);
    }

    /**
     * Store a comment on an announcement.
     */
    public function storeComment(StoreAnnouncementCommentRequest $request, EstateBoardPost $post, AddCommentAction $action): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();

        abort_unless(
            $post->estate_id === $organization->estate_id
            && $post->status === EstateBoardPostStatus::Published
            && $post->audience === EstateBoardPostAudience::All,
            404
        );

        $action->execute($request->validated(), $post, $organization->estate);

        return back()->with('success', 'Comment added.');
    }

    /**
     * Delete an announcement comment.
     */
    public function destroyComment(Request $request, EstateBoardComment $comment, DeleteCommentAction $action): RedirectResponse
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $user = $request->user();

        abort_unless(
            $comment->estate_id === $organization->estate_id,
            404
        );

        // User can delete their own comment or if they are an organization admin
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();
        abort_unless(
            $comment->user_id === $user->id || $membership->isAdmin(),
            403
        );

        $action->execute($comment);

        return back()->with('success', 'Comment deleted.');
    }
}
