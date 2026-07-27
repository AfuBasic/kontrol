<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Support\Facades\DB;
use Throwable;

class ForceLogout implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        private int $userId,
    ) {}

    /**
     * Safely invalidate other sessions and broadcast ForceLogout with graceful degradation.
     * Prevents socket connection failures from breaking authentication requests.
     */
    public static function dispatchSafely(int $userId): void
    {
        // 1. Invalidate other active database sessions for this user server-side
        try {
            if (config('session.driver') === 'database') {
                $currentSessionId = session()->getId();
                DB::table(config('session.table', 'sessions'))
                    ->where('user_id', $userId)
                    ->when($currentSessionId, fn ($q) => $q->where('id', '!=', $currentSessionId))
                    ->delete();
            }
        } catch (Throwable $e) {
            logger()->warning('Failed to invalidate database sessions during login:', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }

        // 2. Broadcast real-time socket event with graceful fallback
        try {
            broadcast(new self($userId));
        } catch (Throwable $e) {
            logger()->warning('Socket connection failed during ForceLogout broadcast. Gracefully proceeding.', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("users.{$this->userId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'force.logout';
    }
}
