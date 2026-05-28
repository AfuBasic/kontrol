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
                'expires_at' => $accessCode->expires_at?->toISOString(),
                'estate_name' => $accessCode->estate->name,
                'host_name' => $accessCode->user->name,
                'notes' => $accessCode->notes,
                'created_at' => $accessCode->created_at->toISOString(),
            ],
            'qr_url' => "kontrol://pass/{$accessCode->pass_uuid}?token={$accessCode->qr_token}",
        ]);
    }
}
