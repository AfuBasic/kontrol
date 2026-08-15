<?php

namespace App\Casts;

use App\Enums\IncidentCategory;
use App\Support\IncidentCategoryVal;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class IncidentCategoryCast implements CastsAttributes
{
    /**
     * Cast the given value.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): ?IncidentCategoryVal
    {
        return $value !== null ? new IncidentCategoryVal((string) $value) : null;
    }

    /**
     * Prepare the given value for storage.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof IncidentCategoryVal) {
            return $value->value;
        }

        if ($value instanceof IncidentCategory) {
            return $value->value;
        }

        return (string) $value;
    }
}
