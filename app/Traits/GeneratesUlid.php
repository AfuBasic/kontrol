<?php

namespace App\Traits;

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
}
