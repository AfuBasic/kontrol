<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Actions\Auth\GenerateMagicLoginUrlAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MagicUrlController extends Controller
{
    /**
     * Generate a magic login URL for the authenticated user.
     * Use this when transitioning from mobile app to web interface.
     */
    public function store(Request $request, GenerateMagicLoginUrlAction $action): JsonResponse
    {
        $user = $request->user();
        $destination = $request->query('redirect', '/');

        $url = $action->execute($user, $destination);

        return response()->json([
            'status' => 'success',
            'magic_url' => $url,
            'message' => 'Magic login URL generated successfully. Valid for 5 minutes and single use.',
        ]);
    }
}
