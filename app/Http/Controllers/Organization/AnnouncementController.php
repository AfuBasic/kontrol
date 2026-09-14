<?php

namespace App\Http\Controllers\Organization;

use App\Enums\EstateBoardPostAudience;
use App\Enums\EstateBoardPostStatus;
use App\Http\Controllers\Controller;
use App\Models\EstateBoardPost;
use App\Models\EstateOrganization;
use App\Services\OrganizationContextService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function __construct(
        private OrganizationContextService $contextService,
    ) {}

    public function index(Request $request): Response
    {
        /** @var EstateOrganization $organization */
        $organization = $request->attributes->get('organization') ?? $this->contextService->getOrganization();
        $membership = $request->attributes->get('organization_membership') ?? $this->contextService->getMembership();

        $posts = EstateBoardPost::query()
            ->where('estate_id', $organization->estate_id)
            ->where('status', EstateBoardPostStatus::Published)
            ->whereIn('audience', [EstateBoardPostAudience::All])
            ->with(['author:id,name', 'media'])
            ->latest('published_at')
            ->paginate(15)
            ->through(fn (EstateBoardPost $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'body' => $post->body,
                'category' => $post->category?->value ?? 'general',
                'priority' => $post->priority?->value ?? 'normal',
                'published_at' => $post->published_at?->toISOString(),
                'published_at_human' => $post->published_at?->diffForHumans() ?? $post->created_at?->diffForHumans(),
                'author_name' => $post->author?->name ?? 'Estate Office',
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
                'estate_name' => $organization->estate?->name,
            ],
            'membership' => [
                'role' => $membership->role,
                'is_admin' => $membership->isAdmin(),
            ],
            'posts' => $posts,
        ]);
    }
}
