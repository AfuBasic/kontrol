<?php

namespace App\Http\Requests\Partner;

use Illuminate\Foundation\Http\FormRequest;

class StorePartnerRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'estate_name' => ['required', 'string', 'max:255'],
            'estate_address' => ['nullable', 'string', 'max:500'],
            'chairman_name' => ['required', 'string', 'max:255'],
            'chairman_phone' => ['required', 'string', 'max:20'],
            'chairman_email' => ['required', 'email', 'max:255'],
            'number_of_houses' => ['nullable', 'integer', 'min:1'],
            'state' => ['nullable', 'string', 'max:100'],
            'lga' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
