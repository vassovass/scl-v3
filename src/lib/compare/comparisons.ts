/**
 * SEO Comparison Pages - Modular Feature & Competitor System
 * 
 * Features are defined once in a registry, then composed per competitor.
 * This makes it easy to add new features and ensures consistency.
 */

// =============================================================================
// FEATURE REGISTRY - Single source of truth for all features
// =============================================================================

export type FeatureCategory = 'devices' | 'features' | 'social' | 'pricing' | 'tone';

export interface FeatureDefinition {
    id: string;
    name: string;
    description?: string;
    category: FeatureCategory;
}

/**
 * Master list of all features we compare across competitors.
 * Each feature has a unique ID used to reference it in competitor configs.
 */
export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
    // Devices
    any_device: { id: 'any_device', name: 'Works with any device', category: 'devices' },
    apple_watch: { id: 'apple_watch', name: 'Works with Apple Watch', category: 'devices' },
    garmin: { id: 'garmin', name: 'Works with Garmin', category: 'devices' },
    samsung: { id: 'samsung', name: 'Works with Samsung', category: 'devices' },
    fitbit_device: { id: 'fitbit_device', name: 'Works with Fitbit', category: 'devices' },
    android: { id: 'android', name: 'Works with Android', category: 'devices' },
    smartphone_only: { id: 'smartphone_only', name: 'Smartphone-only tracking', category: 'devices' },

    // Features
    ai_verification: { id: 'ai_verification', name: 'AI screenshot verification', category: 'features' },
    duplicate_handling: { id: 'duplicate_handling', name: 'Smart duplicate handling', category: 'features' },
    offline_pwa: { id: 'offline_pwa', name: 'Offline mode / PWA', category: 'features' },
    gps_tracking: { id: 'gps_tracking', name: 'GPS route tracking', category: 'features' },
    workout_videos: { id: 'workout_videos', name: 'Workout video library', category: 'features' },
    advanced_metrics: { id: 'advanced_metrics', name: 'Advanced health metrics', category: 'features' },
    step_focus: { id: 'step_focus', name: 'Step counting focus', category: 'features' },
    running_focus: { id: 'running_focus', name: 'Running/cycling focus', category: 'features' },

    // Social & Rankings
    daily_weekly_leaderboard: { id: 'daily_weekly_leaderboard', name: 'Daily/weekly leaderboards', category: 'social' },
    global_leaderboard: { id: 'global_leaderboard', name: 'Global world leaderboard', category: 'social' },
    team_challenges: { id: 'team_challenges', name: 'Team/group challenges', category: 'social' },
    private_leagues: { id: 'private_leagues', name: 'Private leagues', category: 'social' },
    public_leagues: { id: 'public_leagues', name: 'Public leagues', category: 'social' },
    social_feed: { id: 'social_feed', name: 'Social activity feed', category: 'social' },

    // Tone & Community  
    high_fives: { id: 'high_fives', name: '"High Five" encouragement', category: 'tone' },
    supportive_tone: { id: 'supportive_tone', name: 'Supportive (vs purely competitive)', category: 'tone' },
    mindful_messaging: { id: 'mindful_messaging', name: 'Mindful, positive messaging', category: 'tone' },
    consistency_focus: { id: 'consistency_focus', name: 'Focus on consistency over winning', category: 'tone' },

    // Pricing
    free_tier: { id: 'free_tier', name: 'Free tier available', category: 'pricing' },
    no_hardware: { id: 'no_hardware', name: 'No hardware purchase required', category: 'pricing' },
    no_subscription: { id: 'no_subscription', name: 'No subscription required', category: 'pricing' },
    individual_signup: { id: 'individual_signup', name: 'Individual signups allowed', category: 'pricing' },
    enterprise_only: { id: 'enterprise_only', name: 'Enterprise/corporate only', category: 'pricing' },
} as const;

// =============================================================================
// STEPLEAGUE FEATURES - What we offer (constant across all comparisons)
// =============================================================================

