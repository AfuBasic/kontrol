<?php

namespace App\Traits;

use App\Models\Scopes\ZoneScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
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
     *
     * @return static|null
     */
    public static function findByHashid(string $hashid)
    {
        $id = static::decodeHashid($hashid);

        $query = static::query();
        if (in_array(ZoneScoped::class, class_uses_recursive(static::class))) {
            $query->withoutGlobalScope(ZoneScope::class);
        }

        /** @var static|null $model */
        $model = $id ? $query->find($id) : null;

        return $model;
    }

    /**
     * Find a model by its hashid or fail.
     *
     * @return static
     *
     * @throws ModelNotFoundException
     */
    public static function findByHashidOrFail(string $hashid)
    {
        $id = static::decodeHashid($hashid);

        if (! $id) {
            abort(404);
        }

        /** @var static $model */
        $model = static::findOrFail($id);

        return $model;
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
     * @return Model|null
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if ($field && $field !== 'hashid') {
            $query = $this->resolveRouteBindingQuery($this->where($field, $value), $value);
            if (in_array(ZoneScoped::class, class_uses_recursive(static::class))) {
                $query->withoutGlobalScope(ZoneScope::class);
            }

            return $query->first();
        }

        return static::findByHashid($value);
    }
}
