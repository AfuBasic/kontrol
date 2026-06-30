<?php

use function Pest\Laravel\get;

it('renders the public home page', function () {
    get(route('landing.home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Public/Home'));
});

it('ships the cinematic hero copy in the public home bundle', function () {
    $source = file_get_contents(resource_path('js/Pages/Public/Home.tsx'));
    $heroSource = file_get_contents(resource_path('js/Components/Public/CinematicHero.tsx'));

    expect($source)
        ->toContain('The Operating System')
        ->toContain('For Modern Estates')
        ->toContain('Get Started Free')
        ->toContain('<CinematicHero />')
        ->toContain('href={apply.url()}');

    expect($heroSource)
        ->toContain('/assets/images/hero/estate-kontrol-master.png')
        ->toContain('kontrol-hero-asleep')
        ->toContain('enteringLogoRef')
        ->toContain('--awake-radius');
});

it('ships the rich cinematic hero master image asset', function () {
    $master = public_path('assets/images/hero/estate-kontrol-master.png');
    $css = file_get_contents(resource_path('css/app.css'));

    expect($master)->toBeFile()
        ->and($css)->toContain('grayscale(1)');

    [$width, $height] = getimagesize($master);

    expect($width)->toBeGreaterThanOrEqual(1200)
        ->and($height)->toBeGreaterThanOrEqual(675);
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
