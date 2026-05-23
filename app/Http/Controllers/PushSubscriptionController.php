<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    /**
     * Get the VAPID public key.
     */
    public function vapidPublicKey(): JsonResponse
    {
        return response()->json([
            'publicKey' => config('webpush.vapid.public_key'),
        ]);
    }

    /**
     * Store a new push subscription.
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->has('token') && $request->has('platform')) {
            $validated = $request->validate([
                'token' => ['required', 'string'],
                'platform' => ['required', 'string'],
            ]);

            /** @var User $user */
            $user = $request->user();
            $user->update(['fcm_token' => $validated['token']]);

            return response()->json(['success' => true]);
        }

        $validated = $request->validate([
            'endpoint' => ['required', 'url'],
            'keys.auth' => ['required', 'string'],
            'keys.p256dh' => ['required', 'string'],
        ]);

        /** @var User $user */
        $user = $request->user();

        $user->updatePushSubscription(
            endpoint: $validated['endpoint'],
            key: $validated['keys']['p256dh'],
            token: $validated['keys']['auth'],
        );

        return response()->json(['success' => true]);
    }

    /**
     * Delete a push subscription.
     */
    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'url'],
        ]);

        /** @var User $user */
        $user = $request->user();

        $user->deletePushSubscription($validated['endpoint']);

        return response()->json(['success' => true]);
    }
}
