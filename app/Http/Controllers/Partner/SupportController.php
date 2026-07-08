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
                'faq' => [
                    [
                        'question' => 'How do commissions work?',
                        'answer' => 'You earn a commission on payments made by residents of estates you referred, for the duration defined in your commission plan after the estate activates on Kontrol.',
                    ],
                    [
                        'question' => 'When are commissions settled?',
                        'answer' => 'Commissions are settled monthly on the first day of each month for the prior period. Check the Earnings page for your next settlement date.',
                    ],
                    [
                        'question' => 'How do I update my bank details?',
                        'answer' => 'Contact support with your partner account email. Bank detail updates require verification for security.',
                    ],
                    [
                        'question' => 'What happens after I submit an estate?',
                        'answer' => 'Our team reviews your request, may ask for more information, then creates and activates the estate. Track progress in Estate Pipeline.',
                    ],
                ],
            ],
        ]);
    }
}
