<?php

namespace App\Services\Zeus;

class TotpService
{
    public function generateSecret(): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < 16; $i++) {
            $secret .= $chars[random_int(0, 31)];
        }

        return $secret;
    }

    public function getQrCodeUrl(string $label, string $secret, string $issuer): string
    {
        $otpauthUrl = 'otpauth://totp/'.rawurlencode($label).'?secret='.$secret.'&issuer='.rawurlencode($issuer);

        return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data='.urlencode($otpauthUrl);
    }

    public function verify(string $secret, string $code, int $window = 1): bool
    {
        $currentTimeSlice = (int) floor(time() / 30);
        for ($i = -$window; $i <= $window; $i++) {
            if ($this->getTotpCode($secret, $currentTimeSlice + $i) === $code) {
                return true;
            }
        }

        return false;
    }

    public function getTotpCode(string $secret, ?int $timeSlice = null): ?string
    {
        if ($timeSlice === null) {
            $timeSlice = (int) floor(time() / 30);
        }

        $decodedSecret = $this->base32Decode($secret);
        if (! $decodedSecret) {
            return null;
        }

        // Pack time slice into an 8-byte binary string
        $time = pack('N*', 0).pack('N*', $timeSlice);

        // Calculate HMAC-SHA1 hash
        $hmac = hash_hmac('sha1', $time, $decodedSecret, true);

        // Dynamic truncation to extract a 4-byte offset part
        $offset = ord(substr($hmac, -1)) & 0x0F;
        $hashpart = substr($hmac, $offset, 4);

        // Unpack integer value and mask off the most significant bit
        $value = unpack('N', $hashpart);
        $value = $value[1] & 0x7FFFFFFF;

        // Perform modulo arithmetic to get a 6-digit code
        $code = $value % 1000000;

        return str_pad((string) $code, 6, '0', STR_PAD_LEFT);
    }

    private function base32Decode(string $base32): ?string
    {
        $base32 = strtoupper($base32);
        if (! preg_match('/^[A-Z2-7]+$/', $base32)) {
            return null;
        }

        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $binary = '';
        foreach (str_split($base32) as $char) {
            $val = strpos($alphabet, $char);
            $binary .= str_pad(decbin($val), 5, '0', STR_PAD_LEFT);
        }

        $bytes = '';
        foreach (str_split($binary, 8) as $byte) {
            if (strlen($byte) === 8) {
                $bytes .= chr((int) bindec($byte));
            }
        }

        return $bytes;
    }
}
