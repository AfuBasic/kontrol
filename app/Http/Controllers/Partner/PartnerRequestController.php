<?php

namespace App\Http\Controllers\Partner;

use App\Actions\Public\StoreEstateApplicationAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Partner\StorePartnerRequestRequest;
use App\Models\ApplicationNote;
use App\Models\ApplicationTimeline;
use App\Models\EstateApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PartnerRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $partnerId = $request->user()->partner_id;
        $partner = $request->user()->partner;

        $applications = EstateApplication::query()
            ->when($partnerId, fn ($query) => $query->forPartner($partnerId))
            ->when(! $partnerId, fn ($query) => $query->whereRaw('1 = 0'))
            ->with([
                'estate:id,ulid,name,status',
                'assignedTo:id,name',
                'timelineEvents' => fn ($query) => $query->latest(),
                'notesList' => fn ($query) => $query->latest(),
            ])
            ->latest()
            ->get()
            ->map(fn (EstateApplication $application) => $this->transformForPartner($application))
            ->values();

        $columns = [
            ['key' => 'submitted', 'label' => 'Submitted'],
            ['key' => 'reviewing', 'label' => 'Under Review'],
            ['key' => 'info_requested', 'label' => 'Info Requested'],
            ['key' => 'approved', 'label' => 'Approved'],
            ['key' => 'estate_created', 'label' => 'Activated'],
            ['key' => 'rejected', 'label' => 'Rejected'],
        ];

        return Inertia::render('Partner/PartnerRequests/Index', [
            'partnerRequests' => $applications,
            'columns' => $columns,
            'commission' => [
                'rate' => $partner?->commission_rate !== null ? (string) $partner->commission_rate : null,
                'type' => $partner?->commission_type,
            ],
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $partner = $request->user()->partner;

        return Inertia::render('Partner/PartnerEstate', [
            'partner' => $partner ? [
                'id' => $partner->id,
                'name' => $partner->name,
                'commission_rate' => $partner->commission_rate !== null
                    ? (string) $partner->commission_rate
                    : null,
                'commission_type' => $partner->commission_type,
            ] : null,
        ]);
    }

    public function store(
        StorePartnerRequestRequest $request,
        StoreEstateApplicationAction $storeApplication,
    ): RedirectResponse {
        $user = $request->user();

        abort_unless($user->partner_id, 403, 'Your account is not linked to a partner organization.');

        $validated = $request->validated();

        try {
            $storeApplication->execute([
                'source' => EstateApplication::SOURCE_PARTNER,
                'partner_id' => $user->partner_id,
                'estate_name' => $validated['estate_name'],
                'contact_name' => $validated['chairman_name'],
                'email' => $validated['chairman_email'],
                'phone' => $validated['chairman_phone'],
                'address' => $validated['estate_address'] ?? null,
                'state' => $validated['state'] ?? null,
                'lga' => $validated['lga'] ?? null,
                'number_of_houses' => $validated['number_of_houses'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
        } catch (ValidationException $exception) {
            $errors = $exception->errors();

            // Map unified field names back to partner form keys.
            if (isset($errors['contact_name'])) {
                $errors['chairman_name'] = $errors['contact_name'];
                unset($errors['contact_name']);
            }
            if (isset($errors['email'])) {
                $errors['chairman_email'] = $errors['email'];
                unset($errors['email']);
            }
            if (isset($errors['phone'])) {
                $errors['chairman_phone'] = $errors['phone'];
                unset($errors['phone']);
            }

            throw ValidationException::withMessages($errors);
        }

        return redirect()
            ->route('partner.partner-requests.index')
            ->with('success', 'Partner request submitted successfully. Our team will review it shortly.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transformForPartner(EstateApplication $application): array
    {
        $statusKey = $application->partnerStatusKey();
        $isGenerating = $statusKey === 'estate_created'
            && $application->estate
            && in_array($application->estate->status, ['active', 'live', 'trial'], true);

        $timeline = $application->timelineEvents
            ->map(fn (ApplicationTimeline $event) => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'description' => $event->description,
                'creator_name' => $event->creator_name,
                'created_at' => $event->created_at?->toIso8601String(),
                'metadata' => $event->metadata,
            ])
            ->values()
            ->all();

        // Synthetic baseline when no audit trail yet.
        if ($timeline === []) {
            $timeline = $this->syntheticTimeline($application, $statusKey);
        }

        $notes = $application->notesList
            ->map(fn (ApplicationNote $note) => [
                'id' => $note->id,
                'body' => $note->body,
                'type' => $note->type,
                'creator_name' => $note->creator_name,
                'created_at' => $note->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();

        return [
            'id' => $application->id,
            'estate_name' => $application->estate_name,
            'estate_address' => $application->address,
            'chairman_name' => $application->contact_name,
            'chairman_email' => $application->email,
            'chairman_phone' => $application->phone,
            'number_of_houses' => $application->number_of_houses,
            'state' => $application->state,
            'lga' => $application->lga,
            'notes' => $application->notes,
            'status' => $statusKey,
            'status_label' => $application->partnerStatusLabel(),
            'is_generating_revenue' => $isGenerating,
            'rejection_reason' => $application->rejection_reason,
            'info_request_message' => $application->info_request_message,
            'challenges' => $application->challenges,
            'reviewed_at' => $application->reviewed_at?->toIso8601String(),
            'created_at' => $application->created_at?->toIso8601String(),
            'updated_at' => $application->updated_at?->toIso8601String(),
            'assigned_manager' => $application->assignedTo ? [
                'name' => $application->assignedTo->name,
            ] : null,
            'estate' => $application->estate ? [
                'ulid' => $application->estate->ulid,
                'name' => $application->estate->name,
                'status' => $application->estate->status,
            ] : null,
            'timeline' => $timeline,
            'admin_notes' => $notes,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function syntheticTimeline(EstateApplication $application, string $statusKey): array
    {
        $events = [
            [
                'id' => 'synth-submitted',
                'event_type' => 'submitted',
                'description' => 'Estate submitted for review',
                'creator_name' => 'Partner',
                'created_at' => $application->created_at?->toIso8601String(),
                'metadata' => null,
            ],
        ];

        if (in_array($statusKey, ['reviewing', 'info_requested', 'approved', 'estate_created'], true)) {
            $events[] = [
                'id' => 'synth-review',
                'event_type' => 'review_started',
                'description' => 'Review started by Kontrol',
                'creator_name' => 'Kontrol',
                'created_at' => $application->reviewed_at?->toIso8601String()
                    ?? $application->updated_at?->toIso8601String(),
                'metadata' => null,
            ];
        }

        if ($statusKey === 'info_requested' || $application->info_request_message) {
            $events[] = [
                'id' => 'synth-info',
                'event_type' => 'info_requested',
                'description' => $application->info_request_message
                    ?: 'Additional information requested',
                'creator_name' => 'Kontrol',
                'created_at' => $application->updated_at?->toIso8601String(),
                'metadata' => null,
            ];
        }

        if (in_array($statusKey, ['approved', 'estate_created'], true)) {
            $events[] = [
                'id' => 'synth-approved',
                'event_type' => 'approved',
                'description' => 'Estate application approved',
                'creator_name' => 'Kontrol',
                'created_at' => $application->reviewed_at?->toIso8601String()
                    ?? $application->updated_at?->toIso8601String(),
                'metadata' => null,
            ];
        }

        if ($statusKey === 'estate_created' && $application->estate) {
            $events[] = [
                'id' => 'synth-created',
                'event_type' => 'estate_created',
                'description' => 'Live estate created: '.$application->estate->name,
                'creator_name' => 'Kontrol',
                'created_at' => $application->updated_at?->toIso8601String(),
                'metadata' => null,
            ];
        }

        if ($statusKey === 'rejected') {
            $events[] = [
                'id' => 'synth-rejected',
                'event_type' => 'rejected',
                'description' => $application->rejection_reason ?: 'Application rejected',
                'creator_name' => 'Kontrol',
                'created_at' => $application->reviewed_at?->toIso8601String()
                    ?? $application->updated_at?->toIso8601String(),
                'metadata' => null,
            ];
        }

        return $events;
    }
}
