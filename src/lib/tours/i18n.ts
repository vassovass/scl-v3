/**
 * i18n Configuration for Tours
 * 
 * Configures react-i18next for tour translations:
 * - Browser language detection
 * - Fallback to English
 * - Lazy loading of translations
 * - RTL support
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ═══════════════════════════════════════════════════════════════════════════
// RTL LANGUAGE SUPPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Languages that require right-to-left text direction
 */
export const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

/**
 * Check if a language uses RTL direction
 */
export function isRTL(language: string): boolean {
    return RTL_LANGUAGES.includes(language);
}

// ═══════════════════════════════════════════════════════════════════════════
// i18n INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

// Create tour-specific i18n instance (doesn't conflict with main app)
const tourI18n = i18n.createInstance();

/**
 * Initialize tour i18n
 * Call this at app startup
 */
export async function initTourI18n(): Promise<void> {
    // Skip if already initialized
    if (tourI18n.isInitialized) return;

    await tourI18n
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
            // Default language
            fallbackLng: 'en',

            // Debug mode for development
            debug: process.env.NODE_ENV === 'development',

            // Namespace for tour translations
            ns: ['tours'],
            defaultNS: 'tours',

            // Language detection settings
            detection: {
                // Order of detection
                order: ['localStorage', 'navigator', 'htmlTag'],
                // Cache detected language
                caches: ['localStorage'],
                // localStorage key
                lookupLocalStorage: 'stepleague-lang',
            },

            // Interpolation config
            interpolation: {
                escapeValue: false, // React already escapes
            },

            // React config
            react: {
                useSuspense: false, // Disable suspense for tours
            },

            // Resources will be loaded lazily
            resources: {},
        });
}

// ═══════════════════════════════════════════════════════════════════════════
// LAZY LOADING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Load tour translations for a specific language
 * 
 * @param language - Language code (e.g., 'en', 'es')
 */
export async function loadTourTranslations(language: string): Promise<void> {
    // Check if already loaded
    if (tourI18n.hasResourceBundle(language, 'tours')) {
        return;
    }

    try {
        // Dynamic import of translation file
        const translations = await import(`@/locales/${language}/tours.json`);

        tourI18n.addResourceBundle(
            language,
            'tours',
            translations.default || translations,
            true,
            true
        );
    } catch (error) {
        console.warn(`[TourI18n] Failed to load translations for ${language}, falling back to English`);

        // Load English as fallback
        if (language !== 'en') {
            await loadTourTranslations('en');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { tourI18n };

/**
 * Get translated content for a tour step
 * 
 * @param contentKey - Translation key
 * @param options - i18next interpolation options
 * @returns Translated string
 */
export function t(contentKey: string, options?: Record<string, unknown>): string {
    return tourI18n.t(contentKey, options) || contentKey;
}

/**
 * Get current language
 */
export function getCurrentLanguage(): string {
    return tourI18n.language || 'en';
}

/**
 * Change tour language
 */
export async function changeLanguage(language: string): Promise<void> {
    await loadTourTranslations(language);
    await tourI18n.changeLanguage(language);

    // Update document direction for RTL languages
    if (typeof document !== 'undefined') {
        document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr';
    }
}