/** Features that StepLeague has (used as baseline for all comparisons) */
export const STEPLEAGUE_FEATURES = new Set([
    'any_device', 'apple_watch', 'garmin', 'samsung', 'fitbit_device', 'android', 'smartphone_only',
    'ai_verification', 'duplicate_handling', 'offline_pwa', 'step_focus',
    'daily_weekly_leaderboard', 'global_leaderboard', 'team_challenges', 'private_leagues', 'public_leagues',
    'high_fives', 'supportive_tone', 'mindful_messaging', 'consistency_focus',
    'free_tier', 'no_hardware', 'no_subscription', 'individual_signup',
]);

/** StepLeague pros (shared across all comparisons) */
export const STEPLEAGUE_PROS = [
    "Works with any device or fitness app",
    "AI-powered verification ensures fair play",
    "Free forever tier with full features",
    "Supportive community with High Fives",
    "Perfect for workplace and family challenges",
];

// =============================================================================
// COMPETITOR TYPES
// =============================================================================

export interface FAQ {
    question: string;
    answer: string;
}

export interface FeatureComparison {
    id: string;
    name: string;
    stepleague: boolean;
    competitor: boolean;
    category: FeatureCategory;
}

export interface Competitor {
    slug: string;
    name: string;
    shortName: string;
    tagline: string;
    website: string;
    logoEmoji: string;
    /** Feature IDs this competitor has */
    hasFeatures: Set<string>;
    /** Which features to show in comparison (subset for focused comparison) */
    comparisonFeatures: string[];
    pricing: {
        stepleague: string;
        competitor: string;
        notes: string;
    };
    cons: string[];
    faqs: FAQ[];
    verdict: {
        chooseStepleague: string;
        chooseCompetitor: string;
    };
}

// =============================================================================
// COMPETITOR DEFINITIONS
// =============================================================================

