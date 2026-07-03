<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EnhanceContentRequest;
use App\Services\ContentEnhancerService;
use Illuminate\Http\JsonResponse;
use Throwable;

class ContentEnhanceController extends Controller
{
    public function __invoke(EnhanceContentRequest $request, ContentEnhancerService $service): JsonResponse
    {
        try {
            $context = array_filter([
                'category' => $request->validated('category'),
                'priority' => $request->validated('priority'),
                'audience' => $request->validated('audience'),
            ]);

            if ($request->validated('mode') === 'draft') {
                $draft = $service->draftEstateBoardPost(
                    brief: $request->validated('brief'),
                    title: $request->validated('title'),
                    context: $context,
                );

                return response()->json([
                    'success' => true,
                    'enhanced' => $draft['body'],
                    'suggested_title' => $draft['title'],
                ]);
            }

            $enhanced = $service->enhanceEstateBoardPost(
                content: $request->validated('content'),
                title: $request->validated('title'),
                context: $context,
            );

            return response()->json([
                'success' => true,
                'enhanced' => $enhanced,
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Failed to enhance content. Please try again.',
            ], 500);
        }
    }
}
