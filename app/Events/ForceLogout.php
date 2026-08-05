<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
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
        // 1. Rotate remember_token to instantly invalidate "Remember Me" cookies on all other devices
        try {
            $user = User::find($userId);
            if ($user) {
                $user->forceFill([
                    'remember_token' => Str::random(60),
                ])->save();
            }
        } catch (Throwable $e) {
            logger()->warning('Failed to rotate remember_token during ForceLogout:', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }

        // 2. Invalidate other active database sessions for this user server-side
        try {
            $currentSessionId = session()->getId();
            $table = config('session.table', 'sessions');
            if (Schema::hasTable($table)) {
                DB::table($table)
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

        // 3. Broadcast real-time socket event with graceful fallback
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
