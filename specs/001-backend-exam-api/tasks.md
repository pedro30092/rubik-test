# Tasks: Phase 1 — Backend Exam Session API

**Input**: Design documents from `/specs/001-backend-exam-api/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/api-spec.json](./contracts/api-spec.json), [quickstart.md](./quickstart.md)

**Note**: No automated tests requested. Validation is via manual curl collection defined in `quickstart.md`.

---

## Phase 1: Setup

**Purpose**: Initialize the `backend/` project structure, dependencies, and build tooling

- [x] T001 Create `backend/` directory tree: `src/handlers/`, `src/services/`, `src/models/`, `dist/`
- [x] T002 [P] Create `backend/package.json` and install all dependencies: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`; dev: `typescript`, `esbuild`, `@types/node`, `@types/aws-lambda`
- [x] T003 [P] Create `backend/tsconfig.json`: `target: ES2022`, `module: commonjs`, `strict: true`, `esModuleInterop: true`, `rootDir: src`, `outDir: dist`
- [x] T004 [P] Create `backend/esbuild.config.js`: dual handler entry points (`exam-create`, `exam-finish`), `bundle: true`, `platform: node`, `target: node20`, one outfile per handler in `dist/`
- [x] T005 [P] Create `backend/.gitignore` excluding `dist/` and `node_modules/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared model types and DynamoDB service layer — required by both US1 and US2 handlers

**⚠️ CRITICAL**: Neither handler can be implemented until this phase is complete

- [x] T006 Create `backend/src/models/exam-session.model.ts`: define `ExamType = 'TESTING'`, `ExamResult = 'pass' | 'fail'`, `VALID_EXAM_TYPES`, `VALID_RESULTS` constants, `ExamSession` interface with all attributes (`PK`, `SK`, `user`, `examType`, `initialDatetime`, optional `finishDatetime`, `timeSeconds`, `result`)
- [x] T007 Create `backend/src/services/exam.service.ts`: initialize `DynamoDBDocumentClient` from `@aws-sdk/lib-dynamodb` (table name from `process.env.TABLE_NAME`); implement `createSession(examType, sessionId, initialDatetime)` via `PutCommand`; `getSession(sessionId)` via `GetCommand` returning item or `undefined`; `finishSession(sessionId, finishDatetime, timeSeconds, result)` via `UpdateCommand`

**Checkpoint**: Model types and DynamoDB service ready — US1 and US2 handlers can now be implemented

---

## Phase 3: User Story 1 — Start an Exam Session (Priority: P1) 🎯 MVP

**Goal**: `POST /v1/exams` — validates examType, generates a time-ordered sessionId, persists the session, returns `201`

**Independent Test**: `curl -X POST .../v1/exams -d '{"examType":"TESTING"}'` returns `201 {"sessionId":"..."}` and the item exists in DynamoDB (quickstart.md step 1)

### Implementation for User Story 1

- [x] T008 [US1] Implement `backend/src/handlers/exam-create.handler.ts`: parse `event.body`, validate `examType` against `VALID_EXAM_TYPES` (return `400` on failure), generate `SK` as `${new Date().toISOString()}#${randomUUID().replace(/-/g,'').slice(0,4)}`, call `service.createSession()`, return `201 { sessionId: SK }` on success and `500` on DynamoDB error
- [x] T009 [US1] Run `node esbuild.config.js` from `backend/` and verify `dist/exam-create.handler.js` is produced with no errors

**Checkpoint**: US1 complete — `POST /v1/exams` is independently testable; delivers the session-creation MVP

---

## Phase 4: User Story 2 — Finish an Exam Session (Priority: P1)

**Goal**: `PUT /v1/exams/:sessionId` — validates result, retrieves start time, computes elapsed seconds, persists finish data, returns `200`; returns `404` for unknown sessions

**Independent Test**: After creating a session (US1), call `curl -X PUT .../v1/exams/<encoded-id> -d '{"result":"pass"}'` → returns `200 {"status":"updated"}`; DynamoDB item now has `finishDatetime`, `timeSeconds`, `result` (quickstart.md step 2)

### Implementation for User Story 2

- [x] T010 [US2] Implement `backend/src/handlers/exam-finish.handler.ts`: extract `sessionId` from `event.pathParameters.sessionId`, parse `event.body`, validate `result` against `VALID_RESULTS` (return `400` on failure), call `service.getSession(sessionId)` — if `undefined` return `404 { error: "session not found" }`, compute `finishDatetime = new Date().toISOString()`, compute `timeSeconds = Math.floor((new Date(finishDatetime).getTime() - new Date(item.initialDatetime).getTime()) / 1000)`, call `service.finishSession()`, return `200 { status: "updated" }` on success and `500` on DynamoDB error
- [x] T011 [US2] Run `node esbuild.config.js` from `backend/` and verify `dist/exam-finish.handler.js` is produced with no errors

**Checkpoint**: US2 complete — `PUT /v1/exams/:sessionId` is independently testable alongside US1; full session lifecycle now works

---

## Phase 5: User Story 3 — Verify Elapsed Time Accuracy (Priority: P2)

**Goal**: Confirm `timeSeconds` computation in `exam.service.ts` is arithmetically correct: `Math.floor` applied to millisecond difference, no floating-point issues, no client-provided override possible

