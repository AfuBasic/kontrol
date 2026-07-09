<?php

namespace App\Actions\Public;

use App\Mail\EstateApplicationReceivedMail;
use App\Models\Estate;
use App\Models\EstateApplication;
use App\Models\ZeusNotification;
use App\Notifications\Zeus\PartnerEstateRequestSubmittedNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class StoreEstateApplicationAction
{
    /**
     * Validate and store a new estate application (public or partner).
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function execute(array $data): EstateApplication
    {
        $source = $data['source'] ?? EstateApplication::SOURCE_PUBLIC;

        $validated = Validator::make($data, [
            'estate_name' => ['required', 'string', 'max:255'],
            'contact_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'state' => ['nullable', 'string', 'max:100'],
            'lga' => ['nullable', 'string', 'max:100'],
            'number_of_houses' => ['nullable', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'partner_id' => ['nullable', 'integer', 'exists:partners,id'],
            'source' => ['nullable', 'in:public,partner'],
        ], [
            'estate_name.required' => 'Please enter the estate name.',
            'contact_name.required' => 'Please enter the contact person name.',
            'email.required' => 'Please enter a contact email address.',
            'email.email' => 'Please enter a valid email address.',
            'phone.required' => 'Please enter a contact phone number.',
        ])->validate();

        $source = $validated['source'] ?? $source;
        $estateName = trim($validated['estate_name']);
        $email = strtolower(trim($validated['email']));
        $phone = trim($validated['phone']);

        $this->assertUniqueOpenApplication($estateName, $email, $phone);
        $this->assertNotExistingEstate($estateName, $email);

        $application = EstateApplication::create([
            'source' => $source,
            'partner_id' => $validated['partner_id'] ?? null,
            'estate_name' => $estateName,
            'contact_name' => $validated['contact_name'],
            'email' => $email,
            'phone' => $phone,
            'address' => $validated['address'] ?? null,
            'state' => $validated['state'] ?? null,
            'lga' => $validated['lga'] ?? null,
            'number_of_houses' => $validated['number_of_houses'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'status' => 'received',
        ]);

        if ($application->isPartnerSourced()) {
            $this->notifyZeusOfPartnerApplication($application);
        } else {
            Mail::to($application->email)->send(new EstateApplicationReceivedMail($application));
        }

        return $application;
    }

    /**
     * @throws ValidationException
     */
    private function assertUniqueOpenApplication(string $estateName, string $email, string $phone): void
    {
        $existing = EstateApplication::query()
            ->open()
            ->where(function ($query) use ($estateName, $email, $phone) {
                $query->whereRaw('LOWER(estate_name) = ?', [strtolower($estateName)])
                    ->orWhere('email', $email)
                    ->orWhere('phone', $phone);
            })
            ->first();

        if (! $existing) {
            return;
        }

        if (strtolower($existing->estate_name) === strtolower($estateName)) {
            throw ValidationException::withMessages([
                'estate_name' => 'An open application already exists for this estate name.',
            ]);
        }

        if ($existing->email === $email) {
            throw ValidationException::withMessages([
                'email' => 'An open application already exists for this email address.',
            ]);
        }

        throw ValidationException::withMessages([
            'phone' => 'An open application already exists for this phone number.',
        ]);
    }

    /**
     * @throws ValidationException
     */
    private function assertNotExistingEstate(string $estateName, string $email): void
    {
        $estateExists = Estate::query()
            ->where(function ($query) use ($estateName, $email) {
                $query->whereRaw('LOWER(name) = ?', [strtolower($estateName)])
                    ->orWhere('email', $email);
            })
            ->exists();

        if ($estateExists) {
            throw ValidationException::withMessages([
                'estate_name' => 'This estate or contact is already registered on Kontrol.',
            ]);
        }
    }

    private function notifyZeusOfPartnerApplication(EstateApplication $application): void
    {
        $application->loadMissing('partner');
        $partnerName = $application->partner?->name ?? 'A partner';

        ZeusNotification::notify(
            type: 'partner_estate_request',
            title: 'New partner estate request',
            body: "{$partnerName} submitted {$application->estate_name} for review.",
            actionUrl: route('zeus.applications.index'),
            data: [
                'estate_application_id' => $application->id,
                'partner_id' => $application->partner_id,
                'estate_name' => $application->estate_name,
            ],
        );

        Notification::route('mail', config('zeus.notification_email', 'support@usekontrol.com'))
            ->notify(new PartnerEstateRequestSubmittedNotification($application));
    }
}
