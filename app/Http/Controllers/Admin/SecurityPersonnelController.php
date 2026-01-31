<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class SecurityPersonnelController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/security/index');
    }
}
