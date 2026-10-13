<?php

namespace App\Actions\Platform;

use App\Models\User;
use App\Models\UserClient;
use App\Support\ClientPlatform;
use Illuminate\Database\UniqueConstraintViolationException;

class RecordUserClient
{
    public function execute(User $user, ClientPlatform $client): void
    {
        try {
            $this->write($user, $client);
        } catch (UniqueConstraintViolationException) {
            // Two requests from the same new client arrived together; the other one created the row.
            $this->write($user, $client);
        }
    }

    private function write(User $user, ClientPlatform $client): void
    {
        $row = UserClient::query()->firstOrNew([
            'user_id' => $user->id,
            'platform' => $client->platform,
            'os' => $client->os,
        ]);

        if (! $row->exists) {
            $row->first_seen_at = now();
        }

        $row->device_type = $client->deviceType;
        $row->browser = $client->browser;
        // A request that does not carry the version (a plain page load) must not erase the one already known.
        $row->app_version = $client->appVersion ?? $row->app_version;
        $row->last_seen_at = now();
        $row->save();
    }
}
