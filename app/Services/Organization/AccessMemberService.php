<?php

namespace App\Services\Organization;

use App\Actions\Organization\IssueOrganizationCredentialAction;
use App\Enums\AccessCodeStatus;
use App\Models\EstateOrganization;
use App\Models\OrganizationAccessMember;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AccessMemberService
{
    public function __construct(
        private IssueOrganizationCredentialAction $issueAction,
    ) {}

    /**
     * List access members for an organization with filtering and search.
     */
    public function listMembers(EstateOrganization $organization, array $filters = [], int $perPage = 25): LengthAwarePaginator
    {
        $query = $organization->accessMembers()
            ->with(['activeAccessCode', 'createdBy:id,name'])
            ->latest();

        if (! empty($filters['search'])) {
            $term = trim($filters['search']);
            $query->where(function (Builder $q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('identifier', 'like', "%{$term}%");
            });
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate($perPage)->through(fn (OrganizationAccessMember $member) => [
            'id' => $member->id,
            'name' => $member->name,
            'identifier' => $member->identifier,
            'category' => $member->category,
            'status' => $member->status,
            'valid_from' => $member->valid_from?->toDateString(),
            'valid_until' => $member->valid_until?->toDateString(),
            'is_valid_now' => $member->isValidNow(),
            'metadata' => $member->metadata,
            'active_credential' => $member->activeAccessCode ? [
                'id' => $member->activeAccessCode->id,
                'code' => $member->activeAccessCode->code,
                'expires_at' => $member->activeAccessCode->expires_at?->toISOString(),
                'expires_at_human' => $member->activeAccessCode->expires_at?->diffForHumans(),
                'status' => $member->activeAccessCode->status->value,
            ] : null,
            'created_at' => $member->created_at?->toISOString(),
        ]);
    }

    /**
     * Create a new access member, optionally issuing credentials immediately.
     */
    public function createMember(
        EstateOrganization $organization,
        User $createdBy,
        array $data,
        bool $issueCredential = true
    ): OrganizationAccessMember {
        return DB::transaction(function () use ($organization, $createdBy, $data, $issueCredential) {
            $member = $organization->accessMembers()->create([
                'name' => trim($data['name']),
                'identifier' => ! empty($data['identifier']) ? trim($data['identifier']) : null,
                'category' => $data['category'] ?? 'staff',
                'status' => 'active',
                'valid_from' => ! empty($data['valid_from']) ? $data['valid_from'] : now()->toDateString(),
                'valid_until' => ! empty($data['valid_until']) ? $data['valid_until'] : null,
                'metadata' => $data['metadata'] ?? null,
                'created_by' => $createdBy->id,
            ]);

            if ($issueCredential) {
                $this->issueAction->execute($member, $createdBy);
            }

            return $member;
        });
    }

    /**
     * Update an access member.
     */
    public function updateMember(OrganizationAccessMember $member, array $data): OrganizationAccessMember
    {
        $member->update([
            'name' => isset($data['name']) ? trim($data['name']) : $member->name,
            'identifier' => array_key_exists('identifier', $data) ? (! empty($data['identifier']) ? trim($data['identifier']) : null) : $member->identifier,
            'category' => $data['category'] ?? $member->category,
            'status' => $data['status'] ?? $member->status,
            'valid_from' => array_key_exists('valid_from', $data) ? $data['valid_from'] : $member->valid_from,
            'valid_until' => array_key_exists('valid_until', $data) ? $data['valid_until'] : $member->valid_until,
            'metadata' => array_key_exists('metadata', $data) ? $data['metadata'] : $member->metadata,
        ]);

        return $member;
    }

    /**
     * Suspend a member and revoke active credentials.
     */
    public function suspendMember(OrganizationAccessMember $member): OrganizationAccessMember
    {
        return DB::transaction(function () use ($member) {
            $member->update(['status' => 'suspended']);

            $member->accessCodes()
                ->where('status', AccessCodeStatus::Active)
                ->update([
                    'status' => AccessCodeStatus::Revoked,
                    'revoked_at' => now(),
                ]);

            return $member;
        });
    }

    /**
     * Reactivate a suspended or expired member.
     */
    public function activateMember(OrganizationAccessMember $member): OrganizationAccessMember
    {
        $member->update(['status' => 'active']);

        return $member;
    }
}
