<?php

namespace App\Services;

use App\Ai\Agents\EstateBoardDraftAgent;
use App\Ai\Agents\EstateBoardEnhanceAgent;
use Laravel\Ai\Enums\Lab;

class ContentEnhancerService
{
    /**
     * @param  array{category?: string|null, priority?: string|null, audience?: string|null}  $context
     */
    public function enhanceEstateBoardPost(string $content, ?string $title = null, array $context = []): string
    {
        $response = (new EstateBoardEnhanceAgent)->prompt(
            $this->buildEnhancePrompt($content, $title, $context),
            provider: Lab::Gemini,
        );

        return trim((string) $response);
    }

    /**
     * @param  array{category?: string|null, priority?: string|null, audience?: string|null}  $context
     * @return array{title: string|null, body: string}
     */
    public function draftEstateBoardPost(string $brief, ?string $title = null, array $context = []): array
    {
        $response = (new EstateBoardDraftAgent)->prompt(
            $this->buildDraftPrompt($brief, $title, $context),
            provider: Lab::Gemini,
        );

        return $this->parseDraftResponse(trim((string) $response), $title);
    }

    /**
     * @param  array{category?: string|null, priority?: string|null, audience?: string|null}  $context
     */
    protected function buildEnhancePrompt(string $content, ?string $title, array $context): string
    {
        $contextLines = $this->formatContextLines($context);

        $titleContext = $title
            ? "The post has a title: \"{$title}\""
            : 'The post has no title';

        return <<<PROMPT
Please enhance the following estate board post for clarity and engagement. {$titleContext}
{$contextLines}

Original content:
{$content}

Enhanced content:
PROMPT;
    }

    /**
     * @param  array{category?: string|null, priority?: string|null, audience?: string|null}  $context
     */
    protected function buildDraftPrompt(string $brief, ?string $title, array $context): string
    {
        $contextLines = $this->formatContextLines($context);

        $titleContext = $title
            ? "Use this title if appropriate: \"{$title}\""
            : 'Suggest a clear, concise title';

        return <<<PROMPT
Draft an estate board announcement from the following brief. {$titleContext}
{$contextLines}

Brief:
{$brief}

Required format:
TITLE: [title]
BODY:
[content]
PROMPT;
    }

    /**
     * @param  array{category?: string|null, priority?: string|null, audience?: string|null}  $context
     */
    protected function formatContextLines(array $context): string
    {
        $lines = [];

        if (! empty($context['category'])) {
            $lines[] = "Category: {$context['category']}";
        }

        if (! empty($context['priority'])) {
            $lines[] = "Priority: {$context['priority']}";
        }

        if (! empty($context['audience'])) {
            $lines[] = "Audience: {$context['audience']}";
        }

        if ($lines === []) {
            return '';
        }

        return "Context:\n- ".implode("\n- ", $lines);
    }

    /**
     * @return array{title: string|null, body: string}
     */
    protected function parseDraftResponse(string $response, ?string $fallbackTitle): array
    {
        if (preg_match('/TITLE:\s*(.+?)\s*BODY:\s*(.+)$/si', $response, $matches)) {
            $parsedTitle = trim($matches[1]);
            $parsedBody = trim($matches[2]);

            return [
                'title' => $parsedTitle !== '' ? $parsedTitle : $fallbackTitle,
                'body' => $parsedBody,
            ];
        }

        return [
            'title' => $fallbackTitle,
            'body' => $response,
        ];
    }
}
