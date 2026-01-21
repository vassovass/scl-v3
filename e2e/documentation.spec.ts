import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Documentation Verification E2E Tests
 *
 * Verifies that required PRD documentation exists and contains
 * all necessary sections. This is part of PRD 49 Sprint 1 requirements.
 */

test.describe('PRD Documentation Verification', () => {

    test('PRD 47 Head-to-Head League design doc is complete', async () => {
        const prdPath = path.join(process.cwd(), 'docs/prds/admin-feedback-system/PRD_47_Head_To_Head_Leagues.md');

        // Verify file exists
        expect(fs.existsSync(prdPath)).toBe(true);

        const content = fs.readFileSync(prdPath, 'utf-8');

        // Verify required sections exist
        expect(content).toContain('## 🎯 Objective');
        expect(content).toContain('FPL-style');

        // Database schema section
        expect(content).toContain('## 🗄️ Database Schema');
        expect(content).toContain('h2h_seasons');
        expect(content).toContain('h2h_fixtures');
        expect(content).toContain('h2h_standings');

        // Algorithm section
        expect(content).toContain('## 📐 Fixture Generation Algorithm');
        expect(content).toContain('round-robin');
        expect(content).toContain('def generate_fixtures');

        // UI wireframes section
        expect(content).toContain('## 🎨 UI Wireframes');
        expect(content).toContain('Standings Tab');
        expect(content).toContain('Fixtures Tab');

        // Edge cases section
        expect(content).toContain('## 🔄 Edge Cases');
        expect(content).toContain('Member leaves mid-season');

        // Systems/Design considerations
        expect(content).toContain('## 🔍 Systems/Design Considerations');

        // Proactive considerations
        expect(content).toContain('## 💡 Proactive Considerations');

        // Verify it's marked as design-only
        expect(content).toContain('📋 Proposed (Design Only)');
    });

    test('PRD 49 Alpha Launch Checklist exists and has Should Have section', async () => {
        const prdPath = path.join(process.cwd(), 'docs/prds/admin-feedback-system/PRD_49_Alpha_Launch_Checklist.md');

        // Verify file exists
        expect(fs.existsSync(prdPath)).toBe(true);

        const content = fs.readFileSync(prdPath, 'utf-8');

        // Verify Must Have section exists
        expect(content).toContain('### Must Have (Blocking)');

        // Verify Should Have section exists
        expect(content).toContain('### Should Have (Important but not blocking)');

        // Verify all 4 Should Have items are present
        expect(content).toContain('Welcome toast for World League enrollment');
        expect(content).toContain('Onboarding mentions global leaderboard');
        expect(content).toContain('Footer links to "Why Upload" page');
        expect(content).toContain('Head-to-head league design documented');

        // Verify Nice to Have section exists
        expect(content).toContain('### Nice to Have (Can launch without)');
    });
});
