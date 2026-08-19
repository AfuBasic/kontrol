<?php

namespace App\Http\Requests\Resident;

use App\Models\HouseholdMember;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreHouseholdMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $primaryResidentId = $this->user()?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email:rfc,dns',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail) use ($primaryResidentId): void {
                    $email = strtolower(trim($value));

                    /** Check if email already belongs to one of this resident's household members. */
                    $existingMember = User::where('email', $email)->first();
                    if ($existingMember) {
                        $alreadyInHousehold = HouseholdMember::where('primary_resident_id', $primaryResidentId)
                            ->where('household_member_id', $existingMember->id)
                            ->exists();

                        if ($alreadyInHousehold) {
                            $fail('This person is already a member of your household.');

                            return;
                        }
                    }

                    /** Prevent adding yourself as a household member. */
                    if ($existingMember && $existingMember->id === $primaryResidentId) {
                        $fail('You cannot add yourself as a household member.');
                    }
                },
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Please provide an email address.',
            'email.email' => 'Please enter a valid email address.',
        ];
    }
}
