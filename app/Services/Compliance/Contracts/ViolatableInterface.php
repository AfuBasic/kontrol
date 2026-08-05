<?php

namespace App\Services\Compliance\Contracts;

use App\Models\Compliance\Violation;

interface ViolatableInterface
{
    /**
     * Get the compliance violation type associated with this model (e.g. 'collection_overdue').
     */
    public function getComplianceViolationType(): string;

    /**
     * Get the target user ID for compliance enforcement.
     */
    public function getComplianceUserId(): int;

    /**
     * Get the associated estate ID.
     */
    public function getComplianceEstateId(): int;

    /**
     * Get the associated property ID if available.
     */
    public function getCompliancePropertyId(): ?int;

    /**
     * Get the original monetary amount associated with the violation.
     */
    public function getComplianceOriginalAmount(): float;

    /**
     * Get the current outstanding balance.
     */
    public function getComplianceOutstandingAmount(): float;

    /**
     * Get the due date/time of the compliance obligation.
     */
    public function getComplianceDueAt(): ?\DateTimeInterface;

    /**
     * Check if the underlying obligation has been satisfied/resolved.
     */
    public function isComplianceResolved(): bool;

    /**
     * Synchronize penalty amounts onto the underlying domain object if applicable.
     */
    public function syncCompliancePenalty(float $totalPenalties): void;
}
