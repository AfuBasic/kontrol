<?php

namespace App\Services\Banking;

/**
 * Fuzzy match between an expected identity name and a Paystack-resolved account name.
 *
 * Token-set based: order-independent, middle names allowed, titles stripped.
 */
class BankNameMatcher
{
    private const ACCEPT_THRESHOLD = 0.8;

    /** @var list<string> */
    private const TITLES = [
        'MR', 'MRS', 'MISS', 'MS', 'DR', 'PROF', 'ENGR', 'ENG', 'CHIEF', 'ALH', 'ALHAJI',
        'ALHAJA', 'HON', 'REV', 'PASTOR', 'EVANG', 'BARR', 'SIR', 'LADY', 'PRINCE', 'PRINCESS',
    ];

    /** @var list<string> */
    private const CORPORATE_SUFFIXES = [
        'LTD', 'LIMITED', 'PLC', 'LLC', 'INC', 'NIG', 'NIGERIA', 'CO', 'COMPANY', 'ENTERPRISE',
        'ENTERPRISES', 'VENTURES', 'GLOBAL', 'INTL', 'INTERNATIONAL',
    ];

    /**
     * @param  list<string>  $expectedNames  Partner org name and/or contact names
     * @return array{accepted: bool, score: float, status: string, matched_tokens: list<string>, expected_tokens: list<string>, resolved_tokens: list<string>}
     */
    public function match(array $expectedNames, string $resolvedAccountName): array
    {
        $resolvedTokens = $this->tokenize($resolvedAccountName);
        $best = [
            'accepted' => false,
            'score' => 0.0,
            'status' => 'reject',
            'matched_tokens' => [],
            'expected_tokens' => [],
            'resolved_tokens' => $resolvedTokens,
        ];

        foreach ($expectedNames as $expected) {
            if (! filled($expected)) {
                continue;
            }

            $result = $this->matchSingle((string) $expected, $resolvedTokens);

            if ($result['score'] > $best['score']) {
                $best = $result;
            }

            if ($result['accepted']) {
                return $result;
            }
        }

        return $best;
    }

    /**
     * @param  list<string>  $resolvedTokens
     * @return array{accepted: bool, score: float, status: string, matched_tokens: list<string>, expected_tokens: list<string>, resolved_tokens: list<string>}
     */
    private function matchSingle(string $expected, array $resolvedTokens): array
    {
        $expectedTokens = $this->tokenize($expected);

        if ($expectedTokens === [] || $resolvedTokens === []) {
            return [
                'accepted' => false,
                'score' => 0.0,
                'status' => 'reject',
                'matched_tokens' => [],
                'expected_tokens' => $expectedTokens,
                'resolved_tokens' => $resolvedTokens,
            ];
        }

        $matched = array_values(array_intersect($expectedTokens, $resolvedTokens));
        $score = count($matched) / count($expectedTokens);

        $accepted = $this->isAccepted($expectedTokens, $matched, $score);

        return [
            'accepted' => $accepted,
            'score' => round($score, 4),
            'status' => $accepted ? 'accept' : ($score >= 0.5 ? 'warn' : 'reject'),
            'matched_tokens' => $matched,
            'expected_tokens' => $expectedTokens,
            'resolved_tokens' => $resolvedTokens,
        ];
    }

    /**
     * @param  list<string>  $expectedTokens
     * @param  list<string>  $matched
     */
    private function isAccepted(array $expectedTokens, array $matched, float $score): bool
    {
        if ($score < self::ACCEPT_THRESHOLD) {
            return false;
        }

        $expectedCount = count($expectedTokens);
        $matchedCount = count($matched);

        // Single-token names need a solid token (≥ 4 chars) and full match.
        if ($expectedCount === 1) {
            return $matchedCount === 1 && strlen($expectedTokens[0]) >= 4;
        }

        // Multi-token: require at least 2 shared tokens (or all expected if only 2).
        return $matchedCount >= min(2, $expectedCount);
    }

    /**
     * @return list<string>
     */
    public function tokenize(string $name): array
    {
        $normalized = strtoupper(trim($name));
        $normalized = preg_replace('/[^A-Z0-9\s]/', ' ', $normalized) ?? '';
        $normalized = preg_replace('/\s+/', ' ', $normalized) ?? '';

        $tokens = array_values(array_filter(explode(' ', $normalized), fn (string $t) => $t !== ''));

        $tokens = array_values(array_filter(
            $tokens,
            fn (string $token) => ! in_array($token, self::TITLES, true)
                && ! in_array($token, self::CORPORATE_SUFFIXES, true)
                && strlen($token) > 1
        ));

        return array_values(array_unique($tokens));
    }
}
