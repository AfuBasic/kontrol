<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationNote extends Model
{
    protected $fillable = [
        'estate_application_id',
        'creator_name',
        'body',
        'type',
    ];

    /**
     * @return BelongsTo<EstateApplication, $this>
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(EstateApplication::class, 'estate_application_id');
    }
}
