# Data Model: Phase 1 — Backend Exam Session API

**Branch**: `001-backend-exam-api` | **Date**: 2026-04-02

---

## Entities

### ExamSession

Represents a single exam attempt. Created on POST, optionally completed on PUT. An abandoned session has no finish-related attributes.

| Field | Type | Required | Source | Description |
|---|---|---|---|---|
| `PK` | String | ✅ | System | Fixed value: `"EXAM_STATS"`. All sessions share this partition. |
| `SK` | String | ✅ | System | `<ISO-8601-UTC>#<4-char-hex>`. e.g. `2026-04-02T15:30:00.000Z#a3f9`. Time-ordered by default. Used as `sessionId` in API responses. |
| `user` | String | ✅ | System | Hardcoded `"default@user.me"` in Phase 1. |
| `examType` | String (enum) | ✅ | POST body | Valid values: `"TESTING"` |
| `initialDatetime` | String (ISO-8601) | ✅ | System | Server-side UTC timestamp set when the session is created. Never modified. |
| `finishDatetime` | String (ISO-8601) | ❌ | System | Server-side UTC timestamp set when PUT is processed. Absent on abandoned sessions. |
| `timeSeconds` | Number | ❌ | System | Computed: `finishDatetime − initialDatetime` in whole seconds. Absent on abandoned sessions. |
| `result` | String (enum) | ❌ | PUT body | Valid values: `"pass"`, `"fail"`. Absent on abandoned sessions. |

---

## Enumerations

### ExamType

| Value | Description |
|---|---|
| `TESTING` | Standard exam session. Only valid value in Phase 1. |

### ExamResult

| Value | Description |
|---|---|
| `pass` | The exam was completed successfully. |
| `fail` | The exam was completed unsuccessfully. |

---

## DynamoDB Table

**Table name**: `statistics`  
**Billing mode**: On-demand (PAY_PER_REQUEST) — appropriate for dev workloads  
**Key schema**:
- **Partition Key (PK)**: `String`
- **Sort Key (SK)**: `String`

**No secondary indexes** required for Phase 1.

---

## Access Patterns

| Operation | DynamoDB Action | Key used | Condition |
|---|---|---|---|
| Create session | `PutItem` | `PK = "EXAM_STATS"`, `SK = <generated>` | None |
| Read session for finish | `GetItem` | `PK = "EXAM_STATS"`, `SK = sessionId` | Returns undefined → 404 |
| Finish session | `UpdateItem` | `PK = "EXAM_STATS"`, `SK = sessionId` | Called only after GetItem confirms existence |

---

## State Transitions

```
┌───────────────────────────────┐
│         ExamSession           │
│                               │
│  Created (POST /v1/exams)     │──── PUT /v1/exams/:sessionId ───▶  Finished
│  • PK, SK, user               │                                    • + finishDatetime
│  • examType, initialDatetime  │                                    • + timeSeconds
│                               │                                    • + result
│  [Abandoned if no PUT]        │
└───────────────────────────────┘
```

---

## Example Items

**Completed session:**
```json
{
  "PK": "EXAM_STATS",
  "SK": "2026-04-02T15:30:00.000Z#a3f9",
  "user": "default@user.me",
  "examType": "TESTING",
  "initialDatetime": "2026-04-02T15:30:00.000Z",
  "finishDatetime": "2026-04-02T15:31:45.000Z",
  "timeSeconds": 105,
  "result": "pass"
}
```

**Abandoned session:**
```json
{
  "PK": "EXAM_STATS",
  "SK": "2026-04-02T16:00:00.000Z#b7c2",
  "user": "default@user.me",
  "examType": "TESTING",
  "initialDatetime": "2026-04-02T16:00:00.000Z"
}
```

---

## Validation Rules

| Field | Rule |
|---|---|
| `examType` on POST | Must be present; must equal `"TESTING"` |
| `result` on PUT | Must be present; must be `"pass"` or `"fail"` (case-sensitive) |
| `sessionId` on PUT | Must exactly match an existing SK in DynamoDB |
| `timeSeconds` | Always a non-negative integer; computed server-side only |
