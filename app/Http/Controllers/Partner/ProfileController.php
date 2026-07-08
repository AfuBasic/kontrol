<?php

namespace App\Http\Controllers\Partner;

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

        return Inertia::render('Partner/Profile', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
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
            ] : null,
        ]);
    }
}
