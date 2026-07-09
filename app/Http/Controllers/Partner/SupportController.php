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
                'email' => 'support@usekontrol.com',
                'response_sla' => '1 business day',
                'avg_reply_hours' => 8,
                'queue_status' => 'Low',
                'status' => 'Online',
                'business_hours' => 'Mon–Fri',
                'faq' => [
                    [
                        'question' => 'How do commissions work?',
                        'answer' => 'You earn a commission on payments made by residents of estates you referred, for the duration defined in your commission plan after the estate activates on Kontrol.',
                        'category' => 'Commissions',
                    ],
                    [
                        'question' => 'When are commissions settled?',
                        'answer' => 'Commissions are settled monthly on the first day of each month for the prior period. Check Earnings for your next settlement date and projected amount.',
                        'category' => 'Settlements',
                    ],
                    [
                        'question' => 'How do I update my bank details?',
                        'answer' => 'Open Account → Banking, select your bank, enter your 10-digit account number, and verify. We match the Paystack account name to your partner or contact name, then save.',
                        'category' => 'Banking',
                    ],
                    [
                        'question' => 'What happens after I submit an estate?',
                        'answer' => 'Our team reviews your request, may ask for more information, then creates and activates the estate. Track progress in My Estates.',
                        'category' => 'Estates',
                    ],
                    [
                        'question' => 'Why was my estate request rejected?',
                        'answer' => 'Open the request in My Estates to see the rejection reason. You can submit a new request after addressing the feedback.',
                        'category' => 'Estates',
                    ],
                    [
                        'question' => 'How do I get started as a partner?',
                        'answer' => 'Submit your first estate from My Estates, keep your banking verified, and track commissions on Earnings after activation.',
                        'category' => 'Getting started',
                    ],
                    [
                        'question' => 'How do I change my login email?',
                        'answer' => 'For security, login email changes are handled by support. Contact us and we will verify the update with you.',
                        'category' => 'Account',
                    ],
                    [
                        'question' => 'Is my account secure?',
                        'answer' => 'Use a unique password and keep your payout bank verified. Contact support immediately if you notice unexpected sign-ins.',
                        'category' => 'Security',
                    ],
                ],
                'tickets' => [],
            ],
        ]);
    }
}
