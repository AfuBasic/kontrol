<?php

namespace App\Http\Controllers\Partner;

use App\Enums\PartnerRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Partner\StorePartnerRequestRequest;
use App\Models\PartnerRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartnerRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $partnerId = $request->user()->partner_id;

        $partnerRequests = PartnerRequest::query()
            ->when($partnerId, fn ($query) => $query->where('partner_id', $partnerId))
            ->when(! $partnerId, fn ($query) => $query->whereRaw('1 = 0'))
            ->with('estate:id,ulid,name,status')
            ->latest()
            ->get();

        return Inertia::render('Partner/PartnerRequests/Index', [
            'partnerRequests' => $partnerRequests,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Partner/PartnerEstate', [
            'partner' => $request->user()->partner,
        ]);
    }

    public function store(StorePartnerRequestRequest $request): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->partner_id, 403, 'Your account is not linked to a partner organization.');

        PartnerRequest::create([
            ...$request->validated(),
            'partner_id' => $user->partner_id,
            'status' => PartnerRequestStatus::Submitted,
        ]);

        return redirect()
            ->route('partner.partner-requests.index')
            ->with('success', 'Partner request submitted successfully. Our team will review it shortly.');
    }
}
