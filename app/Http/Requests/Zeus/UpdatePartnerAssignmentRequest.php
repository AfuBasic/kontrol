<?php

namespace App\Http\Requests\Zeus;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePartnerAssignmentRequest extends FormRequest
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
            'partner_id' => ['nullable', 'exists:partners,id'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
