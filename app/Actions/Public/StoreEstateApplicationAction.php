<?php

namespace App\Actions\Public;

use App\Models\EstateApplication;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class StoreEstateApplicationAction
{
    /**
     * Validate and store a new estate application.
     *
     * @param array<string, mixed> $data
     * @throws ValidationException
     */
    public function execute(array $data): EstateApplication
    {
        $validated = Validator::make($data, [
            'estate_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['required', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ], [
            'estate_name.required' => 'Please enter your estate name.',
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please enter a valid email address.',
            'phone.required' => 'Please enter a contact phone number.',
        ])->validate();

        return EstateApplication::create([
            'estate_name' => $validated['estate_name'],
            'email' => $validated['email'],
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
        ]);
    }
}
