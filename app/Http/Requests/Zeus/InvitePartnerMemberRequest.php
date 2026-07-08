<?php

namespace App\Http\Requests\Zeus;

use Illuminate\Foundation\Http\FormRequest;

class InvitePartnerMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'This email is already registered in the system.',
        ];
    }
}
