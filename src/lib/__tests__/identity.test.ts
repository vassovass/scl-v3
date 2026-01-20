/**
 * Identity Module Tests
 * 
 * Tests for centralized user identity constants and utilities.
 * @see PRD 43: Nickname Primary Identity
 */

import { describe, it, expect } from 'vitest';
import {
    IDENTITY_FIELD,
    IDENTITY_LABEL,
    IDENTITY_PLACEHOLDER,
    IDENTITY_DESCRIPTION,
    IDENTITY_FALLBACK,
    getDisplayName,
    type UserIdentity,
} from '../identity';

describe('Identity Constants', () => {
    describe('IDENTITY_FIELD', () => {
        it('equals "display_name"', () => {
            expect(IDENTITY_FIELD).toBe('display_name');
        });

        it('is a const type for type safety', () => {
            // TypeScript ensures this at compile time
            const field: 'display_name' = IDENTITY_FIELD;
            expect(field).toBe('display_name');
        });
    });

    describe('IDENTITY_LABEL', () => {
        it('equals "Display Name"', () => {
            expect(IDENTITY_LABEL).toBe('Display Name');
        });

        it('is user-friendly (not a database column name)', () => {
            expect(IDENTITY_LABEL).not.toContain('_');
            expect(IDENTITY_LABEL[0]).toBe(IDENTITY_LABEL[0].toUpperCase());
        });
    });

    describe('IDENTITY_PLACEHOLDER', () => {
        it('provides helpful placeholder text', () => {
            expect(IDENTITY_PLACEHOLDER).toBe('Your display name');
        });
    });

    describe('IDENTITY_DESCRIPTION', () => {
        it('explains the purpose of the field', () => {
            expect(IDENTITY_DESCRIPTION).toContain('appear');
            expect(IDENTITY_DESCRIPTION).toContain('leaderboards');
        });
    });

    describe('IDENTITY_FALLBACK', () => {
        it('equals "Anonymous"', () => {
            expect(IDENTITY_FALLBACK).toBe('Anonymous');
        });
    });
});

describe('getDisplayName()', () => {
    it('returns display_name when set', () => {
        const user = { display_name: 'John Doe' };
        expect(getDisplayName(user)).toBe('John Doe');
    });

    it('returns fallback when display_name is null', () => {
        const user = { display_name: null };
        expect(getDisplayName(user)).toBe('Anonymous');
    });

    it('returns fallback when display_name is undefined', () => {
        const user = { display_name: undefined };
        expect(getDisplayName(user)).toBe('Anonymous');
    });

    it('returns fallback when display_name is empty string', () => {
        const user = { display_name: '' };
        expect(getDisplayName(user)).toBe('Anonymous');
    });

    it('returns fallback when user is null', () => {
        expect(getDisplayName(null)).toBe('Anonymous');
    });

    it('returns fallback when user is undefined', () => {
        expect(getDisplayName(undefined)).toBe('Anonymous');
    });

    it('handles users with extra properties', () => {
        const user = {
            id: 'user-123',
            display_name: 'Jane Smith',
            email: 'jane@example.com'
        };
        expect(getDisplayName(user)).toBe('Jane Smith');
    });
});

describe('UserIdentity type', () => {
    it('can be used for type-safe user objects', () => {
        // This is a compile-time check - if it compiles, the type works
        const identity: UserIdentity = { display_name: 'Test User' };
        expect(identity.display_name).toBe('Test User');
    });

    it('allows null values', () => {
        const identity: UserIdentity = { display_name: null };
        expect(identity.display_name).toBeNull();
    });
});
