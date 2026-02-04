<?php

namespace App\Http\Requests\Admin;

use App\Rules\NotReservedRoleName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Services\EstateContextService;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $estateId = resolve(EstateContextService::class)->getEstateId();

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                new NotReservedRoleName,
                Rule::unique('roles', 'name')->where('estate_id', $estateId),
            ],
            'permissions' => ['array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please provide a name for the role.',
            'name.max' => 'The role name cannot exceed 255 characters.',
            'name.unique' => 'A role with this name already exists in your estate.',
        ];
    }


}
