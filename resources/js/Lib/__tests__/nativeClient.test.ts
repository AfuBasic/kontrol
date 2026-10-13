import { describe, expect, it } from 'vitest';
import { clientHeaders, nativeHeaders } from '../nativeClient';

describe('clientHeaders', () => {
    it('says it is the app, which system it runs on and its version', () => {
        expect(clientHeaders('ios', '1.4.2')).toEqual({ 'X-Capacitor-App': 'true', 'X-App-Platform': 'ios', 'X-App-Version': '1.4.2' });
        expect(clientHeaders('android', '1.4.0')).toEqual({ 'X-Capacitor-App': 'true', 'X-App-Platform': 'android', 'X-App-Version': '1.4.0' });
    });

    it('leaves the version out until the app has reported it', () => {
        expect(clientHeaders('ios', null)).toEqual({ 'X-Capacitor-App': 'true', 'X-App-Platform': 'ios' });
    });

    it('never sends a platform other than ios or android', () => {
        expect(clientHeaders('web', '1.0.0')).toEqual({ 'X-Capacitor-App': 'true', 'X-App-Version': '1.0.0' });
    });
});

describe('nativeHeaders', () => {
    it('adds nothing in a web browser', () => {
        expect(nativeHeaders()).toEqual({});
    });
});