const competitorConfigs: (Omit<Competitor, 'hasFeatures'> & { hasFeatures: string[] })[] = [
    {
        slug: "stepleague-vs-fitbit",
        name: "Fitbit Challenges",
        shortName: "Fitbit",
        tagline: "Popular fitness tracker with built-in challenges",
        website: "https://www.fitbit.com",
        logoEmoji: "⌚",
        hasFeatures: [
            'fitbit_device', 'smartphone_only',
            'daily_weekly_leaderboard', 'team_challenges', 'private_leagues',
            'free_tier',
        ],
        comparisonFeatures: [
            'any_device', 'apple_watch', 'garmin', 'samsung',
            'ai_verification', 'duplicate_handling', 'offline_pwa',
            'daily_weekly_leaderboard', 'global_leaderboard', 'team_challenges', 'private_leagues',
            'high_fives', 'supportive_tone', 'mindful_messaging', 'consistency_focus',
            'free_tier', 'no_hardware',
        ],
        pricing: {
            stepleague: "Free (Premium coming soon)",
            competitor: "Free app + $100-300 device required",
            notes: "Fitbit requires purchasing a Fitbit device. StepLeague works with any device you already own.",
        },
        cons: [
            "Newer platform, smaller community",
            "No direct device sync (screenshot-based)",
            "Premium features coming soon",
        ],
        faqs: [
            {
                question: "Is StepLeague better than Fitbit for step challenges?",
                answer: "StepLeague is better if you want to compete with people who use different devices. Fitbit challenges only work with Fitbit users, while StepLeague lets Apple Watch, Garmin, Samsung, and even smartphone-only users compete together.",
            },
            {
                question: "Can I use my Fitbit with StepLeague?",
                answer: "Yes! Simply take a screenshot of your Fitbit app's daily step count and upload it to StepLeague. Our AI verifies the steps automatically.",
            },
            {
                question: "How is StepLeague's tone different from Fitbit?",
                answer: "StepLeague focuses on supportive encouragement with features like High Fives and mindful messaging. We emphasize consistency and connection over pure competition.",
            },
            {
                question: "Is StepLeague free?",
                answer: "Yes, StepLeague offers a free tier with unlimited step tracking, leaderboards, and team challenges. No credit card required.",
            },
        ],
        verdict: {
            chooseStepleague: "your group uses mixed devices, you want a supportive community, or you want free challenges without buying hardware",
            chooseCompetitor: "everyone already owns a Fitbit and wants direct device sync",
        },
    },
    {
        slug: "stepleague-vs-strava",
        name: "Strava",
        shortName: "Strava",
        tagline: "Popular app for runners and cyclists",
        website: "https://www.strava.com",
        logoEmoji: "🏃",
        hasFeatures: [
            'any_device', 'gps_tracking', 'running_focus',
            'daily_weekly_leaderboard', 'team_challenges', 'social_feed',
            'free_tier',
        ],
        comparisonFeatures: [
            'step_focus', 'running_focus', 'gps_tracking',
            'ai_verification', 'offline_pwa',
            'daily_weekly_leaderboard', 'global_leaderboard', 'team_challenges',
            'high_fives', 'supportive_tone', 'consistency_focus',
            'free_tier', 'no_subscription',
        ],
        pricing: {
            stepleague: "Free (Premium coming soon)",
            competitor: "Free tier + $11.99/month for Premium",
            notes: "Strava's free tier has limited features. StepLeague's free tier includes all core features.",
        },
        cons: [
            "No GPS route tracking",
            "Focused on steps, not runs/rides",
            "No segment leaderboards",
        ],
        faqs: [
            {
                question: "Is StepLeague better than Strava for step challenges?",
                answer: "StepLeague is better for step-focused challenges. Strava is designed for runners and cyclists, with step counting as a secondary feature. StepLeague is built specifically for walking and step competitions.",
            },
            {
                question: "Can I use StepLeague and Strava together?",
                answer: "Yes! Many users track their runs in Strava and their daily steps in StepLeague. They serve different purposes.",
            },
            {
                question: "Which is more supportive: StepLeague or Strava?",
                answer: "StepLeague focuses on encouragement over competition with features like High Fives. Strava has a more competitive segment leaderboard culture.",
            },
            {
                question: "Which is better for workplace challenges?",
                answer: "StepLeague is better for workplace step challenges because it works with any device and focuses on walking, which is accessible to all fitness levels.",
            },
        ],
        verdict: {
            chooseStepleague: "you want a dedicated, supportive step challenge app for walking competitions",
            chooseCompetitor: "you're primarily a runner or cyclist who wants GPS tracking and segment leaderboards",
        },
    },
    {
        slug: "stepleague-vs-yumuuv",
        name: "YuMuuv",
        shortName: "YuMuuv",
        tagline: "Corporate wellness platform with step challenges",
        website: "https://www.yumuuv.com",
        logoEmoji: "🏢",
        hasFeatures: [
            'any_device', 'team_challenges', 'private_leagues',
            'enterprise_only',
        ],
        comparisonFeatures: [
            'any_device', 'ai_verification',
            'team_challenges', 'global_leaderboard', 'public_leagues',
            'high_fives', 'supportive_tone',
            'free_tier', 'individual_signup', 'enterprise_only',
        ],
        pricing: {
            stepleague: "Free for individuals",
            competitor: "Enterprise pricing only (contact sales)",
            notes: "YuMuuv targets corporate wellness programs. StepLeague offers free access to individuals and teams.",
        },
        cons: [
            "Less comprehensive wellness features",
            "No HR integrations (yet)",
            "Smaller enterprise focus",
        ],
        faqs: [
            {
                question: "What's the difference between StepLeague and YuMuuv?",
                answer: "StepLeague is free for individuals and small teams, while YuMuuv focuses on enterprise corporate wellness programs with per-employee pricing. If you're an individual or small group, StepLeague is the better choice.",
            },
            {
                question: "Can I use StepLeague for my company's wellness program?",
                answer: "Yes! StepLeague supports private leagues for teams. Create a league, invite your coworkers, and start competing. Enterprise features are coming soon.",
            },
            {
                question: "Is StepLeague free for workplace challenges?",
                answer: "Yes, StepLeague is currently free for all users, including workplace teams. Create a private league and invite your colleagues at no cost.",
            },
        ],
        verdict: {
            chooseStepleague: "you're an individual, small team, or want a free solution for workplace step challenges",
            chooseCompetitor: "you're a large enterprise looking for a full corporate wellness platform with HR integrations",
        },
    },
    {
        slug: "stepleague-vs-garmin",
        name: "Garmin Connect Challenges",
        shortName: "Garmin",
        tagline: "Premium fitness tracker ecosystem",
        website: "https://connect.garmin.com",
        logoEmoji: "🔺",
        hasFeatures: [
            'garmin', 'gps_tracking', 'advanced_metrics',
            'daily_weekly_leaderboard', 'team_challenges',
            'free_tier',
        ],
        comparisonFeatures: [
            'any_device', 'apple_watch', 'fitbit_device',
            'ai_verification', 'advanced_metrics',
            'daily_weekly_leaderboard', 'global_leaderboard', 'team_challenges',
            'high_fives', 'supportive_tone', 'consistency_focus',
            'free_tier', 'no_hardware',
        ],
        pricing: {
            stepleague: "Free (Premium coming soon)",
            competitor: "Free app + $200-1000+ device required",
            notes: "Garmin requires purchasing a Garmin device. StepLeague works with any device.",
        },
        cons: [
            "No advanced training metrics",
            "No GPS route tracking",
            "Less comprehensive health data",
        ],
        faqs: [
            {
                question: "Is StepLeague better than Garmin for step challenges?",
                answer: "StepLeague is better if you want to compete with people who don't have Garmin devices. Garmin challenges only work with Garmin users, while StepLeague works with any device.",
            },
            {
                question: "Can I use my Garmin with StepLeague?",
                answer: "Yes! Take a screenshot of your Garmin Connect app's step count and upload it to StepLeague. Our AI verifies it automatically.",
            },
            {
                question: "Does StepLeague have the same ranking system as Garmin?",
                answer: "StepLeague has daily/weekly leaderboards plus a global world leaderboard. We also have a supportive High Five system for encouraging teammates.",
            },
        ],
        verdict: {
            chooseStepleague: "your group uses mixed devices or you want a supportive, free step challenge platform",
            chooseCompetitor: "everyone has a Garmin and you want advanced training metrics and GPS",
        },
    },
    {
        slug: "stepleague-vs-apple-fitness",
        name: "Apple Fitness+ Competitions",
        shortName: "Apple Fitness+",
        tagline: "Apple's subscription fitness service",
        website: "https://www.apple.com/apple-fitness-plus/",
        logoEmoji: "🍎",
        hasFeatures: [
            'apple_watch', 'workout_videos',
            'daily_weekly_leaderboard',
        ],
        comparisonFeatures: [
            'any_device', 'android', 'garmin', 'fitbit_device',
            'ai_verification', 'workout_videos',
            'team_challenges', 'global_leaderboard',
            'high_fives', 'supportive_tone',
            'free_tier', 'no_subscription',
        ],
        pricing: {
            stepleague: "Free",
            competitor: "$9.99/month + Apple Watch required",
            notes: "Apple Fitness+ requires both a subscription AND an Apple Watch. StepLeague is free and works with any device.",
        },
        cons: [
            "No workout video library",
            "No Apple Health ring integrations",
            "No meditation/mindfulness content",
        ],
        faqs: [
            {
                question: "Is StepLeague better than Apple Fitness+ for step challenges?",
                answer: "StepLeague is better for step challenges if your group includes Android users or anyone without an Apple Watch. Apple's competitions only work between Apple Watch users.",
            },
            {
                question: "Can Android users join StepLeague?",
                answer: "Yes! StepLeague works with any device and any fitness app, including Google Fit, Samsung Health, and smartphone-only step counting.",
            },
            {
                question: "Is StepLeague free compared to Apple Fitness+?",
                answer: "Yes, StepLeague is completely free. Apple Fitness+ costs $9.99/month and requires an Apple Watch ($249+).",
            },
        ],
        verdict: {
            chooseStepleague: "your group includes Android users, or you want a free, supportive solution",
            chooseCompetitor: "everyone has an Apple Watch and you want workout videos and Apple's ecosystem",
        },
    },
    {
        slug: "stepleague-vs-stridekick",
        name: "Stridekick",
        shortName: "Stridekick",
        tagline: "Established team step challenge platform",
        website: "https://www.stridekick.com",
        logoEmoji: "👟",
        hasFeatures: [
            'any_device',
            'daily_weekly_leaderboard', 'team_challenges', 'private_leagues',
        ],
        comparisonFeatures: [
            'any_device', 'ai_verification',
            'daily_weekly_leaderboard', 'global_leaderboard', 'team_challenges',
            'high_fives', 'supportive_tone', 'mindful_messaging',
            'free_tier', 'no_subscription',
        ],
        pricing: {
            stepleague: "Free for individuals",
            competitor: "$4.99-9.99/month per league",
            notes: "Stridekick charges per league. StepLeague is currently free for all users.",
        },
        cons: [
            "Newer platform, smaller community",
            "Less established track record",
            "Fewer corporate integrations",
        ],
        faqs: [
            {
                question: "What's the difference between StepLeague and Stridekick?",
                answer: "StepLeague uses AI to verify step screenshots, preventing cheating. StepLeague is also free for individuals, while Stridekick charges per league. Stridekick has a larger established community after 10+ years in market.",
            },
            {
                question: "Is StepLeague free compared to Stridekick?",
                answer: "Yes, StepLeague is currently free for all users including team challenges. Stridekick charges $4.99-9.99/month per league.",
            },
            {
                question: "Which has a more supportive community?",
                answer: "StepLeague emphasizes supportive features like High Fives and mindful messaging. Both platforms offer team challenges, but StepLeague's tone is more collaborative.",
            },
        ],
        verdict: {
            chooseStepleague: "you want a free solution with AI verification and a supportive community",
            chooseCompetitor: "you need an established platform with 10+ years of corporate integrations",
        },
    },
];

