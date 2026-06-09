<?php

namespace App\Actions\Incidents;

use App\Enums\IncidentStatus;
use App\Models\Estate;
use App\Models\Incident;
use App\Models\User;
use App\Notifications\Incidents\IncidentCreatedNotification;
use App\Services\CloudinaryService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class CreateIncidentAction
{
    public function __construct(
        protected CloudinaryService $cloudinaryService
    ) {}

    /**
     * @param  array{title: string, body: string, category: string, attachment?: UploadedFile|null}  $data
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
                'status' => IncidentStatus::Pending,
            ]);

            if (! empty($data['attachment'])) {
                $uploadResult = $this->cloudinaryService->uploadMedia($data['attachment'], $estate);
                $incident->attachment_url = $uploadResult['url'];
                $incident->attachment_type = $uploadResult['type'];
            }

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
