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
            'contactEmail' => 'required|email|max:255',
            'contactPhone' => 'nullable|string|max:20',
        ]);

        $application = EstateApplication::create([
            'estate_name' => $validated['estateName'],
            'address' => $validated['estateLocation'],
            'email' => $validated['contactEmail'],
            'phone' => $validated['contactPhone'] ?? '',
            'notes' => 'Contact Name: '.$validated['contactName'],
            'status' => 'pending',
        ]);

        Mail::to('afutunde@gmail.com')
            ->send(new EstateApplicationMail($application));

        Mail::to($validated['contactEmail'])
            ->send(new EstateApplicationAcknowledgmentMail($application));

        return back()->with('success', 'Application received successfully!');
    }
}
