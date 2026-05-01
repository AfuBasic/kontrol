<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\CollectionAssignment;
use App\Services\EstateContextService;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext
    ) {}

    public function index(): Response
    {
        $user = auth()->user();
        $estate = $this->estateContext->getEstate();

        $assignments = CollectionAssignment::where('user_id', $user->id)
            ->where('estate_id', $estate->id)
            ->with('collection')
            ->latest()
            ->get();

        $summary = [
            'outstanding' => $assignments->whereIn('status', ['pending', 'overdue', 'grace', 'partial']),
            'paid' => $assignments->where('status', 'paid'),
        ];

        return Inertia::render('Resident/Collections/Index', [
            'summary' => $summary,
            'allAssignments' => $assignments,
        ]);
    }

    public function show(CollectionAssignment $assignment): Response
    {
        $user = auth()->user();
        abort_if($assignment->user_id !== $user->id, 403);

        $assignment->load('collection');

        return Inertia::render('Resident/Collections/Show', [
            'assignment' => $assignment,
        ]);
    }
}
