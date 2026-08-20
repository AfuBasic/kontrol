<?php

namespace App\Http\Controllers;

use App\Models\AccessCode;
use Inertia\Inertia;
use Inertia\Response;

class PublicPassController extends Controller
{
    public function show(string $uuid): Response
    {
        $accessCode = AccessCode::where('pass_uuid', $uuid)
            ->with(['estate', 'user:id,name'])
            ->firstOrFail();

        $tz = config('app.timezone', 'Africa/Lagos');
        $effectiveVisitAt = $accessCode->effective_visit_at;

        return Inertia::render('Public/VisitorPass', [
            'pass' => [
                'id' => $accessCode->id,
                'uuid' => $accessCode->pass_uuid,
                'code' => $accessCode->code,
                'visitor_name' => $accessCode->visitor_name,
                'visitor_phone' => $accessCode->visitor_phone,
                'purpose' => $accessCode->purpose,
                'status' => $accessCode->status->value,
                'type' => $accessCode->type,
                'starts_at' => $accessCode->starts_at?->toISOString(),
                'expires_at' => $accessCode->expires_at?->toISOString(),
                'estate_name' => $accessCode->estate->name,
                'host_name' => $accessCode->user->name,
                'notes' => $accessCode->notes,
                'created_at' => $accessCode->created_at->toISOString(),
                'arrival_date' => $effectiveVisitAt->timezone($tz)->toDateString(),
                'arrival_time' => $accessCode->starts_at !== null
                    ? $effectiveVisitAt->timezone($tz)->format('g:i A')
                    : null,
                'expires_time' => $accessCode->expires_at !== null
                    ? $accessCode->expires_at->timezone($tz)->format('g:i A')
                    : null,
            ],
            'qr_url' => "kontrol://pass/{$accessCode->pass_uuid}?token={$accessCode->qr_token}",
        ]);
    }
}
