# Research: Phase 1 — Backend Exam Session API

**Branch**: `001-backend-exam-api` | **Date**: 2026-04-02  
**Purpose**: Resolve all technical unknowns before implementation planning

---

## 1. AWS SDK v3 with Lambda Node.js 20

**Decision**: Use `@aws-sdk/lib-dynamodb` (DynamoDBDocumentClient) with tree-shaken esbuild bundle — do NOT rely on the pre-installed SDK in the Lambda runtime.

**Rationale**:
- AWS Lambda Node.js 20 runtime ships with AWS SDK v3, but the bundled version may lag behind. Bundling the SDK eliminates the version dependency and makes the Lambda fully portable.
- `@aws-sdk/lib-dynamodb` (DocumentClient wrapper) handles marshalling/unmarshalling of native JS types automatically. Avoids manual `{ S: "value" }` syntax.
- With esbuild tree-shaking, only the DynamoDB commands used are included in the bundle, keeping it small.

**Alternatives considered**:
- AWS SDK v2 (`aws-sdk`) — rejected: deprecated, larger bundle, not recommended for new projects.
- Using pre-installed SDK — rejected: version lock-in risk, cold start differences across runtime patches.

**Key packages**:
```
@aws-sdk/client-dynamodb     # Base DynamoDB client
@aws-sdk/lib-dynamodb        # DocumentClient (recommended abstraction)
```

---

## 2. esbuild Configuration for Dual Lambda Handlers

**Decision**: Single `esbuild.config.js` with an array of entry points, one output file per handler, CommonJS format, bundled (no externals).

**Rationale**:
- Two separate output bundles (`exam-create.handler.js`, `exam-finish.handler.js`) allow each Lambda to be packaged and deployed independently as zip archives.
- `platform: 'node'` + `target: 'node20'` ensures correct Node.js API compatibility.
- Bundling everything (no `external`) is the right choice for cold start: a single self-contained file avoids `node_modules` lookup at runtime.
- `minify: false` kept for Phase 1 to ease debugging; can be enabled later.

**Bundle size estimate**: ~250–400KB per handler (AWS SDK v3 DynamoDB tree-shaken). Comfortably under Lambda 250MB limit.

**Configuration**:
```js
// esbuild.config.js
const { build } = require('esbuild');

const handlers = ['exam-create', 'exam-finish'];

Promise.all(
  handlers.map(name =>
    build({
      entryPoints: [`src/handlers/${name}.handler.ts`],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: `dist/${name}.handler.js`,
      sourcemap: false,
      minify: false,
    })
  )
).catch(() => process.exit(1));
```

**Alternatives considered**:
- webpack — rejected: heavier configuration, slower builds, overkill for this use case.
- `tsc` alone (no bundling) — rejected: requires deploying `node_modules`, larger zip, slower cold start.

---

## 3. DynamoDB Single-Table Pattern for Exam Sessions

**Decision**: Single table `statistics`, fixed partition key `PK = "EXAM_STATS"`, sort key `SK = <ISO-UTC-datetime>#<short-uuid>`.

**Rationale**:
- All exam sessions share a single partition to allow future time-range queries via `SK BETWEEN`. The ISO-8601 prefix ensures natural chronological ordering within the partition.
- A short UUID suffix (`4 hex chars`) guarantees uniqueness within the same millisecond.
- `UpdateItem` is used on PUT to add `finishDatetime`, `timeSeconds`, and `result` to an existing item — only the fields being updated are touched, leaving `initialDatetime` and other fields intact.
- `GetItem` before `UpdateItem` is the correct pattern here: we need `initialDatetime` to compute `timeSeconds`, and we also use its absence to return 404.

**404 detection on PUT**:
- Perform `GetItem` with the `sessionId` as SK. If the item is not returned (undefined/null), respond with 404.
- `UpdateItem` with `ConditionExpression: "attribute_exists(PK)"` is an alternative, but since we need `initialDatetime` from the GET anyway, a two-step approach is cleaner and avoids `ConditionalCheckFailedException` handling.

**Alternatives considered**:
- One item per user (multiple sessions nested) — rejected: poor write scalability, overly complex updates.
- Multiple tables — rejected: single table is sufficient for Phase 1 use case.

---

## 4. sessionId URL Encoding for PUT Path Parameter

**Decision**: The `sessionId` (which contains `#` and `:`) MUST be URL-encoded by the client when used in the PUT path. Lambda receives the decoded value automatically via API Gateway.

**Rationale**:
- A raw `#` in a URL is interpreted as a fragment separator by HTTP clients. The client must encode `#` as `%23` and `:` as `%3A` in the path.
- API Gateway HTTP API (v2) URL-decodes path parameters before passing them to Lambda as `event.pathParameters.sessionId`. The Lambda handler receives the original `#`-containing string without needing to manually decode.
- Example: client sends `PUT /v1/exams/2026-04-02T15%3A30%3A00Z%23a3f9`, Lambda receives `pathParameters.sessionId = "2026-04-02T15:30:00Z#a3f9"`, which maps directly to the DynamoDB SK.

**Impact on test harness**: `curl` commands must URL-encode the sessionId. The quickstart will include the correct encoding pattern.

---

## 5. Short UUID Generation

**Decision**: Use Node.js 20 built-in `crypto.randomUUID()` truncated to 4 hex characters.

**Rationale**:
- No additional dependency needed. `crypto` is a built-in Node.js module available in all environments.
- `crypto.randomUUID()` returns a UUID v4 string (e.g., `a3f9b2c1-...`). Taking the first 4 characters gives a short hex suffix that is unique enough when combined with the millisecond-precision ISO timestamp.
- Collision probability at the millisecond level with 4 hex chars (65,536 combinations) is acceptable for Phase 1 (single user, dev environment).

**Implementation**:
```ts
import { randomUUID } from 'crypto';
const shortId = randomUUID().replace(/-/g, '').slice(0, 4);
const sk = `${new Date().toISOString()}#${shortId}`;
```

**Alternatives considered**:
- `nanoid` — rejected: extra dependency for no meaningful benefit at Phase 1 scale.
- `uuid` package — rejected: same as above.
- `Date.now().toString(36)` — rejected: not cryptographically random, potential collisions under load.

---

## Summary of Decisions

| Topic | Decision |
|---|---|
| AWS SDK | `@aws-sdk/lib-dynamodb` DocumentClient, fully bundled |
| Build | esbuild, one bundle per handler, no externals |
| DynamoDB access pattern | GetItem (for existence + initialDatetime) → UpdateItem |
| 404 detection | GetItem returns undefined → return 404 |
| sessionId in URL | Client URL-encodes `#`→`%23`; API Gateway decodes before Lambda |
| Short UUID | `crypto.randomUUID().slice(0,4)` (built-in, no extra dep) |
| TypeScript config | `target: ES2022`, `module: commonjs`, strict mode |
