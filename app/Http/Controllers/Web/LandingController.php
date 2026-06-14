<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Mail\EstateApplicationAcknowledgmentMail;
use App\Mail\EstateApplicationMail;
use App\Mail\SupportRequestMail;
use App\Models\EstateApplication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    /**
     * Render the public landing/home page.
     */
    public function index(): Response
    {
        return Inertia::render('Public/Home');
    }

    /**
     * Handle the support form submission.
     */
    public function support(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'required|string|min:10|max:5000',
        ]);

        Mail::to('support@usekontrol.com')
            ->send(new SupportRequestMail($validated));

        return back()->with('success', 'Thanks for reaching out! We will get back to you soon.');
    }

    /**
     * Handle the application form submission.
     */
    public function apply(Request $request)
    {
        $validated = $request->validate([
            'estateName' => 'required|string|max:255',
            'estateLocation' => 'required|string|max:255',
            'contactName' => 'required|string|max:255',
            'contactEmail' => 'required|email|max:255|unique:estate_applications,email|unique:estates,email|unique:users,email',
            'contactPhone' => 'nullable|string|max:20|unique:estate_applications,phone',
        ], [
            'contactEmail.unique' => "Application Error. Your application couldn't be processed at this time.",
            'contactPhone.unique' => "Application Error. Your application couldn't be processed at this time.",
        ]);

        $application = EstateApplication::create([
            'estate_name' => $validated['estateName'],
            'address' => $validated['estateLocation'],
            'email' => $validated['contactEmail'],
            'phone' => $validated['contactPhone'] ?? '',
            'notes' => 'Contact Name: '.$validated['contactName'],
            'status' => 'received',
        ]);

        Mail::to('afutunde@gmail.com')
            ->send(new EstateApplicationMail($application));

        Mail::to($validated['contactEmail'])
            ->send(new EstateApplicationAcknowledgmentMail($application));

        return back()->with('success', 'Application received successfully!');
    }

    /**
     * Handle the smart app download redirect based on User-Agent.
     */
    public function downloadApp(Request $request)
    {
        $userAgent = $request->header('User-Agent');

        if (stripos($userAgent, 'android') !== false) {
            // Android redirect (Update with real Play Store URL when available)
            return redirect('https://play.google.com/store/apps/details?id=com.usekontrol.app');
        }

        if (stripos($userAgent, 'iphone') !== false || stripos($userAgent, 'ipad') !== false) {
            // iOS redirect
            return redirect('https://apps.apple.com/ng/app/access-kontrol/id6772562083');
        }

        // Fallback for desktop
        return redirect('/#download');
    }
}
