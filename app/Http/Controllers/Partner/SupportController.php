<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SupportController extends Controller
{
    public function __invoke(): Response
    {
        $faq = [
            [
                'question' => 'How do commissions work?',
                'answer' => 'You earn a commission on payments made by residents of estates you referred, for the duration defined in your commission plan after the estate activates on Kontrol.',
                'category' => 'Commissions',
                'read_minutes' => 3,
                'popular' => true,
            ],
            [
                'question' => 'When are commissions settled?',
                'answer' => 'Commissions are settled monthly on the first day of each month for the prior period. Check Earnings for your next settlement date and projected amount.',
                'category' => 'Settlements',
                'read_minutes' => 2,
                'popular' => true,
            ],
            [
                'question' => 'How do I update my bank details?',
                'answer' => 'Open Account → Banking, select your bank, enter your 10-digit account number, and verify. We match the Paystack account name to your partner or contact name, then save.',
                'category' => 'Banking',
                'read_minutes' => 2,
                'popular' => true,
            ],
            [
                'question' => 'What happens after I submit an estate?',
                'answer' => 'Our team reviews your request, may ask for more information, then creates and activates the estate. Track progress in My Estates.',
                'category' => 'Estate Referrals',
                'read_minutes' => 2,
                'popular' => true,
            ],
            [
                'question' => 'Why was my estate request rejected?',
                'answer' => 'Open the request in My Estates to see the rejection reason. You can submit a new request after addressing the feedback.',
                'category' => 'Estate Referrals',
                'read_minutes' => 2,
                'popular' => true,
            ],
            [
                'question' => 'How do I get started as a partner?',
                'answer' => 'Submit your first estate from My Estates, keep your banking verified, and track commissions on Earnings after activation.',
                'category' => 'Getting Started',
                'read_minutes' => 3,
                'popular' => false,
            ],
            [
                'question' => 'How do I change my login email?',
                'answer' => 'For security, login email changes are handled by support. Contact us and we will verify the update with you.',
                'category' => 'Account',
                'read_minutes' => 1,
                'popular' => false,
            ],
            [
                'question' => 'Is my account secure?',
                'answer' => 'Use a unique password and keep your payout bank verified. Contact support immediately if you notice unexpected sign-ins.',
                'category' => 'Security',
                'read_minutes' => 2,
                'popular' => false,
            ],
        ];

        return Inertia::render('Partner/Support', [
            'support' => [
                'email' => config('mail.from.address', 'support@usekontrol.com'),
                'response_sla' => '1 business day',
                'avg_reply_hours' => 8,
                'queue_status' => 'Low',
                'status' => 'Online',
                'business_hours' => 'Mon–Fri',
                'article_count' => count($faq),
                'faq' => $faq,
                'categories' => [
                    'Getting Started',
                    'Estate Referrals',
                    'Commissions',
                    'Settlements',
                    'Banking',
                    'Account',
                    'Security',
                ],
                'resources' => [
                    [
                        'title' => 'Partner Playbook',
                        'description' => 'How top partners source and convert estates.',
                        'href' => '/partner/support',
                        'type' => 'PDF',
                        'size' => '2.4 MB',
                        'updated' => 'Jun 2026',
                    ],
                    [
                        'title' => 'Commission Guide',
                        'description' => 'Rates, windows, and settlement timing.',
                        'href' => '/partner/earnings',
                        'type' => 'Guide',
                        'size' => '—',
                        'updated' => 'Jul 2026',
                    ],
                    [
                        'title' => 'Video Library',
                        'description' => 'Submit your first estate walkthrough.',
                        'href' => '/partner/partner-requests/create',
                        'type' => 'Video',
                        'size' => '12 min',
                        'updated' => 'May 2026',
                    ],
                    [
                        'title' => 'Marketing Assets',
                        'description' => 'Logos and one-pagers for estate outreach.',
                        'href' => '/partner/support',
                        'type' => 'Kit',
                        'size' => '—',
                        'updated' => 'Coming soon',
                    ],
                ],
                'tickets' => [
                    // Placeholder until ticketing backend ships
                ],
            ],
        ]);
    }
}
