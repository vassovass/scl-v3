# Skill: Code Visualization

**Protocol Version**: 1.0.0
**Capability**: `graph-it-live` MCP Integration

> **Goal**: Effectively use the "Graph-It-Live" tools to visualize code dependencies, analyze the impact of changes, and explore complex architectures without blindly reading files.

## 🛠️ Toolset Specification

This skill leverages the **Graph-It-Live** MCP Server. Agents must verify availability of `graphitlive_*` tools before execution.

| Intent | Tool ID | Description |
|--------|---------|-------------|
| **Architecture Mapping** | `graphitlive_crawl_dependency_graph` | Crawls imports recursively from an entry file. |
| **Impact Analysis** | `graphitlive_find_referencing_files` | **Reverse Lookup (O(1))**: Finds all files importing the target. |
| **Breaking Changes** | `graphitlive_analyze_breaking_changes` | Detects if signature changes break callers. |
| **Symbol Usage** | `graphitlive_get_symbol_callers` | Precise symbol-level caller lookup (superior to regex). |
| **Dead Code** | `graphitlive_find_unused_symbols` | Identifies exported symbols with zero references. |

## 🧠 Cognitive Workflow

### 1. Discovery Phase
Instead of traversing file trees, use `crawl_dependency_graph` on entry points (e.g., `layout.tsx`, `api/route.ts`) to build a mental model of the module.

### 2. Impact Assessment Phase
Before **deleting** or **modifying** code:
1.  Query `find_referencing_files` for the target file.
2.  If modifying a specific function, query `get_symbol_callers`.
3.  **Output**: Generate a precise list of affected files to the user.

### 3. Deep Dive Phase
For large files, avoid reading the entire content. Use `get_symbol_graph` to isolate only the relevant function/class dependencies.

## 🚫 Anti-Patterns
- **Regex Searching**: Do not use "search" for symbol usage. It is prone to false positives.
- **Blind Reading**: Do not read all files in a directory to understand structure.
- **Assumption**: Do not assume a change is isolated without verification.

## ⚡ Interaction Protocol

**Scenario**: "Refactor `AuthContext`."

**Agent Action Sequence**:
1.  **ACKNOWLEDGE**: "Equipping Code Visualization Skill."
2.  **QUERY**: `graphitlive_find_referencing_files(path="src/context/AuthContext.tsx")`
3.  **ANALYZE**: Review list of dependents (e.g., `['Header.tsx', 'Profile.tsx']`).
4.  **REPORT**: "The `AuthContext` is referenced by Header and Profile. I will verify these integrations."
