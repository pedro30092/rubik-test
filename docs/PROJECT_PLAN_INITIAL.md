# Rubik's Cube Learning Platform — Project Plan

**Project**: Interactive exam/drill system for learning Rubik's cube solving through pattern recognition  
**Scope**: Personal learning tool with backend tracking  
**Target Stack**: Angular SPA frontend + AWS Lambda + Node.js/TypeScript backend  
**Date Created**: April 2, 2026

---

## 1. Vision & Goals

### Core Vision
Build an interactive "exam mode" platform where users practice solving Rubik's cube puzzles by learning and recognizing patterns from established solutions. Track performance and learning progress over time.

### Key Goals
- **Learn via Pattern Recognition**: Present cube scrambles and let users solve while learning established solution patterns
- **Difficulty Progression**: Organize challenges from easy → medium → hard with clear progression paths
- **Personal Analytics**: Track time-per-solve, accuracy, patterns mastered, learning velocity
- **Lightweight & Personal**: Solo learning tool (not multi-tenant initially)

---

## 2. Feature Scope (MVP Phase)

### Core Features
1. **Exam/Challenge System**
   - Present a scrambled cube state
   - Display associated solution pattern (step-by-step moves)
   - Let user attempt solution with move tracking

2. **Pattern Library**
   - Categorized solution patterns (beginner layer-by-layer, intermediate CFOP, etc.)
   - Each pattern includes: name, difficulty, move sequence, explanation

3. **Difficulty Levels**
   - **Easy**: Simple 2-layer patterns (8–12 moves)
   - **Medium**: Full layer-by-layer with M-slice techniques (15–30 moves)
   - **Hard**: CFOP or Roux method advanced patterns (30+ moves)

4. **User Progress Tracking**
   - Attempts per pattern
   - Best solve time per pattern
   - Patterns mastered (threshold: 3+ correct solves)
   - Session history (date, pattern, result, time)

5. **Basic UI/UX**
   - Cube visualization (3D or 2D net representation)
   - Pattern selector/drill interface
   - Progress dashboard (stats, next challenges)

### Out of Scope (Initial Phase)
- Multi-player leaderboards
- Social sharing
- AI hint system
- Video tutorials
- Multiple cube types (only 3x3 initially)

---

## 3. Architecture Overview

### Frontend (Angular SPA)
```
- Smart Components Layer
  ├── Dashboard (progress overview)
  ├── Exam/Drill (challenge interface)
  └── Pattern Gallery (browse patterns)

- State Management
  └── Via @ngrx or Signals-based state (TBD during design phase)

- Services
  ├── PatternService (fetch, store patterns)
  ├── ExamService (manage challenge attempts)
  ├── UserService (profile, auth placeholder)
  └── CubeVisualizationService (3D/2D rendering)

- Routing
  └── Feature modules: dashboard, exams, patterns
```

### Backend (AWS Lambda + TypeScript)
```
Entry Points (API Gateway REST endpoints):
  POST   /v1/user/login           (auth placeholder)
  GET    /v1/user/profile         (fetch user data)
  GET    /v1/patterns             (list available patterns)
  GET    /v1/patterns/:id         (fetch single pattern)
  POST   /v1/exams                (start/submit exam attempt)
  GET    /v1/exams/history        (fetch session history)
  GET    /v1/analytics/progress   (user progress metrics)

Lambdas:
  - rubik-dev-user-profile.ts
  - rubik-dev-pattern-fetch.ts
  - rubik-dev-exam-submit.ts
  - rubik-dev-analytics-progress.ts
  [etc., one per domain-action pair]

Data Layer:
  - DynamoDB tables:
    * UserProfile (PK: userId)
    * Pattern (PK: patternId)
    * ExamAttempt (PK: userId, SK: attemptId)
    * SessionHistory (PK: userId, SK: timestamp)
```

### Data Model (Initial)

#### User Profile
```json
{
  "userId": "user-123",
  "username": "string",
  "createdAt": "ISO-8601",
  "stats": {
    "totalAttempts": "number",
    "masterCount": "number",
    "totalTimeInvested": "seconds"
  }
}
```

#### Pattern
```json
{
  "patternId": "beginner-layer-1",
  "name": "string",
  "difficulty": "easy | medium | hard",
  "description": "string",
  "moveSequence": ["U", "R", "U'", ...],
  "moveCount": "number",
  "category": "layer-by-layer | cfop | roux",
  "explanation": "step-by-step guide"
}
```

#### Exam Attempt
```json
{
  "userId": "user-123",
  "attemptId": "attempt-456",
  "patternId": "beginner-layer-1",
  "userMoveSequence": ["U", "R", ...],
  "isCorrect": "boolean",
  "timeSeconds": "number",
  "createdAt": "ISO-8601"
}
```

---

## 4. Difficulty Classification Strategy

### Rubik's Cube Solving Methods Reference
- **Layer-by-Layer (Beginner)**: Solve white cross → white corners → middle layer → yellow
- **CFOP (Intermediate-Advanced)**: Cross → F2L → OLL → PLL
- **Roux (Advanced)**: M-slice techniques, block building

### Proposed Difficulty Levels

