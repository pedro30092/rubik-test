# PHASE 1 — Backend Foundation

STATUS: OPEN
QUESTIONS_ASKED: YES (pending — see PUT 404 behavior in Open Questions)

---

## GENERAL

### What Are We Building?
Two backend API endpoints that manage exam sessions: one to start a session and
one to finish it. Each session is recorded to a database as a distinct item.
This is the data collection backbone of the platform.

No frontend is built in this phase. No authentication is implemented.
A hardcoded default user (`default@user.me`) is used as a placeholder.

### Why This Phase?
Before building any UI or user-facing features, we need a stable, testable
backend foundation. This phase validates the core data flow:
`client → API → Lambda → DynamoDB` before any additional complexity is layered on.

### What Is Out of Scope?
- Angular frontend (Phase 2)
- User authentication / JWT (later phase)
- Multiple users or multi-tenancy
- Pattern library API (`GET /patterns`)
- Analytics endpoints
- Deployment to production (dev environment only)

### Deliverables
- 2 API Gateway endpoints (`POST /v1/exams`, `PUT /v1/exams/:sessionId`) — HTTP API (not REST API)
- 2 Lambda functions (`rubik-dev-exam-create`, `rubik-dev-exam-finish`) written in TypeScript
- 1 DynamoDB table (`statistics`) with a per-session item design
- Local test harness (manual `curl` or Postman collection)

---

## DETAILED

### Stack
| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20.x |
| Language | TypeScript (compiled via esbuild) |
| Compute | AWS Lambda |
| API | AWS API Gateway HTTP API (v2) |
| Database | AWS DynamoDB (single table) |
| IaC | Manual setup — to be added in a later phase |

Note: HTTP API (v2) chosen over REST API for lower latency, lower cost, and simpler payload format.
REST API is only needed when request validation, usage plans, or API keys are required — none apply here.

Cross-reference: [PROJECT_PLAN_INITIAL.md](./PROJECT_PLAN_INITIAL.md) — Backend architecture section.

---

### Component Breakdown
```
backend/
├── src/
│   ├── handlers/
│   │   ├── exam-create.handler.ts    ← Entry point for POST /v1/exams
│   │   └── exam-finish.handler.ts   ← Entry point for PUT /v1/exams/:sessionId
│   ├── services/
│   │   └── exam.service.ts          ← Business logic (DynamoDB writes, time computation)
│   └── models/
│       └── exam-session.model.ts    ← Shared TypeScript types/interfaces
├── esbuild.config.js
└── tsconfig.json
```

---

### Data Design

DynamoDB table: `statistics`

| Attribute | Type | Required | Set by | Notes |
|-----------|------|----------|--------|-------|
| `PK` | String | ✅ | `EXAM_STATS` (fixed) | All exam session items share this partition |
| `SK` | String | ✅ | `<ISO-UTC>#<short-uuid>` | e.g. `2026-04-02T15:30:00Z#a3f9` — time-ordered by default |
| `user` | String | ✅ | `default@user.me` (hardcoded) | Placeholder for Phase 1 |
| `examType` | String | ✅ | POST body | Enum: `TESTING` |
| `initialDatetime` | String | ✅ | Server `now()` on POST | ISO-8601 UTC |
| `finishDatetime` | String | ❌ | Server `now()` on PUT | Absent on abandoned sessions |
| `timeSeconds` | Number | ❌ | Computed on PUT | `finishDatetime − initialDatetime` in seconds |
| `result` | String | ❌ | PUT body | `"pass"` or `"fail"` — absent on abandoned sessions |

`finishDatetime`, `timeSeconds`, and `result` are never set on abandoned sessions.

**Example item — completed session:**
```json
{
  "PK": "EXAM_STATS",
  "SK": "2026-04-02T15:30:00Z#a3f9",
  "user": "default@user.me",
  "examType": "TESTING",
  "initialDatetime": "2026-04-02T15:30:00Z",
  "finishDatetime": "2026-04-02T15:31:45Z",
  "timeSeconds": 105,
  "result": "pass"
}
```

**Example item — abandoned session:**
```json
{
  "PK": "EXAM_STATS",
  "SK": "2026-04-02T16:00:00Z#b7c2",
  "user": "default@user.me",
  "examType": "TESTING",
  "initialDatetime": "2026-04-02T16:00:00Z"
}
```

---

### API Contract

**POST `/v1/exams`** — Start an exam session

| | |
|---|---|
| Request body | `{ "examType": "TESTING" }` |
| Success | `201 { "sessionId": "2026-04-02T15:30:00Z#a3f9" }` |
| Error | `400 { "error": "<message>" }` |

Lambda creates the DynamoDB item with `PK`, `SK`, `user`, `examType`, `initialDatetime`. Returns the generated `SK` as `sessionId`.

---

**PUT `/v1/exams/:sessionId`** — Finish an exam session

| | |
|---|---|
| Request body | `{ "result": "pass" \| "fail" }` |
| Success | `200 { "status": "updated" }` |
| Not found | `404 { "error": "session not found" }` *(see Open Questions)* |
| Error | `400 { "error": "<message>" }` |

Lambda retrieves `initialDatetime` via `GetItem`, computes `timeSeconds`, then `UpdateItem` with `finishDatetime`, `timeSeconds`, and `result`.

---

### Acceptance Criteria
- `POST /v1/exams` with a valid body returns `201` with a `sessionId`.
- `POST /v1/exams` with a missing or invalid `examType` returns `400`.
- `PUT /v1/exams/:sessionId` with a valid body returns `200` and persists `finishDatetime`, `timeSeconds`, and `result`.
- `PUT /v1/exams/:sessionId` with an invalid `result` value returns `400`.
- `timeSeconds` stored on finish matches the actual elapsed seconds between `initialDatetime` and `finishDatetime`.
- A session item with no PUT call has no `finishDatetime`, `timeSeconds`, or `result` attributes.
- Lambda cold start completes in under 1 second (esbuild bundle, no webpack).
- Manual test collection (curl or Postman) covers: happy path POST, happy path PUT, abandoned session, invalid body, and unknown `sessionId`.

---

### Open Questions / Blockers

- [QUESTIONS_ASKED] Should `PUT /v1/exams/:sessionId` return `404` when the `sessionId` does not exist in DynamoDB, or silently return `200`?
  → Recommended: `404` — silent success would hide client bugs (e.g. wrong sessionId sent).
  → Waiting for confirmation before finalizing the PUT Lambda error handling.
