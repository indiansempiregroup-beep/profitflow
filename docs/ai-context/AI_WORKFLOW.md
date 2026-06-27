# AI Workflow

Last updated: 2026-06-27

## Purpose
This document defines how future AI assistants should continue development on ProfitFlow without needing prior conversation context.

## Workflow Rules
1. Start by reading the documents in this folder before making changes.
2. Treat the files in docs/ai-context as the authoritative project memory.
3. Do not invent features that are not already implemented or explicitly documented as planned.
4. Prefer improving the existing architecture over introducing new patterns.
5. Keep all documentation synchronized with code changes.

## Required Reading Order
1. PROJECT_STATUS.md
2. ARCHITECTURE.md
3. DECISIONS.md
4. ROADMAP.md
5. BACKLOG.md
6. CODING_STANDARDS.md
7. KNOWN_ISSUES.md
8. SESSION_LOG.md

## Development Expectations
- Preserve the monorepo structure.
- Keep the server provider-based and exchange-agnostic.
- Add tests for new behavior.
- Update docs after every meaningful change.
- Verify changes with the relevant test command before declaring completion.

## Verification Command
For backend changes, use:

```bash
pnpm --filter @profitflow/server test
```

For workspace-wide verification, use:

```bash
pnpm test
```

## Communication Standard
When continuing work, summarize:
- what changed,
- what was verified,
- what remains pending,
- and whether any assumptions were made.
