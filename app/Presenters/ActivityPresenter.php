<?php

namespace App\Presenters;

use App\Models\Activity;
use App\Models\EstateBoardPost;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Support\Str;

class ActivityPresenter
{
    /**
     * Transform an Activity model into a user-friendly presentation array.
     *
     * @return array{
     *     id: int,
     *     headline: string,
     *     supporting_context: string|null,
     *     module: string,
     *     module_label: string,
     *     icon_type: string,
     *     semantic_tone: string,
     *     actor: array{id: int|null, name: string, initials: string}|null,
     *     subject: array{id: int|null, type: string|null, name: string|null}|null,
     *     timestamp: string,
     *     relative_time: string,
     *     destination_url: string|null,
     *     is_system: bool,
     *     is_important: bool
     * }
     */
    public static function present(Activity $activity): array
    {
        $properties = $activity->properties?->toArray() ?? [];
        $isSupportMode = ! empty($properties['impersonation']);
        $assistingAdminName = $properties['effective_actor_name'] ?? null;

        $actor = self::resolveActor($activity);
        $module = self::resolveModule($activity);
        $moduleLabel = self::resolveModuleLabel($module);
        $actorName = $isSupportMode ? 'Kontrol Support' : ($actor ? $actor['name'] : 'System');

        $headline = self::resolveHeadline($activity, $actorName);

        if ($isSupportMode && $assistingAdminName) {
            $headline .= " while assisting {$assistingAdminName}";
        }

        $supportingContext = self::resolveSupportingContext($activity);
        $semanticTone = self::resolveSemanticTone($activity);
        $isImportant = self::resolveIsImportant($activity);
        $destinationUrl = self::resolveDestinationUrl($activity);

        return [
            'id' => $activity->id,
            'headline' => $headline,
            'supporting_context' => $supportingContext,
            'module' => $module,
            'module_label' => $moduleLabel,
            'icon_type' => $module,
            'semantic_tone' => $semanticTone,
            'actor' => $actor,
            'subject' => self::resolveSubject($activity),
            'timestamp' => $activity->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'relative_time' => $activity->created_at?->diffForHumans() ?? 'just now',
            'destination_url' => $destinationUrl,
            'is_system' => $actor === null && ! $isSupportMode,
            'is_important' => $isImportant,
        ];
    }

    /**
     * @return array{id: int|null, name: string, initials: string}|null
     */
    private static function resolveActor(Activity $activity): ?array
    {
        $properties = $activity->properties?->toArray() ?? [];
        if (! empty($properties['impersonation'])) {
            return [
                'id' => null,
                'name' => 'Kontrol Support',
                'initials' => 'KS',
            ];
        }

        if (! $activity->causer) {
            return null;
        }

        $causer = $activity->causer;
        $name = $causer->name ?? $causer->email ?? 'Team Member';
        $initials = self::generateInitials($name);

        return [
            'id' => $causer->id ?? null,
            'name' => $name,
            'initials' => $initials,
        ];
    }

    /**
     * @return array{id: int|null, type: string|null, name: string|null}|null
     */
    private static function resolveSubject(Activity $activity): ?array
    {
        if (! $activity->subject_type && ! $activity->subject_id) {
            return null;
        }

        $subject = $activity->subject;
        $name = $subject?->name ?? $subject?->title ?? $subject?->email ?? null;

        return [
            'id' => $activity->subject_id,
            'type' => $activity->subject_type ? class_basename($activity->subject_type) : null,
            'name' => $name,
        ];
    }

    private static function resolveModule(Activity $activity): string
    {
        $logName = $activity->log_name;

        if ($logName && $logName !== 'default') {
            return $logName;
        }

        // Fallback by subject type or description
        $desc = strtolower($activity->description);
        $subjectType = $activity->subject_type ?? '';

        if (Str::contains($subjectType, 'Incident') || Str::contains($desc, 'incident')) {
            return 'incidents';
        }

        if (Str::contains($subjectType, 'EstateBoard') || Str::contains($desc, 'board') || Str::contains($desc, 'announcement') || Str::contains($desc, 'comment')) {
            return 'announcements';
        }

        if (Str::contains($subjectType, 'AccessCode') || Str::contains($desc, 'access code') || Str::contains($desc, 'visitor') || Str::contains($desc, 'checkpoint')) {
            return 'access';
        }

        if (Str::contains($desc, 'resident') || Str::contains($desc, 'property owner') || Str::contains($desc, 'household')) {
            return 'people';
        }

        if (Str::contains($desc, 'security')) {
            return 'security';
        }

        if (Str::contains($desc, 'role') || Str::contains($desc, 'admin') || Str::contains($desc, 'permission')) {
            return 'roles';
        }

        if (Str::contains($desc, 'zone')) {
            return 'zones';
        }

        if (Str::contains($desc, 'invoice') || Str::contains($desc, 'payment')) {
            return 'finance';
        }

        return 'system';
    }

