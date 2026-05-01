<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\User;
use App\Services\Admin\CollectionService;
use App\Services\EstateContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CollectionController extends Controller
{
    public function __construct(
        private EstateContextService $estateContext,
        private CollectionService $collectionService,
    ) {}

    public function index(): Response
    {
        $estate = $this->estateContext->getEstate();
        $collections = $this->collectionService->getCollections($estate);

        return Inertia::render('Admin/Collections/Index', [
            'collections' => $collections,
            'totalResidents' => User::forEstate($estate->id)->withRole('resident', $estate->id)->count(),
        ]);
    }

    public function create(): Response
    {
        $estate = $this->estateContext->getEstate();
        $residents = User::withRole('resident', $estate->id)->get();

        return Inertia::render('Admin/Collections/Create', [
            'residents' => $residents,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $estate = $this->estateContext->getEstate();
        $this->collectionService->createCollection($estate, $request->all());

        return redirect()->route('admin.collections.index')
            ->with('success', 'Collection created successfully.');
    }

    public function show(Collection $collection): Response
    {
        $this->authorizeCollection($collection);
        $collection->load(['targets', 'creator'])->loadCount('targets');
        $estate = $this->estateContext->getEstate();
        $stats = $this->collectionService->getCollectionStats($collection);

        return Inertia::render('Admin/Collections/Show', [
            'collection' => $collection,
            'stats' => $stats,
            'totalResidents' => User::forEstate($estate->id)->withRole('resident', $estate->id)->count(),
        ]);
    }

    public function edit(Collection $collection): Response
    {
        $this->authorizeCollection($collection);
        $this->ensureIsDraft($collection);
        $collection->load('targets')->loadCount('targets');
        $estate = $this->estateContext->getEstate();
        $residents = User::withRole('resident', $estate->id)->get();

        return Inertia::render('Admin/Collections/Edit', [
            'collection' => $collection,
            'residents' => $residents,
        ]);
    }

    public function update(Request $request, Collection $collection): RedirectResponse
    {
        $this->authorizeCollection($collection);
        $this->ensureIsDraft($collection);
        $this->collectionService->updateCollection($collection, $request->all());

        return redirect()->route('admin.collections.index')
            ->with('success', 'Collection updated successfully.');
    }

    public function publish(Collection $collection): RedirectResponse
    {
        $this->authorizeCollection($collection);
        $this->collectionService->publishCollection($collection);

        return back()->with('success', 'Collection published and assignments generated.');
    }

    public function destroy(Collection $collection): RedirectResponse
    {
        $this->authorizeCollection($collection);
        $this->ensureIsDraft($collection);
        $collection->delete();

        return redirect()->route('admin.collections.index')
            ->with('success', 'Collection deleted.');
    }

    private function authorizeCollection(Collection $collection): void
    {
        $estate = $this->estateContext->getEstate();
        if ($collection->estate_id !== $estate->id) {
            abort(403);
        }
    }

    private function ensureIsDraft(Collection $collection): void
    {
        if ($collection->status !== 'draft') {
            abort(403, 'Published collections cannot be modified.');
        }
    }
}
