<?php

namespace App\Traits;

use Vinkla\Hashids\Facades\Hashids;

trait HasHashid
{
    /**
     * Get the hashid connection name for this model.
     */
    public static function hashidConnection(): string
    {
        return 'main';
    }

    /**
     * Get the hashid attribute.
     */
    public function getHashidAttribute(): string
    {
        return Hashids::connection(static::hashidConnection())->encode($this->id);
    }

    /**
     * Decode a hashid to an ID.
     */
    public static function decodeHashid(string $hashid): ?int
    {
        $decoded = Hashids::connection(static::hashidConnection())->decode($hashid);

        return $decoded[0] ?? null;
    }

    /**
     * Find a model by its hashid.
     */
    public static function findByHashid(string $hashid): ?static
    {
        $id = static::decodeHashid($hashid);

        return $id ? static::find($id) : null;
    }

    /**
     * Find a model by its hashid or fail.
     */
    public static function findByHashidOrFail(string $hashid): static
    {
        $id = static::decodeHashid($hashid);

        if (! $id) {
            abort(404);
        }

        return static::findOrFail($id);
    }

    /**
     * Get the route key for the model (use hashid).
     */
    public function getRouteKey(): string
    {
        return $this->hashid;
    }

    /**
     * Resolve the route binding using hashid.
     *
     * @param  mixed  $value
     * @param  string|null  $field
     */
    public function resolveRouteBinding($value, $field = null): ?static
    {
        if ($field && $field !== 'hashid') {
            return parent::resolveRouteBinding($value, $field);
        }

        return static::findByHashid($value);
    }
}
