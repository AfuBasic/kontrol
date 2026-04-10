<?php

namespace App\Actions\Public;

use App\Mail\EstateApplicationReceivedMail;
use App\Models\EstateApplication;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class StoreEstateApplicationAction
{
    /**
     * Validate and store a new estate application.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ValidationException
     */
    public function execute(array $data): EstateApplication
    {
        $validated = Validator::make($data, [
            'estate_name' => ['required', 'string', 'max:255', 'unique:estate_applications,estate_name'],
            'email' => ['required', 'email', 'max:255', 'unique:estate_applications,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:estate_applications,phone'],
            'address' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'plan_id' => ['nullable', 'exists:plans,id'],
        ], [
            'estate_name.required' => 'Please enter your estate name.',
            'estate_name.unique' => 'An application for this estate name already exists.',
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'An application for this email address already exists.',
            'phone.required' => 'Please enter a contact phone number.',
            'phone.unique' => 'An application for this phone number already exists.',
            'plan_id.exists' => 'The selected plan does not exist.',
        ])->validate();

        $application = EstateApplication::create([
            'estate_name' => $validated['estate_name'],
            'email' => $validated['email'],
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'],
            'notes' => $validated['notes'] ?? null,
            'plan_id' => $validated['plan_id'] ?? null,
            'status' => 'pending',
        ]);

        // Send confirmation email (queued, non-blocking)
        Mail::to($application->email)->send(new EstateApplicationReceivedMail($application));

        return $application;
    }
}
