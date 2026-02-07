<?php

namespace App\Http\Controllers\Public;

use App\Actions\Public\StoreEstateApplicationAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController
{
    /**
     * Store a new estate application.
     */
    public function store(Request $request, StoreEstateApplicationAction $action): JsonResponse
    {
        $action->execute($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully.',
        ]);
    }
}
