<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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

        \Illuminate\Support\Facades\Mail::to('support@usekontrol.com')
            ->send(new \App\Mail\SupportRequestMail($validated));

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

        $application = \App\Models\EstateApplication::create([
            'estate_name' => $validated['estateName'],
            'address' => $validated['estateLocation'],
            'email' => $validated['contactEmail'],
            'phone' => $validated['contactPhone'] ?? '',
            'notes' => 'Contact Name: ' . $validated['contactName'],
            'status' => 'pending',
        ]);

        \Illuminate\Support\Facades\Mail::to('afutunde@gmail.com')
            ->send(new \App\Mail\EstateApplicationMail($application));

        return back()->with('success', 'Application received successfully!');
    }
}
