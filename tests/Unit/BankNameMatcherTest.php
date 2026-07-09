<?php

use App\Services\Banking\BankNameMatcher;

beforeEach(function () {
    $this->matcher = new BankNameMatcher;
});

it('accepts reordered names', function () {
    $result = $this->matcher->match(['Ayo Ademola'], 'Ademola Ayo');

    expect($result['accepted'])->toBeTrue()
        ->and($result['score'])->toBe(1.0);
});

it('accepts extra middle names on the bank account', function () {
    $result = $this->matcher->match(['Ayo Ademola'], 'Ayo Olawale Ademola');

    expect($result['accepted'])->toBeTrue()
        ->and($result['score'])->toBe(1.0);
});

it('rejects unrelated account names', function () {
    $result = $this->matcher->match(['Ayo Ademola'], 'Bola Tinubu');

    expect($result['accepted'])->toBeFalse()
        ->and($result['score'])->toBe(0.0);
});

it('matches against any expected identity', function () {
    $result = $this->matcher->match(
        ['Apex Referral Network', 'John Contact'],
        'John Contact'
    );

    expect($result['accepted'])->toBeTrue();
});

it('strips titles and still matches', function () {
    $result = $this->matcher->match(['Ayo Ademola'], 'Mr Ayo Ademola');

    expect($result['accepted'])->toBeTrue();
});

it('rejects partial single-token mismatch', function () {
    $result = $this->matcher->match(['Ayo Ademola'], 'Ayo');

    expect($result['accepted'])->toBeFalse();
});
