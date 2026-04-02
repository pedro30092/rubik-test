# Feature Specification: Phase 1 — Backend Exam Session API

**Feature Branch**: `001-backend-exam-api`
**Created**: 2026-04-02
**Status**: Draft
**Input**: User description: "Phase 1 Backend Foundation - Exam Session API"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start an Exam Session (Priority: P1)

A client (developer, test harness, or future frontend) sends a request to begin a new exam session. The system records the session start time and returns a unique session identifier that can be used to later finish the session.

**Why this priority**: This is the entry point of the entire data flow. Without the ability to create a session, nothing else can be tested or built.

**Independent Test**: Can be fully tested by sending a POST request with a valid exam type and verifying a `201` response with a `sessionId` is returned, and a corresponding item exists in the database.

**Acceptance Scenarios**:

1. **Given** a valid request body with `examType: "TESTING"`, **When** `POST /v1/exams` is called, **Then** the system returns `201` with a `sessionId` and persists the session to the database with all required attributes.
2. **Given** a request body with a missing `examType`, **When** `POST /v1/exams` is called, **Then** the system returns `400` with an error message.
3. **Given** a request body with an invalid `examType` value, **When** `POST /v1/exams` is called, **Then** the system returns `400` with an error message.

---

### User Story 2 - Finish an Exam Session (Priority: P1)

A client that previously started a session sends a request to mark it as complete, providing the outcome. The system records the finish time, computes the elapsed duration, and stores the result. Sessions that are never finished remain in the database as abandoned — with no finish data.

**Why this priority**: Core to the data model — without finish capability, no session data is complete. P1 alongside Story 1 as both are required for the foundational data flow.

**Independent Test**: Can be fully tested by first creating a session (Story 1), then calling PUT with a valid result, and verifying the response is `200` and the database item contains `finishDatetime`, `timeSeconds`, and `result`.

**Acceptance Scenarios**:

1. **Given** an existing session and a valid body with `result: "pass"` or `result: "fail"`, **When** `PUT /v1/exams/:sessionId` is called, **Then** the system returns `200` with `{"status": "updated"}` and persists `finishDatetime`, `timeSeconds`, and `result` to the session item.
2. **Given** a `sessionId` that does not exist in the database, **When** `PUT /v1/exams/:sessionId` is called, **Then** the system returns `404` with `{"error": "session not found"}`.
3. **Given** an existing session and a body with an invalid `result` value, **When** `PUT /v1/exams/:sessionId` is called, **Then** the system returns `400` with an error message.
4. **Given** a session was started but `PUT` was never called, **Then** the session item has no `finishDatetime`, `timeSeconds`, or `result` attributes.

---

### User Story 3 - Verify Elapsed Time Accuracy (Priority: P2)

The system computes the session duration automatically from the stored start time and the server-side finish time. No client-provided duration is accepted — the calculation is owned entirely by the backend.

**Why this priority**: Accuracy of `timeSeconds` is a data integrity requirement, but it is derived from Stories 1 and 2.

**Independent Test**: Start a session, wait a known number of seconds, finish the session, then read the item from the database and confirm `timeSeconds` matches the actual elapsed time within a 1-second tolerance.

**Acceptance Scenarios**:

1. **Given** a session started at time T1 and finished at time T2, **When** the finish request is processed, **Then** `timeSeconds` stored equals `T2 − T1` in whole seconds.

---

### User Story 4 - Manual Test Validation (Priority: P2)

A developer can reproduce all test scenarios using a provided test collection (curl commands or Postman), without writing code. This validates the full API surface in a deployed dev environment.

**Why this priority**: Required for acceptance and handoff, but not a runtime concern.

**Independent Test**: Run each item in the test collection against the deployed dev environment and confirm all expected responses are received.

**Acceptance Scenarios**:

1. **Given** the test collection, **When** the happy-path POST is executed, **Then** a `201` with `sessionId` is returned.
2. **Given** the test collection, **When** the happy-path PUT is executed with an existing `sessionId`, **Then** a `200` is returned.
3. **Given** the test collection, **When** PUT is called with an unknown `sessionId`, **Then** a `404` is returned.
4. **Given** the test collection, **When** POST or PUT is called with an invalid body, **Then** a `400` is returned.
5. **Given** a session created but no PUT called, **Then** the session item in the database has no finish-related attributes.

---

### Edge Cases

- What happens when `sessionId` in the PUT path contains special characters (e.g., the `#` in `<ISO-UTC>#<short-uuid>`)?
- What happens if the same `sessionId` is finished twice (duplicate PUT)?
- What happens if the PUT body is empty or malformed JSON?
- What if `initialDatetime` is missing or corrupt on the database item when PUT is called?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept `POST /v1/exams` with a body containing `examType` and return `201` with a generated `sessionId`.
- **FR-002**: System MUST reject `POST /v1/exams` with a missing or invalid `examType` with a `400` response.
- **FR-003**: System MUST persist a new session item on POST with `user` (hardcoded `default@user.me`), `examType`, and a server-side UTC `initialDatetime`.
- **FR-004**: The generated `sessionId` MUST be globally unique and time-ordered, composed of an ISO-8601 UTC timestamp and a short random identifier.
- **FR-005**: System MUST accept `PUT /v1/exams/:sessionId` with a body containing `result` (`"pass"` or `"fail"`) and return `200`.
- **FR-006**: System MUST reject `PUT /v1/exams/:sessionId` with an invalid `result` value with a `400` response.
- **FR-007**: System MUST return `404` when `PUT /v1/exams/:sessionId` references a `sessionId` that does not exist.
- **FR-008**: System MUST compute `timeSeconds` as the difference in whole seconds between the server-side `finishDatetime` and the stored `initialDatetime`, and persist it alongside `finishDatetime` and `result`.
- **FR-009**: Sessions that never receive a PUT call MUST remain in the database with no `finishDatetime`, `timeSeconds`, or `result` attributes.
- **FR-010**: Lambda functions MUST complete cold start within 1 second.

### Key Entities

- **ExamSession**: Represents a single exam attempt. Attributes: unique time-ordered ID, exam type, start time, optional finish time, optional elapsed seconds, optional result, associated user.
- **ExamType**: Enumeration of valid exam categories. Phase 1 supports `TESTING` only.
- **ExamResult**: Enumeration of valid outcomes for a finished session: `pass` or `fail`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A client can start and finish an exam session with one request per operation, with no manual intervention required.
- **SC-002**: 100% of the manual test collection scenarios pass against the deployed dev environment.
- **SC-003**: `timeSeconds` stored on finish is accurate to within 1 second of the actual elapsed wall-clock time.
- **SC-004**: Lambda functions respond to their first invocation (cold start) within 1 second.
- **SC-005**: An abandoned session (no PUT) leaves no finish-related attributes in the database — verified by direct inspection.
- **SC-006**: Invalid or missing input on both endpoints returns a descriptive error response in all tested cases.

## Assumptions

- The API is deployed to a dev environment only; no production deployment is in scope for this phase.
- A single hardcoded user (`default@user.me`) is used for all sessions; multi-user support is out of scope.
- `examType` is an enum with only `TESTING` as a valid value in Phase 1.
- Infrastructure is set up manually; IaC tooling is deferred to a later phase.
- The open question regarding PUT 404 behaviour is resolved as: return `404` when `sessionId` is not found.
- URL-encoding of the `sessionId` path parameter (which contains `#`) is handled by the client.
- No authentication or authorization is required; the API is open within the dev environment.
