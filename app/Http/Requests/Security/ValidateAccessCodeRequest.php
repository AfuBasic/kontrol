<?php

namespace App\Http\Requests\Security;

use Illuminate\Foundation\Http\FormRequest;

class ValidateAccessCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'min:4', 'max:20'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.required' => 'Please enter an access code.',
            'code.min' => 'Access code must be at least 4 characters.',
            'code.max' => 'Access code must not exceed 20 characters.',
        ];
    }
}