| Level | Method | Moves | Examples | Learning Focus |
|-------|--------|-------|----------|-----------------|
| **Easy** | Layer-by-layer | 8–15 | White cross, first layer corners | Fundamentals |
| **Medium** | Layer-by-layer + M-slice | 15–30 | Middle layer edges, yellow layer | Integration |
| **Hard** | CFOP/Roux subsets | 30+ | PLL algorithms, block building | Advanced technique |

---

## 5. MVP Deliverables (Phase 1)

### Backend
- [ ] API contract (OpenAPI spec or tRPC schema)
- [ ] DynamoDB tables & seed data (10–20 patterns across difficulties)
- [ ] 4–5 core Lambda functions (user fetch, pattern fetch, exam submit, analytics)
- [ ] Basic request/response validation
- [ ] Local testing harness

### Frontend
- [ ] Angular app scaffolding (routing, feature modules)
- [ ] Dashboard component (progress overview)
- [ ] Exam/Drill interface (pattern display, move input, result)
- [ ] Pattern gallery (browse by difficulty)
- [ ] HTTP client integration with backend

### Documentation
- [ ] API endpoint spec (this file will reference it)
- [ ] Table schema & access patterns (DynamoDB design doc)
- [ ] Setup & deployment guide (TBD — dev vs. prod AWS account setup)

---

## 6. Technology Decisions (Pending Design Phase)

| Area | Options | Notes |
|------|---------|-------|
| **Frontend State** | @ngrx vs. Signals-based | Decide during architecture spike |
| **Cube Visualization** | Three.js vs. 2D SVG net | Performance vs. simplicity tradeoff |
| **API Versioning** | REST (API Gateway) vs. tRPC | REST is simpler for Lambda; tRPC needs adapter |
| **DynamoDB Indexes** | GSI on userId+patternId? | Depends on query patterns we finalize |
| **Auth** | OAuth2 placeholder vs. skip for MVP | Scope decision for Phase 1 |

---

## 7. Next Steps (Ordered)

1. **Define API Contract** (1–2 days)
   - Create OpenAPI spec or detailed endpoint documentation
   - Agree on request/response shapes

2. **Design Data Model & DynamoDB Schema** (1 day)
   - Finalize table structure and access patterns
   - Create seed migration for ~20 patterns

3. **Backend Spike** (2–3 days)
   - Scaffold Lambda project (esbuild + handler pattern)
   - Implement 2–3 core functions (non-auth)
   - Local testing setup

4. **Frontend Spike** (2–3 days)
   - Scaffold Angular SPA with feature modules
   - Build crude exam interface (basic HTML)
   - Integrate with backend via HTTP client

5. **Integrate & Test End-to-End** (1–2 days)
   - Smoke tests across frontend-backend
   - Log learnings; adjust architecture if needed

6. **Define Phase 2** (1 day)
   - Auth integration
   - Advanced features (leaderboards, hints)
   - Deployment strategy (Terraform IaC)

---

## 8. Risks & Assumptions

### Assumptions
- Solo user (no multi-tenancy needed initially)
- Cube visualization can be simple (2D net or basic 3D)
- Solution patterns are pre-curated (not AI-generated)
- AWS account already set up

### Risks
- **3D Cube Rendering**: Three.js adds complexity; 2D SVG might be sufficient for MVP
- **Pattern Accuracy**: Verifying correct move sequences requires testing
- **UX of Move Input**: How does user input moves? (keyboard, click-based UI, voice?) — critical for usability

### Mitigation
- Start with 2D visualization; upgrade to 3D in Phase 2
- Seed patterns with well-tested sequences (reference established methods)
- Build move input UI iteratively based on user feedback

---

## 9. Success Criteria (MVP Phase)

- [ ] Can log in as solo user
- [ ] Can view 5+ patterns organized by difficulty
- [ ] Can complete an exam attempt and see pass/fail result
- [ ] Can view personal progress dashboard (total attempts, patterns mastered)
- [ ] Backend correctly logs all attempts to DynamoDB
- [ ] End-to-end latency < 500ms for exam submission

---

## File Structure (Planned)

```
rubik_test/
├── docs/
│   ├── PROJECT_PLAN.md (this file)
│   ├── API_CONTRACT.md (next)
│   ├── DYNAMODB_SCHEMA.md (next)
│   └── DEPLOYMENT.md (Phase 2)
├── frontend/
│   ├── src/
│   │   ├── app/ (Angular modules, components, services)
│   │   ├── assets/
│   │   └── environments/
│   └── angular.json
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   ├── esbuild.config.js
│   └── tsconfig.json
└── infrastructure/
    ├── terraform/
    └── tfvars/ (dev, prod)
```

---

## Questions for Refinement

Before moving to the API contract phase, we should align on:

1. **Cube Visualization**: 2D net (simple) or 3D (interactive)?
2. **Move Input Method**: Keyboard (U, R, F, L, B, D + modifier for prime)?
3. **Pattern Seed Data**: Should we hardcode 20 patterns, or build a pattern generator?
4. **Auth**: Even for solo use, do you want JWT token-based auth, or skip for MVP?
5. **Deployment Target**: AWS region preference? (us-east-1, eu-west-1, etc.)
