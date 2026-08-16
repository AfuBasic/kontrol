<?php

namespace App\Support;

use App\Enums\IncidentCategory;
use JsonSerializable;

class IncidentCategoryVal implements JsonSerializable
{
    public string $value;

    public function __construct(string $value)
    {
        $this->value = $value;
    }

    public function label(): string
    {
        $enum = IncidentCategory::tryFrom($this->value);

        return $enum ? $enum->label() : ucwords(str_replace('_', ' ', $this->value));
    }

    public function jsonSerialize(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
