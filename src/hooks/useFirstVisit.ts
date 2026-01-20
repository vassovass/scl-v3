/**
 * useFirstVisit Hook
 * PRD 44: Auto-Enroll World League (UX)
 * 
 * Detects if this is the user's first visit to a specific feature/page.
 * Uses localStorage to persist state across sessions.
 * 
 * @param key Unique key for the feature (e.g., 'dashboard_welcome')
 * @returns boolean - true if this is the first visit
 */

import { useEffect, useState } from 'react';

export function useFirstVisit(key: string): boolean {
    const [isFirstVisit, setIsFirstVisit] = useState(false);

    useEffect(() => {
        // Check if visited key exists
        const storageKey = `scl_visited_${key}`;
        const hasVisited = localStorage.getItem(storageKey);

        if (!hasVisited) {
            setIsFirstVisit(true);
            // Mark as visited immediately so it doesn't trigger again on reload
            localStorage.setItem(storageKey, 'true');
        }
    }, [key]);

    return isFirstVisit;
}
