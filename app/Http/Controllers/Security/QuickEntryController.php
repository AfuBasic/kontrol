<?php

namespace App\Http\Controllers\Security;

use App\Actions\Security\CheckoutQuickEntryAction;
use App\Actions\Security\RecordQuickEntryAction;
use App\Models\AccessLog;
use App\Models\EstateOrganization;
use App\Models\VisitorProfile;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class QuickEntryController
{
    public function __construct(
        private RecordQuickEntryAction $recordAction,
        private CheckoutQuickEntryAction $checkoutAction,
    ) {}

    /**
     * Log a quick entry admission.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $estateId = $request->attributes->get('estate_id');

        $validated = $request->validate([
            'tag' => ['nullable', 'string', 'size:4', 'alpha_num'],
            'organization_id' => ['required', Rule::exists('estate_organizations', 'id')->where('estate_id', $estateId)],
            'visitor_name' => ['nullable', 'string', 'max:255'],
            'id_photo' => ['required', 'image', 'max:5120'],
            'vehicle_plate_number' => ['nullable', 'string', 'max:20'],
            'vehicle_make' => ['nullable', 'string', 'max:50'],
            'vehicle_model' => ['nullable', 'string', 'max:50'],
            'entry_point' => ['nullable', 'string', 'max:100'],
        ], [
            'id_photo.required' => "Take a photo of the visitor's ID before admitting them.",
        ]);

        // Ensure the org belongs to this estate; open/closed is enforced by the action.
        $organization = EstateOrganization::where('estate_id', $estateId)
            ->where('id', $validated['organization_id'])
            ->firstOrFail();

        $log = $this->recordAction->execute($estateId, $user, $validated);

        $isReturning = $log->meta['visitor_profile_id'] !== null
            && VisitorProfile::find($log->meta['visitor_profile_id'])?->visit_count > 1;

        return response()->json([
            'success' => true,
            'tag' => $log->meta['tag'],
            'visitor_name' => $log->meta['visitor_name'],
            'visitor_profile_id' => $log->meta['visitor_profile_id'],
            'organization_name' => $organization->name,
            'entry_type' => $log->meta['entry_type'],
            'is_returning_visitor' => $isReturning,
            'verified_at' => $log->verified_at,
            'entry_point' => $log->entry_point,
        ]);
    }

    /**
     * Sync offline quick entry logs.
     */
    public function sync(Request $request): JsonResponse
    {
        $user = $request->user();
        $estateId = $request->attributes->get('estate_id');

        $validated = $request->validate([
            'logs' => ['required', 'array', 'min:1'],
            'logs.*.tag' => ['required', 'string', 'max:4'],
            'logs.*.organization_id' => ['required', 'integer', 'exists:estate_organizations,id'],
            'logs.*.visitor_name' => ['nullable', 'string', 'max:255'],
            'logs.*.verified_at' => ['nullable', 'string'],
            'logs.*.vehicle_plate_number' => ['nullable', 'string', 'max:20'],
            'logs.*.vehicle_make' => ['nullable', 'string', 'max:50'],
            'logs.*.vehicle_model' => ['nullable', 'string', 'max:50'],
            // ID photo captured offline, as a base64 image data URL.
            'logs.*.id_photo' => ['required', 'string', 'max:7000000'],
        ]);

        $syncedCount = 0;
        $errors = [];

        foreach ($validated['logs'] as $index => $logData) {
            try {
                $organization = EstateOrganization::where('estate_id', $estateId)
                    ->where('id', $logData['organization_id'])
                    ->firstOrFail();

                $logData['id_photo'] = $this->photoFromDataUrl($logData['id_photo']);

                $this->recordAction->execute($estateId, $user, $logData);
                $syncedCount++;
            } catch (\Throwable $e) {
                $errors[] = ['index' => $index, 'tag' => $logData['tag'], 'error' => $e->getMessage()];
            }
        }

        return response()->json([
            'success' => $syncedCount > 0,
            'synced_count' => $syncedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Look up an active quick entry visitor by tag.
     */
    public function lookup(Request $request): JsonResponse
    {
        $estateId = $request->attributes->get('estate_id');

        $request->validate([
            'tag' => ['required', 'string', 'max:4'],
        ]);

        $tag = strtoupper($request->input('tag'));

        $log = AccessLog::withoutGlobalScopes()
            ->where('estate_id', $estateId)
            ->whereNull('access_code_id')
            ->where('meta->entry_type', 'quick_entry')
            ->where('meta->tag', $tag)
            ->whereNull('checked_out_at')
            ->latest('verified_at')
            ->first();

        if (! $log) {
            return response()->json([
                'found' => false,
                'tag' => $tag,
            ]);
        }

        return response()->json([
            'found' => true,
            'tag' => $log->meta['tag'],
            'visitor_name' => $log->meta['visitor_name'],
            'organization_name' => $log->meta['organization_name'] ?? null,
            'verified_at' => $log->verified_at?->toIso8601String(),
            'entry_point' => $log->entry_point,
            // Lets the guard match the car at the exit.
            'vehicle_plate_number' => $log->vehicle_plate_number,
        ]);
    }

    /**
     * Checkout a quick entry visitor by tag.
     */
    public function checkout(Request $request): JsonResponse
    {
        $user = $request->user();
        $estateId = $request->attributes->get('estate_id');

        $validated = $request->validate([
            'tag' => ['required', 'string', 'max:4'],
        ]);

        try {
            $log = $this->checkoutAction->execute($validated['tag'], $estateId, $user);
        } catch (ModelNotFoundException) {
            throw ValidationException::withMessages([
                'tag' => ['No visitor inside with tag '.strtoupper($validated['tag']).'.'],
            ]);
        }

        return response()->json([
            'success' => true,
            'tag' => $log->meta['tag'],
            'visitor_name' => $log->meta['visitor_name'],
            'checked_out_at' => $log->checked_out_at,
            'exit_point' => $log->meta['exit_point'] ?? null,
        ]);
    }

    /**
     * Turn an offline-captured "data:image/...;base64,..." photo into an uploaded file.
     */
    private function photoFromDataUrl(string $dataUrl): UploadedFile
    {
        if (! preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s', $dataUrl, $matches)) {
            throw ValidationException::withMessages(['id_photo' => ['The ID photo is not a valid image.']]);
        }

        $binary = base64_decode($matches[2], true);
        if ($binary === false || strlen($binary) > 5 * 1024 * 1024) {
            throw ValidationException::withMessages(['id_photo' => ['The ID photo is invalid or larger than 5 MB.']]);
        }

        $path = tempnam(sys_get_temp_dir(), 'qe-id-');
        file_put_contents($path, $binary);

        return new UploadedFile($path, 'id-photo.'.$matches[1], 'image/'.$matches[1], null, true);
    }
}
