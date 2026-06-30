<?php

namespace App\Actions\Admin;

use App\Jobs\Admin\SendBulkPropertyOwnerInvitationsJob;
use App\Models\Estate;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class BulkInvitePropertyOwnersAction
{
    /**
     * @param  array<string>  $emails
     * @return array{invited: int, skipped: int, skipped_emails: array<string>}
     */
    public function execute(array $emails, Estate $estate): array
    {
        // Normalize all emails
        $emails = array_map(fn ($email) => strtolower(trim($email)), $emails);
        $emails = array_unique($emails);

        // Get existing emails
        $existingEmails = User::whereIn('email', $emails)->pluck('email')->toArray();

        // Filter to only new emails
        $newEmails = array_diff($emails, $existingEmails);

        // suspend operations since there's no new owners to create
        if (empty($newEmails)) {
            return [
                'invited' => 0,
                'skipped' => count($existingEmails),
                'skipped_emails' => $existingEmails,
            ];
        }

        // Get roles
        $residentRole = Role::where('name', 'resident')
            ->where('guard_name', 'web')
            ->whereNull('estate_id')
            ->firstOrFail();

        $poRole = Role::where('name', 'property_owner')
            ->where('guard_name', 'web')
            ->whereNull('estate_id')
            ->firstOrFail();

        $now = Carbon::now();
        $invitedUserIds = [];

        DB::transaction(function () use ($newEmails, $estate, $residentRole, $poRole, $now, &$invitedUserIds) {
            // Prepare users data for batch insert
            $usersData = [];
            foreach ($newEmails as $email) {
                $usersData[] = [
                    'ulid' => (string) Str::ulid(),
                    'name' => $this->extractNameFromEmail($email),
                    'email' => $email,
                    'password' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            User::insert($usersData);

            // Get the IDs of newly created users
            $newUsers = User::whereIn('email', $newEmails)->get(['id', 'email']);
            $invitedUserIds = $newUsers->pluck('id')->toArray();

            // Bulk attach users to estate with pending status
            $estateUserData = [];
            foreach ($invitedUserIds as $userId) {
                $estateUserData[$userId] = ['status' => 'pending'];
            }
            $estate->users()->attach($estateUserData);

            // Bulk assign roles
            $roleAssignments = [];
            foreach ($invitedUserIds as $userId) {
                $roleAssignments[] = [
                    'role_id' => $residentRole->id,
                    'model_type' => User::class,
                    'model_id' => $userId,
                    'estate_id' => $estate->id,
                ];
                $roleAssignments[] = [
                    'role_id' => $poRole->id,
                    'model_type' => User::class,
                    'model_id' => $userId,
                    'estate_id' => $estate->id,
                ];
            }
            DB::table('model_has_roles')->insert($roleAssignments);

            // Bulk insert user profiles
            $profilesData = [];
            foreach ($invitedUserIds as $userId) {
                $profilesData[] = [
                    'user_id' => $userId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            UserProfile::insert($profilesData);

            // Log activity for bulk invite
            activity()
                ->causedBy(Auth::user())
                ->withProperties([
                    'estate_id' => $estate->id,
                    'bulk_invite' => true,
                    'count' => count($invitedUserIds),
                    'emails' => $newEmails,
                ])
                ->log('bulk invited '.count($invitedUserIds).' property owners');
        });

        // Dispatch single job for all invitations (outside transaction)
        if (! empty($invitedUserIds)) {
            SendBulkPropertyOwnerInvitationsJob::dispatch($invitedUserIds, $estate->id);
        }

        return [
            'invited' => count($invitedUserIds),
            'skipped' => count($existingEmails),
            'skipped_emails' => $existingEmails,
        ];
    }

    /**
     * Extract a reasonable name from an email address.
     */
    private function extractNameFromEmail(string $email): string
    {
        $localPart = explode('@', $email)[0];

        // Replace common separators with spaces
        $name = str_replace(['.', '_', '-', '+'], ' ', $localPart);

        // Strip any HTML tags and non-printable characters
        $name = strip_tags($name);
        $name = preg_replace('/[^\p{L}\p{N}\s]/u', '', $name);

        // Capitalize each word and trim
        $name = ucwords(trim($name));

        return $name ?: 'Property Owner';
    }
}