    private static function resolveModuleLabel(string $module): string
    {
        return match ($module) {
            'people' => 'People',
            'security' => 'Security',
            'access' => 'Access & Gate',
            'incidents' => 'Incidents',
            'announcements' => 'Announcements',
            'finance' => 'Finance',
            'zones' => 'Zones',
            'roles' => 'Administration',
            default => 'Estate',
        };
    }

    private static function resolveHeadline(Activity $activity, string $actorName): string
    {
        $desc = $activity->description;
        $subject = $activity->subject;
        $properties = $activity->properties?->toArray() ?? [];

        // 1. People
        if (Str::startsWith($desc, 'invited resident')) {
            $name = $subject?->name ?? Str::after($desc, 'invited resident ');

            return "{$actorName} invited {$name} as a resident";
        }

        if (Str::startsWith($desc, 'updated resident')) {
            $name = $subject?->name ?? Str::after($desc, 'updated resident ');

            return "{$actorName} updated {$name}'s resident profile";
        }

        if (Str::startsWith($desc, 'suspended resident role for')) {
            $name = $subject?->name ?? Str::after($desc, 'suspended resident role for ');

            return "{$actorName} suspended {$name}'s resident access";
        }

        if (Str::startsWith($desc, 'activated resident role for')) {
            $name = $subject?->name ?? Str::after($desc, 'activated resident role for ');

            return "{$actorName} restored {$name}'s resident access";
        }

        if (Str::startsWith($desc, 'removed resident role from')) {
            $name = $subject?->name ?? Str::after($desc, 'removed resident role from ');

            return "{$actorName} removed {$name} as a resident";
        }

        if (Str::startsWith($desc, 'bulk invited') && Str::contains($desc, 'residents')) {
            $count = $properties['count'] ?? 'multiple';

            return "{$actorName} invited {$count} residents in bulk";
        }

        if (Str::startsWith($desc, 'bulk removed') && Str::contains($desc, 'residents')) {
            $count = $properties['deleted_count'] ?? 'multiple';

            return "{$actorName} removed {$count} residents in bulk";
        }

        if (Str::startsWith($desc, 'resent invitation for resident')) {
            $name = $subject?->name ?? Str::after($desc, 'resent invitation for resident ');

            return "{$actorName} resent an invitation to {$name}";
        }

        if (Str::startsWith($desc, 'swapped resident role to property owner for')) {
            $name = $subject?->name ?? Str::after($desc, 'swapped resident role to property owner for ');

            return "{$actorName} changed {$name} from resident to property owner";
        }

        if (Str::startsWith($desc, 'swapped property owner role to resident for')) {
            $name = $subject?->name ?? Str::after($desc, 'swapped property owner role to resident for ');

            return "{$actorName} changed {$name} from property owner to resident";
        }

        if (Str::startsWith($desc, 'invited property owner')) {
            $name = $subject?->name ?? Str::after($desc, 'invited property owner ');

            return "{$actorName} invited {$name} as a property owner";
        }

        if (Str::startsWith($desc, 'suspended property owner role for')) {
            $name = $subject?->name ?? Str::after($desc, 'suspended property owner role for ');

            return "{$actorName} suspended {$name}'s property owner access";
        }

        if (Str::startsWith($desc, 'activated property owner role for')) {
            $name = $subject?->name ?? Str::after($desc, 'activated property owner role for ');

            return "{$actorName} restored {$name}'s property owner access";
        }

        if (Str::startsWith($desc, 'removed property owner role from')) {
            $name = $subject?->name ?? Str::after($desc, 'removed property owner role from ');

            return "{$actorName} removed {$name} as a property owner";
        }

        if (Str::startsWith($desc, 'bulk invited') && Str::contains($desc, 'property owners')) {
            $count = $properties['count'] ?? 'multiple';

            return "{$actorName} invited {$count} property owners in bulk";
        }

        if (Str::startsWith($desc, 'bulk removed') && Str::contains($desc, 'property owners')) {
            $count = $properties['deleted_count'] ?? 'multiple';

            return "{$actorName} removed {$count} property owners in bulk";
        }

        if (Str::startsWith($desc, 'assigned') && Str::contains($desc, 'resident(s) to property owner')) {
            return "{$actorName} assigned residents to property owner";
        }

        if (Str::startsWith($desc, 'added household member')) {
            $name = $subject?->name ?? Str::after($desc, 'added household member ');

            return "{$actorName} added {$name} as a household member";
        }

        if (Str::startsWith($desc, 'removed household member')) {
            $name = $subject?->name ?? Str::after($desc, 'removed household member ');

            return "{$actorName} removed {$name} from household";
        }

        // 2. Security
        if (Str::startsWith($desc, 'invited security personnel')) {
            $name = $subject?->name ?? Str::after($desc, 'invited security personnel ');

            return "{$actorName} invited {$name} to security personnel";
        }

        if (Str::startsWith($desc, 'updated security personnel')) {
            $name = $subject?->name ?? Str::after($desc, 'updated security personnel ');

            return "{$actorName} updated {$name}'s security profile";
        }

        if (Str::startsWith($desc, 'suspended security role for')) {
            $name = $subject?->name ?? Str::after($desc, 'suspended security role for ');

            return "{$actorName} suspended {$name}'s security access";
        }

        if (Str::startsWith($desc, 'activated security role for')) {
            $name = $subject?->name ?? Str::after($desc, 'activated security role for ');

            return "{$actorName} restored {$name}'s security access";
        }

        if (Str::startsWith($desc, 'removed security role from')) {
            $name = $subject?->name ?? Str::after($desc, 'removed security role from ');

            return "{$actorName} removed {$name} from security personnel";
        }

        if (Str::startsWith($desc, 'bulk invited') && Str::contains($desc, 'security personnel')) {
            $count = $properties['count'] ?? 'multiple';

            return "{$actorName} invited {$count} security guards in bulk";
        }

        if (Str::startsWith($desc, 'bulk removed') && Str::contains($desc, 'security personnel')) {
            $count = $properties['deleted_count'] ?? 'multiple';

            return "{$actorName} removed {$count} security guards in bulk";
        }

        if (Str::startsWith($desc, 'resent invitation for security personnel')) {
            $name = $subject?->name ?? Str::after($desc, 'resent invitation for security personnel ');

            return "{$actorName} resent invitation to security guard {$name}";
        }

        if (Str::startsWith($desc, 'Claimed checkpoint')) {
            $point = Str::after($desc, 'Claimed checkpoint ');

            return "{$actorName} claimed checkpoint {$point}";
        }

        if (Str::startsWith($desc, 'Released checkpoint')) {
            $point = Str::after($desc, 'Released checkpoint ');

            return "{$actorName} released checkpoint {$point}";
        }

        // 3. Access
        if ($desc === 'Visitor checked out') {
            $visitorName = $properties['visitor_name'] ?? $subject?->visitor_name ?? 'A visitor';

            return "{$actorName} recorded checkout for {$visitorName}";
        }

        if ($desc === 'Visitor checked in') {
            $visitorName = $properties['visitor_name'] ?? $subject?->visitor_name ?? 'A visitor';

            return "{$actorName} checked in {$visitorName}";
        }

        if ($desc === 'Access code used') {
            $visitorName = $subject?->visitor_name ?? 'Visitor';

            return "{$visitorName} checked in with access code";
        }

        if ($desc === 'Access code revoked') {
            $visitorName = $subject?->visitor_name ?? 'Visitor';

            return "{$actorName} revoked access code for {$visitorName}";
        }

        if ($desc === 'Access code extended') {
            $visitorName = $subject?->visitor_name ?? 'Visitor';

            return "{$actorName} extended visitor pass for {$visitorName}";
        }

        // 4. Announcements
        if (Str::startsWith($desc, 'created board post:')) {
            return "{$actorName} published an announcement";
        }

        if (Str::startsWith($desc, 'updated board post:')) {
            return "{$actorName} updated an announcement";
        }

        if (Str::startsWith($desc, 'deleted board post:')) {
            return "{$actorName} deleted an announcement";
        }

        if ($desc === 'deleted comment') {
            return "{$actorName} deleted a comment on an announcement";
        }

        // 5. Incidents
        if (Str::startsWith($desc, 'reported incident:')) {
            return "{$actorName} reported an incident";
        }

        if (Str::startsWith($desc, 'updated incident status to:')) {
            $status = Str::after($desc, 'updated incident status to: ');

            return "{$actorName} updated incident status to {$status}";
        }

        if (Str::startsWith($desc, 'marked incident as resolved')) {
            return "{$actorName} marked an incident as resolved";
        }

        if ($desc === 'closed incident') {
            return "{$actorName} closed an incident";
        }

        if ($desc === 'added comment to incident') {
            return "{$actorName} posted an official update on an incident";
        }

        if (Str::startsWith($desc, 'reassigned incident to:')) {
            $assignee = Str::after($desc, 'reassigned incident to: ');

            return "{$actorName} reassigned incident to {$assignee}";
        }

        if (Str::startsWith($desc, 'updated incident priority to:')) {
            $priority = Str::after($desc, 'updated incident priority to: ');

            return "{$actorName} changed incident priority to {$priority}";
        }

        if (Str::startsWith($desc, 'updated incident category to:')) {
            $category = Str::after($desc, 'updated incident category to: ');

            return "{$actorName} changed incident category to {$category}";
        }

        // 6. Roles & Administration
        if (Str::startsWith($desc, 'created role')) {
            $roleName = Str::after($desc, 'created role ');

            return "{$actorName} created the {$roleName} role";
        }

        if (Str::startsWith($desc, 'updated role')) {
            $roleName = Str::after($desc, 'updated role ');

            return "{$actorName} updated the {$roleName} role";
        }

        if (Str::startsWith($desc, 'deleted role')) {
            $roleName = Str::after($desc, 'deleted role ');

            return "{$actorName} deleted the {$roleName} role";
        }

        if (Str::startsWith($desc, 'invited admin')) {
            $name = $subject?->name ?? Str::after($desc, 'invited admin ');

            return "{$actorName} invited {$name} as an administrator";
        }

        if (Str::startsWith($desc, 'updated admin')) {
            $name = $subject?->name ?? Str::after($desc, 'updated admin ');

            return "{$actorName} updated administrator {$name}";
        }

        if (Str::startsWith($desc, 'removed admin')) {
            $name = $subject?->name ?? Str::after($desc, 'removed admin ');

            return "{$actorName} removed administrator {$name}";
        }

        // 7. Zones & Estate Settings
        if (Str::startsWith($desc, 'moved members to zone')) {
            $zone = Str::after($desc, 'moved members to zone ');

            return "{$actorName} moved members to {$zone}";
        }

        if ($desc === 'moved members to entire estate') {
            return "{$actorName} assigned members to the entire estate";
        }

        if ($desc === 'updated estate settings') {
            return "{$actorName} updated estate settings";
        }

        if ($desc === 'Estate bulk invoice generated') {
            return "{$actorName} generated a bulk billing invoice";
        }

        return "{$actorName} {$desc}";
    }

