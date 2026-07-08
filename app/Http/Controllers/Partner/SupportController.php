<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SupportController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Partner/Support', [
            'support' => [
                'email' => config('mail.from.address', 'support@kontrol.ng'),
                'response_sla' => '1 business day',
                'faq' => [
                    [
                        'question' => 'How do commissions work?',
                        'answer' => 'You earn a commission on payments made by residents of estates you referred, for the duration defined in your commission plan after the estate activates on Kontrol.',
                        'category' => 'Commissions',
                    ],
                    [
                        'question' => 'When are commissions settled?',
                        'answer' => 'Commissions are settled monthly on the first day of each month for the prior period. Check Earnings for your next settlement date and projected amount.',
                        'category' => 'Commissions',
                    ],
                    [
                        'question' => 'How do I update my bank details?',
                        'answer' => 'Contact support with your partner account email. Bank detail updates require verification for security.',
                        'category' => 'Account',
                    ],
                    [
                        'question' => 'What happens after I submit an estate?',
                        'answer' => 'Our team reviews your request, may ask for more information, then creates and activates the estate. Track progress in Estate Pipeline.',
                        'category' => 'Pipeline',
                    ],
                    [
                        'question' => 'Why was my estate request rejected?',
                        'answer' => 'Open the request in Pipeline to see the rejection reason. You can submit a new request after addressing the feedback.',
                        'category' => 'Pipeline',
                    ],
                ],
                'resources' => [
                    [
                        'title' => 'Partner playbook',
                        'description' => 'How top partners source and convert estates.',
                        'href' => '/partner/support',
                        'type' => 'guide',
                    ],
                    [
                        'title' => 'Commission calculator tips',
                        'description' => 'Estimate potential earnings before you submit.',
                        'href' => '/partner/partner-requests/create',
                        'type' => 'tool',
                    ],
                    [
                        'title' => 'Video: Submit your first estate',
                        'description' => 'Walkthrough of the 5-step onboarding wizard.',
                        'href' => '/partner/partner-requests/create',
                        'type' => 'video',
                    ],
                ],
                'tickets' => [
                    // Placeholder history until ticketing backend ships
                ],
            ],
        ]);
    }
}
