# PRD 40: Submission Audit & Abuse Detection

> **Order:** 40 (Follows [PRD 39: Performance Architecture](./PRD_39_Performance_Architecture.md))
> **Status:** 📋 Proposed
> **Type:** Feature / Security

---

## 🎯 Objective
Empower admins with visibility into submission edit patterns and automatically flag suspicious behavior (e.g., image reusing) to ensure competitive integrity.

---

## ⚠️ Agent Context & Documentation Strategy (Mandatory)

> **User Request:** "Agents must know how the system works."

1.  **`AGENTS.md` Context Injection**
    *   **Action:** Add references to the `submission_changes` and `audit_log` tables in the "Database Schema" section if they don't exist.
    *   **Rule:** Any new "abuse detection" logic must be documented in `AGENTS.md` under a "Security & Integrity" section.

2.  **`ARCHITECTURE.md`**
    *   **Action:** Document the "Proof Hashing" mechanism (SHA-256) in the data flow diagrams to show when/how images are hashed and checked.

---

## 🏗️ Detailed Feature Requirements

### A. Admin Audit Dashboard (3 Items)

| # | Feature | Problem Solved | Implementation |
|---|---|---|---|
| **A-1** | **Audit Table View** | Admins can't see who changed what globally. | New page `/admin/submission-audit`. Columns: User, Submission Link, Field, Old/New Value, Reason, Timestamp. |
| **A-2** | **Rich Filtering** | Hard to find specific changes in a log. | Filters for: User, Date Range, Field Type (steps vs date), and "Flagged Only". |
| **A-3** | **Change Visualization** | Raw JSON diffs are hard to read. | Human-readable diffs (e.g., "Steps: 10,000 → 12,000 (+20%)"). |

### B. Abuse Detection System (3 Items)

| # | Feature | Problem Solved | Implementation |
|---|---|---|---|
| **B-1** | **Proof Hashing** | Users reusing the same screenshot for multiple days. | Compute `SHA-256` of image bytes at upload. Store in `submissions.proof_hash`. |
| **B-2** | **Duplicate Detection** | Manual checking is time-consuming. | Trigger: On upload, check if `proof_hash` exists on *other* days. If yes -> Flag `submissions.flagged = true`. |
| **B-3** | **Anomaly Flagging** | "Steps inflation" via edits. | Trigger: On edit, if `steps` increases by >50% or date changes >5 times -> Flag. |

---

## ✅ Success Criteria

| Metric | Target | Verification Method |
| :--- | :--- | :--- |
| **Detection Speed** | < 1 min | Auto-flag appears after duplicate upload |
| **Manual Review** | -80% time | Admins review "Flagged" tab instead of all proofs |
| **False Positives** | < 1% | Hashing collisions (extremely rare with SHA-256) |

---

## 📅 Phased Implementation Plan

### Phase A: Foundation (Next Sprint)
1.  Add `proof_hash` column and back-fill hashes for existing images (batch job).
2.  Implement hash computation on upload.

### Phase B: Detection Logic
3.  Implement duplicate hash check trigger.
4.  Implement "Anomaly Rules" service.

### Phase C: Review UI
5.  Build `/admin/submission-audit` page.
6.  Add email notifications for new high-confidence flags.
