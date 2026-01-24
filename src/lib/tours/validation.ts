/**
 * Interactive Step Validation System
 * 
 * Enables "learn by doing" tours where users complete real tasks.
 * Supports three validation types:
 * - Event-based: Wait for an analytics event (e.g., 'league_created')
 * - Element-based: Wait for a DOM element to appear
 * - Timeout-based: Auto-advance after a delay
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import type { ValidationResult, InteractiveValidation } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VALIDATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate a tour step based on its validation configuration
 * 
 * @param config - Validation configuration from the step
 * @returns Promise resolving to validation result
 */
export async function validateStep(
    config: InteractiveValidation
): Promise<ValidationResult> {
    switch (config.type) {
        case 'event':
            if (!config.event) {
                console.warn('[TourValidation] Event validation requires event name');
                return { success: false, reason: 'not_found' };
            }
            return validateByEvent(config.event, config.timeout);

        case 'element':
            if (!config.element) {
                console.warn('[TourValidation] Element validation requires selector');
                return { success: false, reason: 'not_found' };
            }
            return validateByElement(config.element, config.timeout);

        case 'timeout':
            return validateByTimeout(config.timeout);

        default:
            console.warn('[TourValidation] Unknown validation type:', config.type);
            return { success: true }; // Default to success for unknown types
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT-BASED VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

// Event listener registry for cleanup
const eventListeners = new Map<string, () => void>();

/**
 * Validate by waiting for an analytics event
 * 
 * Example: Wait for 'league_created' event after user creates a league
 * 
 * @param eventName - The analytics event to wait for
 * @param timeout - Maximum time to wait in milliseconds
 */
async function validateByEvent(
    eventName: string,
    timeout: number
): Promise<ValidationResult> {
    return new Promise((resolve) => {
        let timeoutId: ReturnType<typeof setTimeout>;

        // Create event handler
        const handleEvent = (event: CustomEvent<{ eventName: string }>) => {
            if (event.detail?.eventName === eventName) {
                clearTimeout(timeoutId);
                cleanup();
                resolve({ success: true });
            }
        };

        // Cleanup function
        const cleanup = () => {
            window.removeEventListener('tour-validation-event', handleEvent as EventListener);
            eventListeners.delete(eventName);
        };

        // Register listener
        window.addEventListener('tour-validation-event', handleEvent as EventListener);
        eventListeners.set(eventName, cleanup);

        // Timeout handler
        timeoutId = setTimeout(() => {
            cleanup();
            resolve({ success: false, reason: 'timeout' });
        }, timeout);
    });
}

/**
 * Dispatch a validation event (call this from analytics when events fire)
 * 
 * @param eventName - The event name that occurred
 */
export function dispatchValidationEvent(eventName: string): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(
        new CustomEvent('tour-validation-event', {
            detail: { eventName },
        })
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// ELEMENT-BASED VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate by checking for DOM element presence
 * 
 * Example: Wait for a league card to appear after creation
 * 
 * @param selector - CSS selector for the element
 * @param timeout - Maximum time to wait in milliseconds
 */
async function validateByElement(
    selector: string,
    timeout: number
): Promise<ValidationResult> {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let cancelled = false;

        const checkElement = () => {
            if (cancelled) return;

            const element = document.querySelector(selector);

            if (element) {
                resolve({ success: true });
                return;
            }

            if (Date.now() - startTime > timeout) {
                resolve({ success: false, reason: 'timeout' });
                return;
            }

            // Check again in 500ms (MutationObserver would be more efficient but this is simpler)
            setTimeout(checkElement, 500);
        };

        // Start checking
        checkElement();

        // Store cancel function for cleanup
        return () => {
            cancelled = true;
        };
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMEOUT-BASED VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate by timeout (automatic proceed after delay)
 * 
 * Example: Show a tip for 10 seconds, then auto-advance
 * 
 * @param timeout - Time to wait before auto-advancing
 */
async function validateByTimeout(timeout: number): Promise<ValidationResult> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ success: true });
        }, timeout);
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// CLEANUP UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Cancel all pending validations
 * Call this when tour is skipped or completed
 */
export function cancelAllValidations(): void {
    eventListeners.forEach((cleanup) => cleanup());
    eventListeners.clear();
}
