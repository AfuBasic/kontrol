<?php

namespace App\Http\Requests\Admin;

use App\Models\Zone;
use App\Services\EstateContextService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateEstateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 1. Visitor Access
            'access_codes_enabled' => ['required', 'boolean'],
            'access_code_min_lifespan_minutes' => ['required', 'integer', 'min:1', 'max:10080'],
            'access_code_max_lifespan_minutes' => [
                'required',
                'integer',
                'min:1',
                'max:10080',
                'gte:access_code_min_lifespan_minutes',
            ],
            'access_code_grace_period_minutes' => ['nullable', 'integer', 'min:0', 'max:1440'],
            'access_code_single_use' => ['required', 'boolean'],
            'require_vehicle_information' => ['required', 'boolean'],
            'allow_residents_to_extend_visitor_passes' => ['required', 'boolean'],
            'visitor_checkout_enabled' => ['required', 'boolean'],
            'quick_entry_enabled' => ['required', 'boolean'],
            'entry_point_checkout_enforced' => ['required', 'boolean'],
            'zone_locked_passes' => ['sometimes', 'boolean'],
            'entry_points' => ['nullable', 'array'],
            'entry_points.*' => ['required', 'string', 'max:100'],
            'entry_point_zones' => ['nullable', 'array'],
            'entry_point_zones.*.gate' => ['required', 'string', 'max:100'],
            'entry_point_zones.*.zone' => ['nullable'],

            // 2. Security Operations
            'incident_categories' => ['nullable', 'array'],
            'incident_categories.*' => ['required', 'string', 'max:50'],
            'default_incident_severity' => ['required', 'string', 'in:Low,Medium,High,Critical'],
            'require_photo_evidence_for_incidents' => ['required', 'boolean'],
            'require_resolution_notes_for_incidents' => ['required', 'boolean'],
            'allow_residents_to_report_incidents' => ['required', 'boolean'],
            'notify_admins_immediately_for_critical_incidents' => ['required', 'boolean'],

            // 3. Collections & Billing
            'allow_partial_payments' => ['required', 'boolean'],
            'minimum_partial_payment_percentage' => ['nullable', 'integer', 'min:10', 'max:90'],
            'collection_reminder_frequency' => ['required', 'string', 'in:daily,3_days,weekly,custom'],
            'collection_maximum_reminder_attempts' => ['required', 'integer', 'min:1', 'max:20'],
            'send_reminder_before_due_date_days' => ['required', 'integer', 'min:0', 'max:30'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'access_code_max_lifespan_minutes.gte' => 'Maximum lifespan must be greater than or equal to minimum lifespan.',
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $checkoutMonitoring = $this->input('visitor_checkout_enabled', false);
                $enforceEntryPoint = $this->input('entry_point_checkout_enforced', false);
                $entryPoints = $this->input('entry_points', []);
                $incidentCategories = $this->input('incident_categories', []);
                $hasDuplicateNames = function (array $names): bool {
                    $normalizedNames = array_map(function ($name) {
                        return mb_strtolower(trim((string) $name));
                    }, $names);

                    $normalizedNames = array_filter($normalizedNames);

                    return count($normalizedNames) !== count(array_unique($normalizedNames));
                };

                if ($enforceEntryPoint && ! $checkoutMonitoring) {
                    $validator->errors()->add('entry_point_checkout_enforced', 'Entry Point Checkout cannot be enforced when Checkout Monitoring is disabled.');
                }

                if ($enforceEntryPoint && $checkoutMonitoring) {
                    if (! is_array($entryPoints) || count(array_filter($entryPoints)) === 0) {
                        $validator->errors()->add('entry_points', 'At least one valid entry point is required when Entry Point Checkout is enforced.');
                    }
                }

                if (is_array($entryPoints) && $hasDuplicateNames($entryPoints)) {
                    $validator->errors()->add('entry_points', 'Entry points must have unique names.');
                }

                $this->validateGateZones($validator, is_array($entryPoints) ? $entryPoints : []);

                if (is_array($incidentCategories) && $hasDuplicateNames($incidentCategories)) {
                    $validator->errors()->add('incident_categories', 'Incident categories must have unique names.');
                }
            },
        ];
    }

    /**
     * Gate name => zone id (or "all"), only for gates that exist. Sent as a list of pairs so gate names with dots stay safe.
     *
     * @return array<string, int|string>
     */
    public function gateZones(): array
    {
        $gates = (array) $this->input('entry_points', []);
        $map = [];

        foreach ((array) $this->input('entry_point_zones', []) as $pair) {
            $gate = (string) ($pair['gate'] ?? '');
            $zone = $pair['zone'] ?? null;

            if (! in_array($gate, $gates, true) || $zone === null || $zone === '') {
                continue;
            }

            $map[$gate] = $zone === 'all' ? 'all' : (int) $zone;
        }

        return $map;
    }

    /**
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null)
    {
        $data = parent::validated();

        if (array_key_exists('entry_point_zones', $data) || array_key_exists('entry_points', $data)) {
            $data['entry_point_zones'] = $this->gateZones();
        }

        return $key === null ? $data : data_get($data, $key, $default);
    }

    /**
     * Zone-locked passes need at least two zones, and every gate must say which zone it serves (or "all").
     *
     * @param  array<int, mixed>  $gates
     */
    private function validateGateZones(Validator $validator, array $gates): void
    {
        if (! $this->boolean('zone_locked_passes')) {
            return;
        }

        $zoneIds = Zone::query()
            ->where('estate_id', resolve(EstateContextService::class)->getEstateId())
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (count($zoneIds) < 2) {
            $validator->errors()->add('zone_locked_passes', 'Zone-locked passes need at least two zones. Add zones first.');

            return;
        }

        $gates = array_values(array_filter(array_map('trim', array_map('strval', $gates))));

        if ($gates === []) {
            $validator->errors()->add('entry_points', 'Add your gates and choose a zone for each when zone-locked passes are on.');

            return;
        }

        $chosen = $this->gateZones();

        foreach ($gates as $gate) {
            $zone = $chosen[$gate] ?? null;

            if ($zone === null || ($zone !== 'all' && ! in_array($zone, $zoneIds, true))) {
                $validator->errors()->add('entry_point_zones', "Choose a zone for \"{$gate}\", or All zones if it serves every zone.");
            }
        }
    }
}
