---
agent: agent
model: Claude Sonnet 4.6
description: Defines the QUESTIONS_ASKED design gate. Apply this before finalizing any architecture, schema, or API design decision in this project.
---

# QUESTIONS_ASKED — Design Gate Convention

## Purpose

`QUESTIONS_ASKED` is a mandatory design gate that must be applied **before**
committing to any non-trivial technical decision. Its goal is to surface
assumptions, expose tradeoffs, and prevent costly rework by resolving
unknowns early.

This pattern applies to (but is not limited to):
- Database schema / table design
- API contract definition (endpoints, verbs, payloads)
- State management strategy
- Authentication / authorization mechanism
- Third-party service selection

---

## When to Trigger QUESTIONS_ASKED

Trigger it any time the request involves designing something where:
- Multiple valid approaches exist with meaningfully different tradeoffs
- The wrong choice would require significant rework later
- Future requirements (even vague ones) could invalidate the design

When in doubt, trigger it. Over-asking is cheaper than under-designing.

---

## Format

When triggering `QUESTIONS_ASKED`, output the following structure:

```
## [QUESTIONS_ASKED] — <Topic>

Before finalizing the design for <topic>, the following must be resolved:

Q1. <Question?>
    → Default assumption if skipped: <what we'd assume>
    → Impact if wrong: <consequence>

Q2. <Question?>
    → Default assumption if skipped: <what we'd assume>
    → Impact if wrong: <consequence>

...

Recommendation: <brief recommendation once questions are answered>
```

---

## Rules

1. **Do not produce the final design until questions are answered** — or until
   the user explicitly says "proceed with defaults."

2. For each question, always provide a **default assumption** so the user can
   skip questions they don't have an opinion on and rely on a reasoned default.

3. Mark the PHASE doc section as `[QUESTIONS_ASKED: pending]` until resolution.
   Update it to `[QUESTIONS_ASKED: resolved — <date>]` once finalized.

4. Keep questions **targeted and consequential** — do not ask about things that
   can be changed easily later without architectural impact.

5. Group questions by concern (data model, access patterns, scalability, etc.)
   when there are more than 3.

---

## Resolution

Once answers are received:
1. Update the PHASE doc with the resolved design decision.
2. Replace the `[QUESTIONS_ASKED: pending]` tag with `[QUESTIONS_ASKED: resolved — <date>]`.
3. Briefly document **why** the chosen design was selected over alternatives.
