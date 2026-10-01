<?php

namespace App\Actions\Security;

use App\Actions\Visitor\ResolveVisitorIdentityAction;
use App\Models\AccessLog;
use App\Models\EstateOrganization;
use App\Models\User;
use App\Services\Security\CheckpointClaimService;
use App\Services\Visitor\TagGeneratorService;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordQuickEntryAction
{
    public function __construct(
        private ResolveVisitorIdentityAction $resolveVisitorIdentity,
        private TagGeneratorService $tagGenerator,
    ) {}

    /**
     * @param  array{
     *     tag?: string|null,
     *     visitor_name?: string|null,
     *     id_photo?: UploadedFile|null,
     *     organization_id: int,
     *     vehicle_plate_number?: string|null,
     *     vehicle_make?: string|null,
     *     vehicle_model?: string|null,
     *     verified_at?: string|\DateTimeInterface|null,
     *     entry_point?: string|null,
     * }  $data
     */
    public function execute(
        int $estateId,
        User $verifiedBy,
        array $data
    ): AccessLog {
        // Offline entries send their admission time in UTC; window checks need app-local time.
        $timestamp = isset($data['verified_at'])
            ? CarbonImmutable::parse($data['verified_at'])->setTimezone(config('app.timezone'))
            : now();

        $entryPoint = $data['entry_point'] ?? app(CheckpointClaimService::class)->getCurrentCheckpoint($estateId, $verifiedBy);

        // Offline, the gate device issues the tag and the visitor leaves holding it, so it must be
        // recorded as-is. Online entries send no tag and get one generated here.
        if (! empty($data['tag'])) {
            $tag = strtoupper(trim($data['tag']));

            if ($this->tagGenerator->isInUse($estateId, $tag)) {
                throw ValidationException::withMessages([
                    'tag' => ["Tag {$tag} is already held by a visitor who has not checked out."],
                ]);
            }
        } else {
            $tag = $this->tagGenerator->generateUnique($estateId);
        }

        $idPhotoFile = $data['id_photo'] ?? null;
        $visitorName = ! empty($data['visitor_name']) ? trim($data['visitor_name']) : null;

        return DB::transaction(function () use ($estateId, $verifiedBy, $data, $tag, $timestamp, $entryPoint, $idPhotoFile, $visitorName) {
            $organization = EstateOrganization::where('estate_id', $estateId)
                ->where('id', $data['organization_id'])
                ->firstOrFail();

            if (! $organization->is_active || ! $organization->quick_entry_enabled) {
                throw ValidationException::withMessages([
                    'organization_id' => ['Quick entry is currently disabled for this organization.'],
                ]);
            }

            // Closed means no entry. Judge at the admission time so offline entries synced later
            // are held to the rule that applied when the guard admitted them.
            if (! $organization->acceptsWalkInsAt($timestamp)) {
                throw ValidationException::withMessages([
                    'organization_id' => ["{$organization->name} is closed to walk-ins right now. No entry."],
                ]);
            }

            // The guard photographs the visitor's ID for every walk-in.
            $visitorProfile = $this->resolveVisitorIdentity->execute($visitorName, $idPhotoFile, $estateId);
            $displayName = $visitorProfile->name;

            $log = AccessLog::create([
                'estate_id' => $estateId,
                'organization_id' => $organization->id,
                'visitor_profile_id' => $visitorProfile->id,
                'entry_point' => $entryPoint,
                'access_code_id' => null,
                'verified_by' => $verifiedBy->id,
                'verified_at' => $timestamp,
                'vehicle_make' => $data['vehicle_make'] ?? null,
                'vehicle_model' => $data['vehicle_model'] ?? null,
                'vehicle_plate_number' => $data['vehicle_plate_number'] ?? null,
                'meta' => [
                    'entry_type' => 'quick_entry',
                    'tag' => $tag,
                    'organization_id' => $organization->id,
                    'organization_name' => $organization->name,
                    'organization_type' => $organization->type,
                    'admission_basis' => $organization->access_policy,
                    'visitor_name' => $displayName,
                    'visitor_profile_id' => $visitorProfile->id,
                    'entry_point' => $entryPoint,
                ],
            ]);

            activity('access')
                ->causedBy($verifiedBy)
                ->withProperties([
                    'visitor_name' => $displayName,
                    'tag' => $tag,
                    'organization' => $organization->name,
                    'visitor_profile_id' => $visitorProfile->id,
                ])
                ->log("Quick Entry admitted for {$organization->name} (Tag: {$tag})");

            return $log;
        });
    }
}
