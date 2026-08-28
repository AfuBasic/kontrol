<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupportController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('Account/Support', [
            'support' => [
                'email' => 'support@usekontrol.com',
                'phone' => '+2347036481189',
                'phone_formatted' => '+234 703 648 1189',
                'whatsapp' => '2347036481189',
                'whatsapp_formatted' => '+234 703 648 1189',
            ],
        ]);
    }
}
