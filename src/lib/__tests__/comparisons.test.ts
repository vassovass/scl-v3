/**
 * Tests for SEO Comparison Pages - Modular Feature System
 */

import {
    competitors,
    getCompetitorBySlug,
    getAllCompetitorSlugs,
    buildFeatureComparison,
    getFeaturesByCategory,
    getCategoryDisplayName,
    getStepLeaguePros,
    FEATURE_REGISTRY,
    STEPLEAGUE_FEATURES,
} from '../compare/comparisons';

describe('Comparison Data Module', () => {
    describe('FEATURE_REGISTRY', () => {
        it('should have all required feature categories', () => {
            const categories = new Set(Object.values(FEATURE_REGISTRY).map(f => f.category));
            expect(categories.has('devices')).toBe(true);
            expect(categories.has('features')).toBe(true);
            expect(categories.has('social')).toBe(true);
            expect(categories.has('pricing')).toBe(true);
            expect(categories.has('tone')).toBe(true);
        });

        it('should have unique feature IDs', () => {
            const ids = Object.keys(FEATURE_REGISTRY);
            const uniqueIds = new Set(ids);
            expect(ids.length).toBe(uniqueIds.size);
        });

        it('each feature should have name and category', () => {
            Object.values(FEATURE_REGISTRY).forEach(feature => {
                expect(feature.name).toBeTruthy();
                expect(feature.category).toBeTruthy();
                expect(feature.id).toBeTruthy();
            });
        });
    });

    describe('STEPLEAGUE_FEATURES', () => {
        it('should include key differentiating features', () => {
            expect(STEPLEAGUE_FEATURES.has('ai_verification')).toBe(true);
            expect(STEPLEAGUE_FEATURES.has('any_device')).toBe(true);
            expect(STEPLEAGUE_FEATURES.has('high_fives')).toBe(true);
            expect(STEPLEAGUE_FEATURES.has('supportive_tone')).toBe(true);
            expect(STEPLEAGUE_FEATURES.has('free_tier')).toBe(true);
        });

        it('should reference valid feature IDs', () => {
            STEPLEAGUE_FEATURES.forEach(featureId => {
                expect(FEATURE_REGISTRY[featureId]).toBeDefined();
            });
        });
    });

    describe('competitors', () => {
        it('should have at least 5 competitors', () => {
            expect(competitors.length).toBeGreaterThanOrEqual(5);
        });

        it('each competitor should have required fields', () => {
            competitors.forEach(competitor => {
                expect(competitor.slug).toBeTruthy();
                expect(competitor.name).toBeTruthy();
                expect(competitor.shortName).toBeTruthy();
                expect(competitor.tagline).toBeTruthy();
                expect(competitor.website).toMatch(/^https?:\/\//);
                expect(competitor.logoEmoji).toBeTruthy();
                expect(competitor.hasFeatures).toBeInstanceOf(Set);
                expect(competitor.comparisonFeatures.length).toBeGreaterThan(0);
                expect(competitor.pricing).toBeDefined();
                expect(competitor.cons.length).toBeGreaterThan(0);
                expect(competitor.faqs.length).toBeGreaterThan(0);
                expect(competitor.verdict.chooseStepleague).toBeTruthy();
                expect(competitor.verdict.chooseCompetitor).toBeTruthy();
            });
        });

        it('should have unique slugs', () => {
            const slugs = competitors.map(c => c.slug);
            const uniqueSlugs = new Set(slugs);
            expect(slugs.length).toBe(uniqueSlugs.size);
        });

        it('each competitor hasFeatures should reference valid feature IDs', () => {
            competitors.forEach(competitor => {
                competitor.hasFeatures.forEach(featureId => {
                    expect(FEATURE_REGISTRY[featureId]).toBeDefined();
                });
            });
        });

        it('each competitor comparisonFeatures should reference valid feature IDs', () => {
            competitors.forEach(competitor => {
                competitor.comparisonFeatures.forEach(featureId => {
                    expect(FEATURE_REGISTRY[featureId]).toBeDefined();
                });
            });
        });
    });

    describe('getCompetitorBySlug', () => {
        it('should return competitor for valid slug', () => {
            const fitbit = getCompetitorBySlug('fitbit');
            expect(fitbit).toBeDefined();
            expect(fitbit?.name).toBe('Fitbit Challenges');
        });

        it('should return undefined for invalid slug', () => {
            const unknown = getCompetitorBySlug('nonexistent');
            expect(unknown).toBeUndefined();
        });
    });

    describe('getAllCompetitorSlugs', () => {
        it('should return array of slugs', () => {
            const slugs = getAllCompetitorSlugs();
            expect(Array.isArray(slugs)).toBe(true);
            expect(slugs.length).toBe(competitors.length);
            expect(slugs).toContain('fitbit');
            expect(slugs).toContain('strava');
        });
    });

    describe('buildFeatureComparison', () => {
        it('should build comparison for a competitor', () => {
            const fitbit = getCompetitorBySlug('fitbit')!;
            const comparison = buildFeatureComparison(fitbit);

            expect(Array.isArray(comparison)).toBe(true);
            expect(comparison.length).toBeGreaterThan(0);

            comparison.forEach(feature => {
                expect(feature.id).toBeTruthy();
                expect(feature.name).toBeTruthy();
                expect(typeof feature.stepleague).toBe('boolean');
                expect(typeof feature.competitor).toBe('boolean');
                expect(feature.category).toBeTruthy();
            });
        });

        it('should correctly identify StepLeague features', () => {
            const fitbit = getCompetitorBySlug('fitbit')!;
            const comparison = buildFeatureComparison(fitbit);

            const aiVerification = comparison.find(f => f.id === 'ai_verification');
            expect(aiVerification?.stepleague).toBe(true);
            expect(aiVerification?.competitor).toBe(false);
        });
    });

    describe('getFeaturesByCategory', () => {
        it('should group features by category', () => {
            const fitbit = getCompetitorBySlug('fitbit')!;
            const comparison = buildFeatureComparison(fitbit);
            const grouped = getFeaturesByCategory(comparison);

            expect(grouped.devices).toBeDefined();
            expect(grouped.features).toBeDefined();
            expect(grouped.social).toBeDefined();
            expect(grouped.pricing).toBeDefined();
            expect(grouped.tone).toBeDefined();
        });

        it('should not lose any features during grouping', () => {
            const fitbit = getCompetitorBySlug('fitbit')!;
            const comparison = buildFeatureComparison(fitbit);
            const grouped = getFeaturesByCategory(comparison);

            const totalGrouped = Object.values(grouped).flat().length;
            expect(totalGrouped).toBe(comparison.length);
        });
    });

    describe('getCategoryDisplayName', () => {
        it('should return human-readable names', () => {
            expect(getCategoryDisplayName('devices')).toBe('Device Compatibility');
            expect(getCategoryDisplayName('features')).toBe('Features');
            expect(getCategoryDisplayName('social')).toBe('Social & Rankings');
            expect(getCategoryDisplayName('pricing')).toBe('Pricing');
            expect(getCategoryDisplayName('tone')).toBe('Tone & Community');
        });
    });

    describe('getStepLeaguePros', () => {
        it('should return array of pros', () => {
            const pros = getStepLeaguePros();
            expect(Array.isArray(pros)).toBe(true);
            expect(pros.length).toBeGreaterThan(0);
            pros.forEach(pro => {
                expect(typeof pro).toBe('string');
                expect(pro.length).toBeGreaterThan(0);
            });
        });
    });

    describe('FAQ data for JSON-LD schema', () => {
        it('each competitor should have valid FAQ structure', () => {
            competitors.forEach(competitor => {
                expect(competitor.faqs.length).toBeGreaterThanOrEqual(3);
                competitor.faqs.forEach(faq => {
                    expect(faq.question).toBeTruthy();
                    expect(faq.question.endsWith('?')).toBe(true);
                    expect(faq.answer).toBeTruthy();
                    expect(faq.answer.length).toBeGreaterThan(20);
                });
            });
        });
    });
});
