<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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
            'access_code_single_use' => ['required', 'boolean'],
            'require_vehicle_information' => ['required', 'boolean'],
            'allow_residents_to_extend_visitor_passes' => ['required', 'boolean'],
            'visitor_checkout_enabled' => ['required', 'boolean'],
            'entry_point_checkout_enforced' => ['required', 'boolean'],
            'entry_points' => ['nullable', 'array'],
            'entry_points.*' => ['required', 'string', 'max:100'],

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

                if ($enforceEntryPoint && ! $checkoutMonitoring) {
                    $validator->errors()->add('entry_point_checkout_enforced', 'Entry Point Checkout cannot be enforced when Checkout Monitoring is disabled.');
                }

                if ($enforceEntryPoint && $checkoutMonitoring) {
                    if (! is_array($entryPoints) || count(array_filter($entryPoints)) === 0) {
                        $validator->errors()->add('entry_points', 'At least one valid entry point is required when Entry Point Checkout is enforced.');
                    }
                }

                if (is_array($entryPoints)) {
                    // Check for case-insensitive duplicates
                    $lowerNames = array_map(function ($name) {
                        return strtolower(trim((string) $name));
                    }, $entryPoints);

                    $lowerNames = array_filter($lowerNames);

                    if (count($lowerNames) !== count(array_unique($lowerNames))) {
                        $validator->errors()->add('entry_points', 'Entry points must have unique names.');
                    }
                }
            },
        ];
    }
}
