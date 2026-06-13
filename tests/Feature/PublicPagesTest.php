<?php

use function Pest\Laravel\get;

it('renders the public home page', function () {
    get(route('landing.home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Public/Home'));
});

it('renders the public support page', function () {
    get(route('public.support'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Public/Support'));
});

it('renders the public apply page', function () {
    get(route('public.apply'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Public/Apply'));
});

it('renders the public privacy page', function () {
    get(route('public.privacy'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Public/Privacy'));
});

it('renders the public terms page', function () {
    get(route('public.terms'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Public/Terms'));
});
