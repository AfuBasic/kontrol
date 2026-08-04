<?php

namespace App\Models\Compliance;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentPlan extends Model
{
    use HasFactory;

    protected $table = 'compliance_payment_plans';

    protected $fillable = [
        'violation_id',
        'approved_by_user_id',
        'status',
        'installment_amount',
        'frequency',
        'start_date',
        'next_due_date',
        'terms',
    ];

    protected function casts(): array
    {
        return [
            'installment_amount' => 'decimal:2',
            'start_date' => 'date',
            'next_due_date' => 'date',
            'terms' => 'array',
        ];
    }

    public function violation(): BelongsTo
    {
        return $this->belongsTo(Violation::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
