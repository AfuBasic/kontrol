<?php

namespace App\Rules;

use Closure;
use Database\Seeders\RoleSeeder;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class NotReservedRoleName implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $reservedRoles = array_map('strtolower', RoleSeeder::RESERVED_ROLES);

        if (in_array(strtolower($value), $reservedRoles)) {
            $fail('This role name is reserved by the system and cannot be used.');
        }
    }
}
