<?php

namespace App\Enums;

enum TelegramCallbackAction: string
{
    case LinkAccount = 'link_account';
    case MainMenu = 'main_menu';
    case GenerateCode = 'generate_code';
    case SelectDuration = 'select_duration';
    case ViewCodes = 'view_codes';
    case RevokeCode = 'revoke_code';
    case ConfirmRevoke = 'confirm_revoke';
    case EstateInfo = 'estate_info';
    case Cancel = 'cancel';
}
