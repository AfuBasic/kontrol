<?php

namespace App\Http\Controllers\Public;

use App\Actions\Public\StoreEstateApplicationAction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ApplicationController
{
    /**
     * Store a new estate application.
     */
    public function store(Request $request, StoreEstateApplicationAction $action): RedirectResponse
    {
        $action->execute($request->all());

        return redirect()->back();
    }
}
