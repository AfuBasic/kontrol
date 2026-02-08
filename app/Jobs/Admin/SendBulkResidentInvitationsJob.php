<?php

namespace App\Jobs\Admin;

use App\Mail\Admin\ResidentInvitationMail;
use App\Models\Estate;
use App\Models\User;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendBulkResidentInvitationsJob implements ShouldQueue
{
    use Batchable, Queueable;

    /**
     * @param  array<int>  $userIds
     */
    public function __construct(
        public array $userIds,
        public int $estateId,
    ) {}

    public function handle(): void
    {
        if ($this->batch()?->cancelled()) {
            return;
        }

        $estate = Estate::find($this->estateId);
        if (! $estate) {
            return;
        }

        // Process users in chunks to avoid memory issues
        User::whereIn('id', $this->userIds)
            ->cursor()
            ->each(function (User $user) use ($estate) {
                Mail::to($user->email)->send(
                    new ResidentInvitationMail($user, $estate, false)
                );
            });
    }
}
