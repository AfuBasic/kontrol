<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $collection_id
 * @property string $target_type
 * @property int $target_id
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Collection $collection
 *
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionTarget newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionTarget newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionTarget query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionTarget whereCollectionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionTarget whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionTarget whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionTarget whereTargetId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionTarget whereTargetType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CollectionTarget whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|CollectionTarget where($column, $operator = null, $value = null, $boolean = 'and')
 *
 * @mixin \Eloquent
 */
class CollectionTarget extends Model
{
    use HasFactory;

    protected $fillable = [
        'collection_id',
        'target_type',
        'target_id',
    ];

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }
}
