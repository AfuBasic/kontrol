<?php

namespace App\Actions\Security;

use App\Actions\Visitor\ResolveVisitorIdentityAction;
use App\Models\AccessLog;
use App\Models\EstateOrganization;
use App\Models\EstateSettings;
use App\Models\User;
use App\Services\Visitor\TagGeneratorService;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ReserveQuickEntryAction
{
    public function __construct(
        private TagGeneratorService $tagGenerator,
        private ResolveVisitorIdentityAction $resolveVisitorIdentity,
    ) {}

    /**
     * @param  array{
     *     organization_id: int,
     *     visitor_name?: string|null,
     *     vehicle_plate_number?: string|null,
     *     vehicle_make?: string|null,
     *     vehicle_model?: string|null,
     *     arrival_in_minutes?: int|null,
     *     id_photo?: UploadedFile|null,
     * }  $data
     */
    public function execute(
        int $estateId,
        User $requestedBy,
        array $data,
        EstateOrganization $organization
    ): AccessLog {
        $arrivalInMinutes = $data['arrival_in_minutes'] ?? null;
        $settings = EstateSettings::forEstate($estateId);

        $arrivalDeadline = $arrivalInMinutes
            ? CarbonImmutable::now()->addMinutes($arrivalInMinutes)
            : CarbonImmutable::now()->addMinutes($settings->quick_entry_expected_arrival_minutes);

        $expiresAt = CarbonImmutable::now()->addHours(4);

        $tag = $this->tagGenerator->generateUnique($estateId);

        $idPhotoFile = $data['id_photo'] ?? null;
        $visitorName = ! empty($data['visitor_name']) ? trim($data['visitor_name']) : null;

        if ($organization->hasPublicWindows()) {
            $expiresAt = CarbonImmutable::now()->addMinutes(15);
        }

        $idPhotoFile = $data['id_photo'] ?? null;

        $visitorProfile = $idPhotoFile
            ? $this->resolveVisitorIdentity->execute($visitorName, $idPhotoFile, $estateId)
            : null;

        $meta = [
            'entry_type' => 'quick_entry',
            'tag' => $tag,
            'status' => 'reserved',
            'arrival_deadline' => $arrivalDeadline->toIso8601String(),
            'expires_at' => $expiresAt->toIso8601String(),
            'organization_id' => $organization->id,
            'organization_name' => $organization->name,
            'organization_type' => $organization->type,
            'admission_basis' => $organization->access_policy,
            'visitor_name' => $visitorProfile?->name ?? ($visitorName ?? 'Unknown Visitor'),
            'visitor_profile_id' => $visitorProfile?->id,
            'expected_arrival_minutes' => $arrivalInMinutes ?? $settings->quick_entry_expected_arrival_minutes,
        ];

        return DB::transaction(function () use ($estateId, $requestedBy, $organization, $tag, $data, $meta, $visitorProfile) {
            $log = AccessLog::create([
                'estate_id' => $estateId,
                'organization_id' => $organization->id,
                'visitor_profile_id' => $visitorProfile?->id,
                'entry_point' => $data['entry_point'] ?? null,
                'verified_by' => $requestedBy->id,
                'verified_at' => now(),
                'vehicle_make' => $data['vehicle_make'] ?? null,
                'vehicle_model' => $data['vehicle_model'] ?? null,
                'vehicle_plate_number' => $data['vehicle_plate_number'] ?? null,
                'meta' => $meta,
            ]);

            activity('access')
                ->causedBy($requestedBy)
                ->withProperties([
                    'visitor_name' => $meta['visitor_name'],
                    'tag' => $tag,
                    'organization' => $organization->name,
                ])
                ->log("Quick Entry reserved for {$organization->name} (Tag: {$tag})");

            return $log;
        });
    }

    /**
     * Confirm a visitor's arrival by tag.
     */
    public function confirmArrival(string $tag, int $estateId, User $confirmedBy): AccessLog
    {
        return DB::transaction(function () use ($tag, $estateId, $confirmedBy) {
            $log = AccessLog::withoutGlobalScopes()
                ->where('estate_id', $estateId)
                ->whereNull('access_code_id')
                ->where('meta->entry_type', 'quick_entry')
                ->where('meta->tag', strtoupper($tag))
                ->whereNull('checked_out_at')
                ->where('meta->status', 'reserved')
                ->firstOrFail();

            $updatedMeta = $log->meta;
            $updatedMeta['status'] = 'confirmed';
            $updatedMeta['arrival_confirmed_at'] = now()->toIso8601String();
            $updatedMeta['arrival_confirmed_by'] = $confirmedBy->id;

            $log->update(['meta' => $updatedMeta]);

            activity('access')
                ->causedBy($confirmedBy)
                ->withProperties(['tag' => $tag])
                ->log("Arrival confirmed for tag {$tag}");

            return $log->fresh();
        });
    }

    /**
     * Cancel an active reservation by tag.
     */
    public function cancelReservation(string $tag, int $estateId, User $cancelledBy): AccessLog
    {
        return DB::transaction(function () use ($tag, $estateId, $cancelledBy) {
            $log = AccessLog::withoutGlobalScopes()
                ->where('estate_id', $estateId)
                ->where('meta->entry_type', 'quick_entry')
                ->where('meta->tag', strtoupper($tag))
                ->whereNull('checked_out_at')
                ->where('meta->status', 'reserved')
                ->firstOrFail();

            $updatedMeta = $log->meta;
            $updatedMeta['status'] = 'cancelled';
            $updatedMeta['cancelled_at'] = now()->toIso8601String();
            $updatedMeta['cancelled_by'] = $cancelledBy->id;

            $log->update(['meta' => $updatedMeta]);

            activity('access')
                ->causedBy($cancelledBy)
                ->withProperties(['tag' => $tag])
                ->log("Quick Entry reservation cancelled for tag {$tag}");

            return $log->fresh();
        });
    }
}
