<?php

namespace App\Actions\Incidents;

use App\Enums\IncidentStatus;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use App\Notifications\Incidents\IncidentCreatedNotification;
use App\Services\CloudinaryService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class CreateIncidentAction
{
    public function __construct(
        protected CloudinaryService $cloudinaryService
    ) {}

    /**
     * @param  array{title: string, body: string, category: string, attachment_url?: string|null, attachment_type?: string|null, attachment_hash?: string|null}  $data
     */
    public function execute(array $data, Estate $estate): Incident
    {
        return DB::transaction(function () use ($data, $estate) {
            $user = Auth::user();

            $incident = new Incident([
                'estate_id' => $estate->id,
                'reporter_id' => $user->id,
                'title' => $data['title'],
                'body' => $data['body'],
                'category' => $data['category'],
                'priority' => $data['priority'] ?? 'medium',
                'status' => IncidentStatus::Pending,
                'attachment_url' => $data['attachment_url'] ?? null,
                'attachment_type' => $data['attachment_type'] ?? null,
                'attachment_hash' => $data['attachment_hash'] ?? null,
                'location' => $data['location'] ?? null,
                'is_private' => $data['is_private'] ?? false,
            ]);

            $incident->save();

            activity()
                ->performedOn($incident)
                ->causedBy($user)
                ->withProperties(['estate_id' => $estate->id])
                ->log("reported incident: {$incident->title}");

            // Load relations
            $incident->load(['reporter', 'estate']);

            // Send notification to all active admins in the estate
            $admins = User::forEstate($estate->id)
                ->active()
                ->where('id', '!=', $user->id)
                ->get()
                ->filter(function ($u) use ($estate) {
                    setPermissionsTeamId($estate->id);

                    return $u->hasRole('admin');
                });

            if ($admins->isNotEmpty()) {
                Notification::send($admins, new IncidentCreatedNotification($incident));
            }

            return $incident;
        });
    }
}
