<?php

namespace App\Support;

class MaskedEmail
{
    /**
     * Hide most of an email address while keeping enough for someone to recognise it as theirs.
     *
     * afutunde@gmail.com becomes a•••••e@gmail.com: first and last character of the part before the @,
     * the whole domain. The number of dots is fixed so the length of the address is not given away.
     * A one or two character name shows only its first character.
     */
    public static function mask(?string $email): string
    {
        $email = trim((string) $email);
        $at = strrpos($email, '@');

        if ($at === false || $at === 0) {
            return $email === '' ? '' : '•••••';
        }

        $local = mb_substr($email, 0, $at);
        $domain = substr($email, $at);

        $first = mb_substr($local, 0, 1);
        $last = mb_strlen($local) > 2 ? mb_substr($local, -1) : '';

        return $first.'•••••'.$last.$domain;
    }
}