// =============================================================================
// BUILD FINAL COMPETITORS
// =============================================================================

/** Convert string arrays to Sets and build full competitor objects */
export const competitors: Competitor[] = competitorConfigs.map(config => ({
    ...config,
    hasFeatures: new Set(config.hasFeatures),
}));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Get a competitor by slug */
export function getCompetitorBySlug(slug: string): Competitor | undefined {
    return competitors.find((c) => c.slug === slug);
}

/** Get all competitor slugs for static generation */
export function getAllCompetitorSlugs(): string[] {
    return competitors.map((c) => c.slug);
}

/** Build feature comparison array for a competitor */
export function buildFeatureComparison(competitor: Competitor): FeatureComparison[] {
    return competitor.comparisonFeatures
        .map(featureId => {
            const feature = FEATURE_REGISTRY[featureId];
            if (!feature) return null;

            return {
                id: feature.id,
                name: feature.name,
                stepleague: STEPLEAGUE_FEATURES.has(featureId),
                competitor: competitor.hasFeatures.has(featureId),
                category: feature.category,
            };
        })
        .filter((f): f is FeatureComparison => f !== null);
}

/** Get StepLeague pros (shared across all comparisons) */
export function getStepLeaguePros(): string[] {
    return STEPLEAGUE_PROS;
}

/** Get features grouped by category */
export function getFeaturesByCategory(features: FeatureComparison[]): Record<FeatureCategory, FeatureComparison[]> {
    const grouped: Record<FeatureCategory, FeatureComparison[]> = {
        devices: [],
        features: [],
        social: [],
        pricing: [],
        tone: [],
    };

    for (const feature of features) {
        grouped[feature.category].push(feature);
    }

    return grouped;
}

/** Get category display name */
export function getCategoryDisplayName(category: FeatureCategory): string {
    const names: Record<FeatureCategory, string> = {
        devices: 'Device Compatibility',
        features: 'Features',
        social: 'Social & Rankings',
        pricing: 'Pricing',
        tone: 'Tone & Community',
    };
    return names[category];
}

