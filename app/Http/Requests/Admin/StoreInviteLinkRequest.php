<?php

namespace App\Http\Requests\Admin;

use App\Services\EstateContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInviteLinkRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('residents.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $estate = app(EstateContextService::class)->getEstate();

        return [
            'max_usages' => ['nullable', 'integer', 'min:0'],
            'requires_approval' => ['boolean'],
            'expires_at' => ['nullable', 'date', 'after:today'],
            'zone_id' => ['nullable', 'integer', Rule::exists('zones', 'id')->where('estate_id', $estate->id)],
        ];
    }
}
