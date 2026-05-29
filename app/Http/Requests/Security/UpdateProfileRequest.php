<?php

namespace App\Http\Requests\Security;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'current_password' => ['required_with:password', 'nullable', 'string', 'current_password'],
            'password' => ['nullable', 'string', Password::defaults(), 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter your name.',
            'name.max' => 'Name must not exceed 255 characters.',
            'current_password.required_with' => 'Please enter your current password to set a new password.',
            'current_password.current_password' => 'The current password you entered is incorrect.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }
}
