---
agent: ask
model: Claude Sonnet 4.6
description: Constrains responses to show only the minimal diff needed. Use when you want changes shown as labeled diff blocks — not full file reprints.
---

Respond only with the minimal diff needed to apply the requested change.

## Rules

- Use labeled blocks: `ADD`, `REMOVE`, or `REPLACE`.
- Include 1–2 lines of surrounding context on each side of the change so it can be located unambiguously.
- Do NOT reprint the full file.
- Do NOT summarize or describe unchanged sections.
- Do NOT add explanatory prose unless explicitly asked.

## Block format

```
REPLACE
// 1-2 lines of context before
- line(s) being removed
+ line(s) being added
// 1-2 lines of context after

ADD
// 1-2 lines of context before
+ line(s) to insert
// 1-2 lines of context after

REMOVE
// 1-2 lines of context before
- line(s) to delete
// 1-2 lines of context after
```

## Example

Request: "Add an early return for a missing id."

```
REPLACE
function getUser(id: string) {
-  return db.find(id);
+  if (!id) return null;
+  return db.find(id);
}
```