<?php

namespace App\Enums;

enum AccessCodeSource: string
{
    case Web = 'web';
    case Telegram = 'telegram';
}
