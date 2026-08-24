<?php

namespace App\Actions\Incidents;

use App\Enums\IncidentStatus;
use App\Models\EstateSettings;
use App\Models\Incident;
use App\Notifications\Incidents\IncidentStatusUpdatedNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateIncidentStatusAction
{
    /**
     * @param  array{status: string, assigned_to?: int|null}  $data
     */
    public function execute(Incident $incident, array $data): Incident
    {
        return DB::transaction(function () use ($incident, $data) {
            $user = Auth::user();
            $loggedActions = [];

            // 1. Handle status update if provided
            if (isset($data['status'])) {
                $newStatus = IncidentStatus::from($data['status']);

                if ($newStatus !== $incident->status) {
                    if ($incident->status === IncidentStatus::Closed) {
                        throw ValidationException::withMessages([
                            'status' => ['This incident is closed and cannot be updated.'],
                        ]);
                    }

                    $incident->status = $newStatus;
                    $loggedActions[] = "updated incident status to: {$newStatus->label()}";

                    // Set timestamps
                    if ($newStatus === IncidentStatus::Acknowledged && ! $incident->acknowledged_at) {
                        $incident->acknowledged_at = now();
                    } elseif ($newStatus === IncidentStatus::Resolving) {
                        if (! $incident->acknowledged_at) {
                            $incident->acknowledged_at = now();
                        }
                        if (! $incident->resolving_at) {
                            $incident->resolving_at = now();
                        }
                    } elseif ($newStatus === IncidentStatus::Solved || $newStatus === IncidentStatus::Closed) {
                        $settings = EstateSettings::forEstate($incident->estate_id);
                        $resolutionNotes = $data['resolution_notes'] ?? ($data['comment'] ?? null);

                        if ($settings->require_resolution_notes_for_incidents && empty($resolutionNotes)) {
                            throw ValidationException::withMessages([
                                'resolution_notes' => ['Resolution notes are required by estate policy when resolving an incident.'],
                            ]);
                        }

                        if ($newStatus === IncidentStatus::Solved) {
                            if (! $incident->acknowledged_at) {
                                $incident->acknowledged_at = now();
                            }
                            if (! $incident->resolving_at) {
                                $incident->resolving_at = now();
                            }
                            if (! $incident->solved_at) {
                                $incident->solved_at = now();
                            }

                            if (! empty($resolutionNotes)) {
                                $loggedActions[] = "marked incident as resolved: {$resolutionNotes}";
                            }
                        } else {
                            if (! $incident->closed_at) {
                                $incident->closed_at = now();
                            }
                        }
                    }
                }
            }

            // 2. Handle assignee update if provided
            if (array_key_exists('assigned_to', $data)) {
                if ($incident->assigned_to !== $data['assigned_to']) {
                    $incident->assigned_to = $data['assigned_to'];
                    $assigneeName = $incident->assignee ? $incident->assignee->name : 'Unassigned';
                    $loggedActions[] = "reassigned incident to: {$assigneeName}";
                }
            }

            // 3. Handle priority update if provided
            if (array_key_exists('priority', $data)) {
                if ($incident->priority?->value !== $data['priority']) {
                    $incident->priority = $data['priority'];
                    $loggedActions[] = 'updated incident priority to: '.ucfirst($data['priority']);
                }
            }

            // 4. Handle category update if provided
            if (array_key_exists('category', $data)) {
                if ($incident->category?->value !== $data['category']) {
                    $incident->category = $data['category'];
                    $loggedActions[] = 'updated incident category to: '.str_replace('_', ' ', $data['category']);
                }
            }

            // 5. Handle is_private toggle if provided
            if (array_key_exists('is_private', $data)) {
                $isPrivate = (bool) $data['is_private'];
                if ($incident->is_private !== $isPrivate) {
                    $incident->is_private = $isPrivate;
                    $visibility = $isPrivate ? 'private' : 'public';
                    $loggedActions[] = "updated incident visibility to: {$visibility}";
                }
            }

            $incident->save();

            // Log activity for updates
            foreach ($loggedActions as $actionLog) {
                activity()
                    ->performedOn($incident)
                    ->causedBy($user)
                    ->withProperties(['estate_id' => $incident->estate_id, 'status' => $incident->status->value])
                    ->log($actionLog);
            }

            // Notify the reporter if status changed
            if (isset($newStatus) && $incident->reporter) {
                $incident->reporter->notify(new IncidentStatusUpdatedNotification($incident));
            }

            return $incident;
        });
    }
}
