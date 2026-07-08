<?php

namespace App\Http\Controllers\Partner;

use App\Enums\PartnerRequestStatus;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $partner = $user->partner;
        $tab = $request->string('tab')->toString() ?: 'account';

        $activity = [];

        if ($partner) {
            $activity = $partner->partnerRequests()
                ->latest()
                ->limit(15)
                ->get()
                ->map(fn ($requestModel) => [
                    'id' => $requestModel->id,
                    'title' => $requestModel->estate_name,
                    'status' => $requestModel->status instanceof PartnerRequestStatus
                        ? $requestModel->status->value
                        : (string) $requestModel->status,
                    'status_label' => $requestModel->status instanceof PartnerRequestStatus
                        ? $requestModel->status->label()
                        : str_replace('_', ' ', (string) $requestModel->status),
                    'at' => $requestModel->updated_at?->toIso8601String(),
                    'at_human' => $requestModel->updated_at?->diffForHumans(),
                ])
                ->values()
                ->all();
        }

        return Inertia::render('Partner/Profile', [
            'tab' => $tab,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at?->toDateString(),
            ],
            'partner' => $partner ? [
                'name' => $partner->name,
                'status' => $partner->status,
                'description' => $partner->description,
                'website' => $partner->website,
                'contact_person' => $partner->contact_person,
                'commission_type' => $partner->commission_type,
                'commission_rate' => $partner->commission_rate !== null
                    ? (string) $partner->commission_rate
                    : null,
                'commission_length' => $partner->commission_length,
                'created_at' => $partner->created_at?->toDateString(),
            ] : null,
            'activity' => $activity,
            'preferences' => [
                'email_product' => true,
                'email_settlements' => true,
                'email_pipeline' => true,
            ],
        ]);
    }
}