    private static function resolveSupportingContext(Activity $activity): ?string
    {
        $desc = $activity->description;
        $subject = $activity->subject;
        $properties = $activity->properties?->toArray() ?? [];

        if (Str::contains($desc, 'board post:')) {
            return Str::after($desc, 'board post: ');
        }

        if ($subject instanceof EstateBoardPost) {
            return $subject->title;
        }

        if (isset($properties['post_title'])) {
            return (string) $properties['post_title'];
        }

        if (Str::contains($desc, 'incident:')) {
            return Str::after($desc, 'incident: ');
        }

        if ($subject instanceof Incident) {
            return $subject->title;
        }

        if (isset($properties['visitor_name'])) {
            return 'Visitor: '.$properties['visitor_name'];
        }

        return null;
    }

    private static function resolveSemanticTone(Activity $activity): string
    {
        $desc = strtolower($activity->description);

        if (Str::contains($desc, 'suspend') || Str::contains($desc, 'remove') || Str::contains($desc, 'delete') || Str::contains($desc, 'revoked')) {
            return 'warning';
        }

        if (Str::contains($desc, 'invoice') || Str::contains($desc, 'payment')) {
            return 'financial';
        }

        if (Str::contains($desc, 'incident') || Str::contains($desc, 'checkpoint')) {
            return 'important';
        }

        return 'normal';
    }

    private static function resolveIsImportant(Activity $activity): bool
    {
        $desc = strtolower($activity->description);

        return Str::contains($desc, 'suspend')
            || Str::contains($desc, 'delete')
            || Str::contains($desc, 'remove')
            || Str::contains($desc, 'closed incident')
            || Str::contains($desc, 'role');
    }

    private static function resolveDestinationUrl(Activity $activity): ?string
    {
        $subject = $activity->subject;

        if (! $subject) {
            return null;
        }

        if ($subject instanceof Incident) {
            return route('admin.incidents.show', $subject, false);
        }

        if ($subject instanceof EstateBoardPost) {
            return route('admin.estate-board.show', $subject, false);
        }

        if ($subject instanceof User) {
            return route('admin.users.index', [], false);
        }

        return null;
    }

    private static function generateInitials(string $name): string
    {
        $words = preg_split('/\s+/', trim($name));
        if (empty($words) || ! $words[0]) {
            return '??';
        }

        if (count($words) === 1) {
            return strtoupper(substr($words[0], 0, 2));
        }

        return strtoupper(substr($words[0], 0, 1).substr(end($words), 0, 1));
    }
}
