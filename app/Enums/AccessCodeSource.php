<?php

namespace App\Enums;

enum AccessCodeSource: string
{
    case Web = 'web';
    case Telegram = 'telegram';
    case BulkInvite = 'bulk_invite';
}
