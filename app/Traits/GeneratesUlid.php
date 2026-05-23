<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

trait GeneratesUlid
{
    /**
     * Boot the trait.
     */
    protected static function bootGeneratesUlid(): void
    {
        static::creating(function ($model) {
            if (empty($model->ulid)) {
                $model->ulid = (string) Str::ulid();
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'ulid';
    }

    /**
     * Retrieve the model for a bound value.
     *
     * @param  mixed  $value
     * @param  string|null  $field
     * @return Model|null
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if ($field) {
            return parent::resolveRouteBinding($value, $field);
        }

        // If the value looks like a ULID (26 chars), only search by ULID column.
        // This prevents MySQL from casting non-numeric ULIDs to integers when
        // comparing against the 'id' column, which can lead to false positives (e.g. ULID "01..." matches ID 1).
        if (is_string($value) && strlen($value) === 26) {
            return $this->where('ulid', $value)->firstOrFail();
        }

        return $this->where('id', $value)->firstOrFail();
    }
}
