<?php

namespace App\Enums;

enum SecurityEventType: string
{
    case NewDeviceAttempt = 'new_device_attempt';
    case DeviceVerificationSent = 'device_verification_sent';
    case DeviceAuthorized = 'device_authorized';
    case DeviceDenied = 'device_denied';
    case TrustedDeviceRevoked = 'trusted_device_revoked';
    case RevokedDeviceAttempt = 'revoked_device_attempt';
    case RepeatedFailedAuthentication = 'repeated_failed_authentication';
    case LoginRateLimitTriggered = 'login_rate_limit_triggered';

    public function label(): string
    {
        return match ($this) {
            self::NewDeviceAttempt => 'New device sign-in',
            self::DeviceVerificationSent => 'Device verification sent',
            self::DeviceAuthorized => 'Device authorized',
            self::DeviceDenied => 'Device denied',
            self::TrustedDeviceRevoked => 'Trusted device removed',
            self::RevokedDeviceAttempt => 'Revoked device sign-in',
            self::RepeatedFailedAuthentication => 'Repeated sign-in failures',
            self::LoginRateLimitTriggered => 'Sign-in temporarily limited',
        };
    }
}
