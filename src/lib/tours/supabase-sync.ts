/**
 * Supabase Persistence for Tour Analytics
 * 
 * Stores tour completion data in Supabase for:
 * - Long-term retention analysis
 * - SQL-based cohort queries
 * - Dashboard visualizations
 * 
 * Note: Requires database migration to create tables.
 * @see supabase/migrations/20260124000000_tour_analytics_tables.sql
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

import { createClient } from '@/lib/supabase/client';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface TourCompletionRecord {
    user_id: string;
    tour_id: string;
    tour_version: string;
    completion_type: 'completed' | 'skipped';
    steps_completed: number;
    total_steps: number;
    duration_ms: number;
    experiment_variant?: string;
    completed_at?: string; // ISO timestamp
}

export interface TourStepInteractionRecord {
    user_id: string;
    tour_id: string;
    step_id: string;
    step_index: number;
    action: 'viewed' | 'completed' | 'skipped';
    duration_ms?: number;
    validation_result?: 'success' | 'timeout' | 'cancelled';
    created_at?: string; // ISO timestamp
}

export interface TourFeedbackRecord {
    user_id: string;
    tour_id: string;
    rating?: number; // 1-5
    comment?: string;
    submitted_at?: string; // ISO timestamp
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE SYNC FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save tour completion to Supabase
 * 
 * @param record - Tour completion data
 */
export async function saveTourCompletion(
    record: Omit<TourCompletionRecord, 'completed_at'>
): Promise<void> {
    try {
        const supabase = createClient();

        const { error } = await supabase
            .from('tour_completions')
            .insert({
                ...record,
                completed_at: new Date().toISOString(),
            });

        if (error) {
            console.error('[TourSupabase] Failed to save completion:', error);
        }
    } catch (err) {
        // Don't throw - analytics should never break the app
        console.error('[TourSupabase] Error saving completion:', err);
    }
}

/**
 * Save step interaction to Supabase
 * 
 * @param record - Step interaction data
 */
export async function saveStepInteraction(
    record: Omit<TourStepInteractionRecord, 'created_at'>
): Promise<void> {
    try {
        const supabase = createClient();

        const { error } = await supabase
            .from('tour_step_interactions')
            .insert({
                ...record,
                created_at: new Date().toISOString(),
            });

        if (error) {
            console.error('[TourSupabase] Failed to save step interaction:', error);
        }
    } catch (err) {
        console.error('[TourSupabase] Error saving step interaction:', err);
    }
}

/**
 * Save tour feedback to Supabase
 * 
 * @param record - Feedback data
 */
export async function saveTourFeedback(
    record: Omit<TourFeedbackRecord, 'submitted_at'>
): Promise<void> {
    try {
        const supabase = createClient();

        const { error } = await supabase
            .from('tour_feedback')
            .insert({
                ...record,
                submitted_at: new Date().toISOString(),
            });

        if (error) {
            console.error('[TourSupabase] Failed to save feedback:', error);
        }
    } catch (err) {
        console.error('[TourSupabase] Error saving feedback:', err);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// QUERY FUNCTIONS (for Admin Dashboard)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get tour completion statistics
 */
export async function getTourCompletionStats(tourId?: string) {
    try {
        const supabase = createClient();

        let query = supabase
            .from('tour_completions')
            .select('tour_id, completion_type, steps_completed, total_steps, duration_ms, experiment_variant');

        if (tourId) {
            query = query.eq('tour_id', tourId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[TourSupabase] Failed to get stats:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('[TourSupabase] Error getting stats:', err);
        return null;
    }
}

/**
 * Get drop-off points (steps where users stopped)
 */
export async function getDropOffPoints(tourId: string) {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('tour_step_interactions')
            .select('step_id, step_index, action')
            .eq('tour_id', tourId);

        if (error) {
            console.error('[TourSupabase] Failed to get drop-off points:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.error('[TourSupabase] Error getting drop-off points:', err);
        return null;
    }
}

/**
 * Get average feedback rating for a tour
 */
export async function getAverageFeedbackRating(tourId: string) {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('tour_feedback')
            .select('rating')
            .eq('tour_id', tourId)
            .not('rating', 'is', null);

        if (error || !data || data.length === 0) {
            return null;
        }

        const sum = data.reduce((acc, item) => acc + (item.rating || 0), 0);
        return sum / data.length;
    } catch (err) {
        console.error('[TourSupabase] Error getting feedback rating:', err);
        return null;
    }
}
