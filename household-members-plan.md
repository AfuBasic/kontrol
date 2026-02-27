# Household Members Feature

## Context

Residents need to add family/household members who can login with reduced features. A primary resident + all their household members count as 1 unit for estate stats. Household members can view dashboard, board, create access codes — but cannot manage visitors, add other household members, or access full resident features. No member limit for now (future subscription plans will handle that).

## Approach

Use a new `household_member` global role (Spatie Permission) + a `household_members` linking table. Dashboard counts already query by `withRole('resident')`, so household members are automatically excluded.

---

## Phase 1: Database & Model Layer

### 1.1 Add `household_member` role to `database/seeders/RoleSeeder.php`
- Add `'household_member'` to `RESERVED_ROLES` and `GLOBAL_ROLES` arrays
- Run seeder

### 1.2 Create migration: `create_household_members_table`
```
household_members:
  id, estate_id (FK), primary_resident_id (FK→users), household_member_id (FK→users),
  timestamps, unique(estate_id, household_member_id), index(estate_id, primary_resident_id)
```

### 1.3 Create `app/Models/HouseholdMember.php` + factory
- Relationships: `belongsTo(Estate)`, `belongsTo(User, 'primary_resident_id')`, `belongsTo(User, 'household_member_id')`

### 1.4 Add to `app/Models/User.php`
- `householdMembers()` → HasMany(HouseholdMember, 'primary_resident_id')
- `householdOf()` → HasOne(HouseholdMember, 'household_member_id')
- `isHouseholdMember(): bool`
- `isPrimaryResident(): bool`

---

## Phase 2: Business Logic

### 2.1 Create `app/Actions/Resident/CreateHouseholdMemberAction.php`
- Mirror `CreateResidentAction` pattern
- Create User (password: null), attach to estate (pending), assign `household_member` role
- Create UserProfile (inherit unit_number/address from primary resident)
- Create HouseholdMember linking record
- Dispatch `HouseholdMemberCreated` event

### 2.2 Create `app/Actions/Resident/DeleteHouseholdMemberAction.php`
- Delete HouseholdMember record, detach from estate, delete user

### 2.3 Create event + listener + mailable
- `app/Events/Resident/HouseholdMemberCreated.php` (ShouldBroadcast)
- `app/Listeners/Resident/SendHouseholdMemberInvitationEmail.php`
- `app/Mail/Resident/HouseholdMemberInvitationMail.php` — signed URL, same pattern as `ResidentInvitationMail`
- `resources/views/mail/resident/household-member-invitation.blade.php`

### 2.4 Create `app/Services/Resident/HouseholdMemberService.php`
- `getHouseholdMembers(User $primaryResident): Collection`

### 2.5 Update `app/Actions/Zeus/AcceptInvitationAction.php` (line 39)
- Add `'household_member'` to the role check array: `$user->hasRole(['resident', 'security', 'household_member'])`

---

## Phase 3: Routing & Controllers

### 3.1 Update `app/Actions/Auth/DetermineUserRedirect.php`
- Add `household_member` check before resident check → redirect to `resident.home`

### 3.2 Update `app/Http/Middleware/EnsureIsAdmin.php` (line 24)
- Add `'household_member'` to the resident redirect check

### 3.3 Restructure `routes/resident.php`
Split into two middleware groups:

**Shared (`role:resident,household_member`):**
- Home, profile, password, activity, contacts
- Access code create/store/success
- Estate board (index, show, comments)
- Telegram linking

**Primary-resident only (`role:resident`):**
- Visitors index/show/destroy (full visitor management)
- New household member routes: `GET /household`, `POST /household`, `DELETE /household/{householdMember}`

### 3.4 Create `app/Http/Controllers/Resident/HouseholdMemberController.php`
- `index()` — list household members
- `store(StoreHouseholdMemberRequest)` — create via action
- `destroy(HouseholdMember)` — delete via action

### 3.5 Create `app/Http/Requests/Resident/StoreHouseholdMemberRequest.php`
- Rules: name (required, string, max:255), email (required, email, unique:users)

---

## Phase 4: Frontend

### 4.1 Update `resources/js/layouts/ResidentLayout.tsx`
- `navItems` is module-level (line 55), renders in `grid-cols-5`
- Move `navItems` inside the component, filter by role using `auth.user.roles` (already available via shared Inertia props)
- Hide "Visitors" for household members, add "Family" for primary residents
- Adjust grid cols dynamically based on filtered item count

### 4.2 Create `resources/js/pages/resident/household/index.tsx`
- List household members with status (pending/active)
- Simple add form (name + email)
- Delete button per member
- Uses ResidentLayout

---

## Phase 5: Verification

1. Run migration + seeder
2. Test: primary resident can add household member → invitation email sent
3. Test: household member accepts invitation → can login, sees reduced nav
4. Test: household member can create access codes
5. Test: household member CANNOT access `/resident/visitors` (index/show/destroy) → redirected
6. Test: household member CANNOT access `/resident/household` → redirected
7. Test: admin dashboard resident count excludes household members
8. Test: deleting a household member removes their access
9. Run `php artisan test --compact`

## Files Summary

**New (~14 files):**
- Migration, Model + Factory for HouseholdMember
- 2 Actions (Create, Delete)
- Event, Listener, Mailable, Blade email template
- Service, Controller, FormRequest
- Frontend page (household/index.tsx)

**Modified (~6 files):**
- `RoleSeeder.php` — add role
- `User.php` — add relationships
- `AcceptInvitationAction.php` — 1-line role check
- `DetermineUserRedirect.php` — add redirect
- `EnsureIsAdmin.php` — add redirect
- `routes/resident.php` — split middleware groups
- `ResidentLayout.tsx` — conditional nav
