<?php

namespace App\Http\Requests\Admin;

use App\Rules\NotReservedRoleName;
use App\Services\Admin\RoleService;
use App\Services\EstateContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Prevent updating reserved roles
        $roleService = app(RoleService::class);

        return ! $roleService->isReservedRole($this->route('role')->name);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $estateId = resolve(EstateContextService::class)->getEstateId();
        $roleId = $this->route('role')->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                new NotReservedRoleName,
                Rule::unique('roles', 'name')
                    ->where('estate_id', $estateId)
                    ->ignore($roleId),
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
