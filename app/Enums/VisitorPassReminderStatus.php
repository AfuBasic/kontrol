<?php

namespace App\Enums;

enum VisitorPassReminderStatus: string
{
    case Scheduled = 'scheduled';
    case Sending = 'sending';
    case Sent = 'sent';
    case Cancelled = 'cancelled';
    case Failed = 'failed';
}