**Independent Test**: Start a session, wait ~5 seconds (measured), finish the session, inspect DynamoDB item: `timeSeconds` must equal elapsed wall-clock seconds ±1 (quickstart.md step 2 + DynamoDB inspection)

### Implementation for User Story 3

- [x] T012 [US3] Review `backend/src/services/exam.service.ts` `finishSession`: confirm `timeSeconds` uses `Math.floor((new Date(finishDatetime).getTime() - new Date(item.initialDatetime).getTime()) / 1000)`, that `initialDatetime` is read from the stored DynamoDB item (not from the request), and that no client-provided `timeSeconds` is accepted

**Checkpoint**: US3 complete — elapsed time accuracy validated; `timeSeconds` correctness is confirmed

---

## Phase 6: User Story 4 — Manual Test Validation (Priority: P2)

**Goal**: All acceptance criteria in `spec.md` are verified against the deployed dev environment using `quickstart.md` test collection

**Independent Test**: Run all 6 test scenarios in `quickstart.md` against the live dev API and confirm each produces the documented expected response

### Implementation for User Story 4

- [ ] T013 [P] [US4] Execute quickstart.md step 1: `POST /v1/exams` with valid body → verify HTTP `201` and `sessionId` present in response
- [ ] T014 [P] [US4] Execute quickstart.md step 2: `PUT /v1/exams/:sessionId` with `result: "pass"` → verify HTTP `200` and `{"status":"updated"}`
- [ ] T015 [P] [US4] Execute quickstart.md step 3: `PUT /v1/exams` with unknown sessionId → verify HTTP `404` and `{"error":"session not found"}`
- [ ] T016 [P] [US4] Execute quickstart.md step 4: `POST /v1/exams` with invalid examType → verify HTTP `400` and error message
- [ ] T017 [P] [US4] Execute quickstart.md step 5: `PUT /v1/exams/:sessionId` with missing result → verify HTTP `400` and error message
- [ ] T018 [P] [US4] Execute quickstart.md step 6: DynamoDB inspection of abandoned session → verify item has no `finishDatetime`, `timeSeconds`, or `result` attributes

**Checkpoint**: US4 complete — all 8 acceptance criteria from spec.md verified; feature ready for handoff

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Packaging, performance guard, and delivery validation

- [x] T019 [P] Package Lambda zip files per quickstart.md: `dist/exam-create.zip` and `dist/exam-finish.zip`
- [x] T020 [P] Verify bundle sizes: confirm each handler `.js` file is under 2MB (cold start performance guard; expected 250–400KB per research.md)
- [ ] T021 Validate `quickstart.md` is accurate end-to-end: follow all setup and test steps from scratch in a clean shell session and confirm no instructions are broken or missing

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    └─▶ Phase 2 (Foundational) — BLOCKS Phase 3 and Phase 4
            ├─▶ Phase 3 (US1) ──── can proceed independently after Phase 2
            └─▶ Phase 4 (US2) ──── can proceed independently after Phase 2
                    └─▶ Phase 5 (US3) — depends on Phase 4 service being complete
Phase 6 (US4) ── depends on Phase 3 + Phase 4 + AWS infrastructure deployed
Final Phase ──── depends on Phase 6
```

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only — no other story dependency
- **US2 (P1)**: Depends on Phase 2 only — no dependency on US1 (shares service layer)
- **US3 (P2)**: Depends on US2 — validation of finishSession computation; no new implementation files
- **US4 (P2)**: Depends on US1 + US2 being deployed to AWS dev environment

### Within Each Phase

- Models before services (T006 before T007)
- Services before handlers (T007 before T008, T007 before T010)
- Build verification after each handler (T009 after T008; T011 after T010)
- All [P]-marked tasks within a phase can run in parallel

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005 can all run in parallel after T001
- **Phase 2**: T006 and T007 are sequential (T006 → T007, service imports model)
- **Phase 3 + Phase 4**: After Phase 2, US1 and US2 handlers can be developed in parallel by different developers (different files, no runtime dependency on each other)
- **Phase 6**: All 6 test scenarios (T013–T018) are independent; run in any order or in parallel

---

## Parallel Execution Example: Phase 1

```bash
# After T001 (create directory structure), run in parallel:
npm install                         # T002
# in parallel:
# T003: write tsconfig.json
# T004: write esbuild.config.js
# T005: write .gitignore
```

## Parallel Execution Example: US1 + US2 (after Phase 2)

```bash
# Two developers can work simultaneously:
# Dev A → T008 + T009: exam-create.handler.ts
# Dev B → T010 + T011: exam-finish.handler.ts
```

---

## Implementation Strategy

### MVP Scope (Phase 1 + Phase 2 + Phase 3)

The minimum viable deliverable is **US1 only** — once `POST /v1/exams` is working, the data write path is proven. This validates the entire `client → API Gateway → Lambda → DynamoDB` flow before building the finish path.

### Incremental Delivery

1. **Iteration 1**: Phase 1 + Phase 2 + Phase 3 → `POST /v1/exams` working end-to-end
2. **Iteration 2**: Phase 4 → `PUT /v1/exams/:sessionId` working end-to-end
3. **Iteration 3**: Phase 5 → timeSeconds accuracy verified
4. **Iteration 4**: Phase 6 + Final → all acceptance criteria validated, delivery-ready
