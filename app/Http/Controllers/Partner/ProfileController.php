<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\EstateApplication;
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
            $activity = $partner->estateApplications()
                ->latest()
                ->limit(15)
                ->get()
                ->map(fn (EstateApplication $application) => [
                    'id' => $application->id,
                    'title' => $application->estate_name,
                    'status' => $application->partnerStatusKey(),
                    'status_label' => $application->partnerStatusLabel(),
                    'at' => $application->updated_at?->toIso8601String(),
                    'at_human' => $application->updated_at?->diffForHumans(),
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
