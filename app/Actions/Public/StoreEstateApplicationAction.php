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
        // First validate the input data
        $validated = Validator::make($data, [
            'estate_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'plan_id' => ['nullable', 'exists:plans,id'],
        ], [
            'estate_name.required' => 'Please enter your estate name.',
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please enter a valid email address.',
            'phone.required' => 'Please enter a contact phone number.',
            'plan_id.exists' => 'The selected plan does not exist.',
        ])->validate();

        // Check if an application with any of these identifiers already exists
        $existingApplication = EstateApplication::query()
            ->where(function ($query) use ($validated) {
                $query->where('email', $validated['email'])
                    ->orWhere('estate_name', $validated['estate_name'])
                    ->orWhere('phone', $validated['phone']);
            })
            ->first();

        // If there's an existing application
        if ($existingApplication) {
            // If it's already pending, reject the submission
            if ($existingApplication->status === 'pending') {
                throw ValidationException::withMessages([
                    'email' => 'An application for this email address already exists.',
                ]);
            }

            // If it's rejected or contacted, update it back to pending and return
            $existingApplication->update([
                'estate_name' => $validated['estate_name'],
                'email' => $validated['email'],
                'address' => $validated['address'] ?? null,
                'phone' => $validated['phone'],
                'notes' => $validated['notes'] ?? null,
                'plan_id' => $validated['plan_id'] ?? null,
                'status' => 'pending',
                'reviewed_at' => null,
            ]);

            // Send confirmation email (queued, non-blocking)
            Mail::to($existingApplication->email)->send(new EstateApplicationReceivedMail($existingApplication));

            return $existingApplication;
        }

        // Create new application if no duplicates exist
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
