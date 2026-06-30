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
    $normalisedSource = preg_replace('/\s+/', ' ', $source);

    expect($source)
        ->toContain('The Operating System')
        ->toContain('For Modern Estates')
        ->toContain('Get Started Free')
        ->toContain('<CinematicHero />')
        ->toContain('href={apply.url()}');

    expect($normalisedSource)
        ->toContain('Modernise every part of your estate—from visitor access and collections to resident communication and security—all in one intelligent platform.');

    expect($heroSource)
        ->toContain('/assets/images/hero/estate-before-kontrol.png')
        ->toContain('/assets/images/hero/estate-powered-by-kontrol.webp')
        ->toContain('enteringLogoRef')
        ->toContain('--awake-radius');
});

it('ships aligned cinematic hero image assets', function () {
    $asleep = public_path('assets/images/hero/estate-before-kontrol.png');
    $awake = public_path('assets/images/hero/estate-powered-by-kontrol.webp');

    expect($asleep)->toBeFile()
        ->and($awake)->toBeFile();

    [$asleepWidth, $asleepHeight] = getimagesize($asleep);
    [$awakeWidth, $awakeHeight] = getimagesize($awake);

    expect([$awakeWidth, $awakeHeight])->toBe([$asleepWidth, $asleepHeight]);
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
