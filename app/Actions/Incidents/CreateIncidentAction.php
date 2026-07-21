<?php

namespace App\Actions\Incidents;

use App\Enums\IncidentSource;
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
     * @param  array{title: string, body: string, category: string, attachment_url?: string|null, attachment_type?: string|null, attachment_hash?: string|null, priority?: string, assigned_to?: int|string|null, source?: string, reporter_id?: int, reporter_type?: string}  $data
     */
    public function execute(array $data, Estate $estate): Incident
    {
        return DB::transaction(function () use ($data, $estate) {
            $user = Auth::user();

            // Resolve reporter polymorphically
            $reporterId = $data['reporter_id'] ?? $user->id;
            $reporterType = $data['reporter_type'] ?? get_class($user);

            // Resolve incident source based on actor role/type if not explicitly set
            if (isset($data['source'])) {
                $source = $data['source'];
            } else {
                setPermissionsTeamId($estate->id);
                if ($user->hasRole('admin')) {
                    $source = IncidentSource::EstateManagement;
                } elseif ($user->hasRole('security')) {
                    $source = IncidentSource::SecurityReport;
                } else {
                    $source = IncidentSource::ResidentReport;
                }
            }

            $isPrivate = $data['is_private'] ?? false;
            if ($source === IncidentSource::SecurityReport) {
                $isPrivate = true;
            }

            $incident = new Incident([
                'estate_id' => $estate->id,
                'reporter_id' => $reporterId,
                'reporter_type' => $reporterType,
                'source' => $source,
                'title' => $data['title'],
                'body' => $data['body'],
                'category' => $data['category'],
                'priority' => $data['priority'] ?? 'medium',
                'status' => IncidentStatus::Pending,
                'assigned_to' => $data['assigned_to'] ?? null,
                'attachment_url' => $data['attachment_url'] ?? null,
                'attachment_type' => $data['attachment_type'] ?? null,
                'attachment_hash' => $data['attachment_hash'] ?? null,
                'location' => $data['location'] ?? null,
                'is_private' => $isPrivate,
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
