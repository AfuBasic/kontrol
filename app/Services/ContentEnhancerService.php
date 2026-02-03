<?php

namespace App\Services;

use Prism\Prism\Enums\Provider;
use Prism\Prism\Prism;

class ContentEnhancerService
{
    protected const MODEL = 'claude-sonnet-4-5-20250929';

    /**
     * Enhance estate board post content for clarity and engagement.
     */
    public function enhanceEstateBoardPost(string $content, ?string $title = null): string
    {
        $context = $title
            ? "The post has a title: \"{$title}\""
            : 'The post has no title';

        $response = (new Prism)
            ->text()
            ->using(Provider::Anthropic, self::MODEL)
            ->withSystemPrompt($this->getSystemPrompt())
            ->withPrompt($this->buildPrompt($content, $context))
            ->asText();

        return trim($response->text);
    }

    protected function getSystemPrompt(): string
    {
        return <<<'PROMPT'
You are an expert copywriter specializing in community communications for residential estates. Your task is to enhance announcements and posts to be clear, engaging, and professional while maintaining a warm community tone.

Guidelines:
- Keep the core message and intent intact
- Use clear, concise language
- Maintain a professional yet friendly tone appropriate for estate communications
- Ensure important information stands out
- Fix grammar and spelling issues
- Improve structure and readability
- Keep announcements focused and actionable when appropriate
- Do not add information that wasn't in the original
- Do not use excessive emojis or informal language
- Respond ONLY with the enhanced content, no explanations or preambles
PROMPT;
    }

    protected function buildPrompt(string $content, string $context): string
    {
        return <<<PROMPT
Please enhance the following estate board post for clarity and engagement. {$context}

Original content:
{$content}

Enhanced content:
PROMPT;
    }
}
