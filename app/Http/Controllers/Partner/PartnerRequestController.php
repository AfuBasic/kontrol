<?php

namespace App\Http\Controllers\Partner;

use App\Actions\Public\StoreEstateApplicationAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Partner\StorePartnerRequestRequest;
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

        $applications = EstateApplication::query()
            ->when($partnerId, fn ($query) => $query->forPartner($partnerId))
            ->when(! $partnerId, fn ($query) => $query->whereRaw('1 = 0'))
            ->with('estate:id,ulid,name,status')
            ->latest()
            ->get()
            ->map(fn (EstateApplication $application) => $this->transformForPartner($application))
            ->values();

        $columns = [
            ['key' => 'submitted', 'label' => 'Submitted'],
            ['key' => 'reviewing', 'label' => 'Reviewing'],
            ['key' => 'info_requested', 'label' => 'Info Requested'],
            ['key' => 'approved', 'label' => 'Approved'],
            ['key' => 'estate_created', 'label' => 'Estate Created'],
            ['key' => 'rejected', 'label' => 'Rejected'],
        ];

        return Inertia::render('Partner/PartnerRequests/Index', [
            'partnerRequests' => $applications,
            'columns' => $columns,
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
            'status' => $application->partnerStatusKey(),
            'status_label' => $application->partnerStatusLabel(),
            'rejection_reason' => $application->rejection_reason,
            'info_request_message' => $application->info_request_message,
            'created_at' => $application->created_at?->toIso8601String(),
            'updated_at' => $application->updated_at?->toIso8601String(),
            'estate' => $application->estate ? [
                'ulid' => $application->estate->ulid,
                'name' => $application->estate->name,
                'status' => $application->estate->status,
            ] : null,
        ];
    }
}
