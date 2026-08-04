<?php

namespace App\Models;

use App\Services\Compliance\Contracts\ViolatableInterface;
use App\Traits\GeneratesUlid;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CollectionAssignment extends Model implements ViolatableInterface
{
    use GeneratesUlid, HasFactory;

    protected $fillable = [
        'collection_id',
        'estate_id',
        'user_id',
        'property_id',
        'period',
        'amount_due',
        'amount_paid',
        'status',
        'due_date',
        'grace_until',
        'paid_at',
        'external_reference',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'grace_until' => 'date',
            'paid_at' => 'datetime',
            'amount_due' => 'integer',
            'amount_paid' => 'integer',
        ];
    }

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    public function estate(): BelongsTo
    {
        return $this->belongsTo(Estate::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function isOverdue(): bool
    {
        return $this->status === 'overdue';
    }

    /* --- ViolatableInterface Implementation --- */

    public function getComplianceViolationType(): string
    {
        return 'collection_overdue';
    }

    public function getComplianceUserId(): int
    {
        return $this->user_id;
    }

    public function getComplianceEstateId(): int
    {
        return $this->estate_id;
    }

    public function getCompliancePropertyId(): ?int
    {
        return $this->property_id;
    }

    public function getComplianceOriginalAmount(): float
    {
        return (float) ($this->amount_due / 100);
    }

    public function getComplianceOutstandingAmount(): float
    {
        return (float) max(0, ($this->amount_due - $this->amount_paid) / 100);
    }

    public function getComplianceDueAt(): ?\DateTimeInterface
    {
        return $this->due_date;
    }

    public function isComplianceResolved(): bool
    {
        return $this->isPaid() || ($this->amount_paid >= $this->amount_due);
    }

    public function syncCompliancePenalty(float $totalPenalties): void
    {
        // Optionally update penalty adjustments if needed
    }
}
