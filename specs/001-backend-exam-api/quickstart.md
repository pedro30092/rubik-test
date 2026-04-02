# Quickstart: Phase 1 — Backend Exam Session API

**Branch**: `001-backend-exam-api` | **Date**: 2026-04-02

This guide covers setting up, building, deploying (manually), and testing the exam session API locally and against the dev AWS environment.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20.x | `node --version` |
| npm | 9+ | Bundled with Node.js 20 |
| AWS CLI | v2 | For manual Lambda/DynamoDB/API Gateway setup |
| AWS credentials | — | Configured via `aws configure` or env vars |
| curl | any | For manual testing |

---

## Project Setup

```bash
# From repo root
cd backend
npm install
```

**Dependencies to install:**
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
npm install --save-dev esbuild typescript @types/node @types/aws-lambda
```

---

## Build

Compile both Lambda handlers to `dist/`:

```bash
node esbuild.config.js
```

Output:
```
dist/
├── exam-create.handler.js   ← bundle for POST /v1/exams
└── exam-finish.handler.js   ← bundle for PUT /v1/exams/:sessionId
```

---

## Manual AWS Infrastructure Setup

> These steps are done once per dev environment. IaC is deferred to a later phase.

### 1. Create the DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name statistics \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Create the Lambda Execution Role

```bash
aws iam create-role \
  --role-name rubik-dev-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach basic Lambda execution + DynamoDB access
aws iam attach-role-policy \
  --role-name rubik-dev-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam put-role-policy \
  --role-name rubik-dev-lambda-role \
  --policy-name rubik-dev-dynamodb-access \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem","dynamodb:GetItem","dynamodb:UpdateItem"],
      "Resource": "arn:aws:dynamodb:us-east-1:<ACCOUNT_ID>:table/statistics"
    }]
  }'
```

### 3. Package and Deploy Lambda Functions

```bash
# Package exam-create
cd dist && zip exam-create.zip exam-create.handler.js && cd ..

aws lambda create-function \
  --function-name rubik-dev-exam-create \
  --runtime nodejs20.x \
  --role arn:aws:iam::<ACCOUNT_ID>:role/rubik-dev-lambda-role \
  --handler exam-create.handler.handler \
  --zip-file fileb://dist/exam-create.zip \
  --environment Variables={TABLE_NAME=statistics} \
  --region us-east-1

# Package exam-finish
cd dist && zip exam-finish.zip exam-finish.handler.js && cd ..

aws lambda create-function \
  --function-name rubik-dev-exam-finish \
  --runtime nodejs20.x \
  --role arn:aws:iam::<ACCOUNT_ID>:role/rubik-dev-lambda-role \
  --handler exam-finish.handler.handler \
  --zip-file fileb://dist/exam-finish.zip \
  --environment Variables={TABLE_NAME=statistics} \
  --region us-east-1
```

> For **updates** after rebuilding: use `aws lambda update-function-code --function-name <name> --zip-file fileb://dist/<name>.zip`

### 4. Create HTTP API (API Gateway v2)

```bash
# Create the HTTP API
aws apigatewayv2 create-api \
  --name rubik-dev-api \
  --protocol-type HTTP \
  --region us-east-1
# Note the ApiId from output

# Create integrations (one per Lambda)
aws apigatewayv2 create-integration --api-id <ApiId> \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:rubik-dev-exam-create \
  --payload-format-version 2.0
# Note IntegrationId → use as <CreateIntegrationId>

aws apigatewayv2 create-integration --api-id <ApiId> \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:rubik-dev-exam-finish \
  --payload-format-version 2.0
# Note IntegrationId → use as <FinishIntegrationId>

# Create routes
aws apigatewayv2 create-route --api-id <ApiId> \
  --route-key "POST /v1/exams" \
  --target integrations/<CreateIntegrationId>

aws apigatewayv2 create-route --api-id <ApiId> \
  --route-key "PUT /v1/exams/{sessionId}" \
  --target integrations/<FinishIntegrationId>

# Create default stage (auto-deploy)
aws apigatewayv2 create-stage --api-id <ApiId> \
  --stage-name '$default' \
  --auto-deploy

# Grant API Gateway permission to invoke Lambdas
aws lambda add-permission \
  --function-name rubik-dev-exam-create \
  --statement-id api-gateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:<ACCOUNT_ID>:<ApiId>/*/*/v1/exams"

aws lambda add-permission \
  --function-name rubik-dev-exam-finish \
  --statement-id api-gateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:<ACCOUNT_ID>:<ApiId>/*/*/*"
```

Your base URL will be: `https://<ApiId>.execute-api.us-east-1.amazonaws.com`

---

## Manual Test Collection

Replace `BASE_URL` with your actual API Gateway URL.

```bash
BASE_URL="https://<ApiId>.execute-api.us-east-1.amazonaws.com"
```

### 1. Happy Path — Start an Exam Session (201)

```bash
curl -s -X POST "$BASE_URL/v1/exams" \
  -H "Content-Type: application/json" \
  -d '{"examType":"TESTING"}' | jq .
```

Expected: `{"sessionId": "2026-04-02T15:30:00.000Z#a3f9"}`

Save the sessionId:
```bash
SESSION_ID=$(curl -s -X POST "$BASE_URL/v1/exams" \
  -H "Content-Type: application/json" \
  -d '{"examType":"TESTING"}' | jq -r '.sessionId')
echo "SESSION_ID: $SESSION_ID"
```

### 2. Happy Path — Finish an Exam Session (200)

The `#` and `:` in the sessionId must be URL-encoded:
```bash
ENCODED_ID=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SESSION_ID'))")
curl -s -X PUT "$BASE_URL/v1/exams/$ENCODED_ID" \
  -H "Content-Type: application/json" \
  -d '{"result":"pass"}' | jq .
```

Expected: `{"status": "updated"}`

### 3. Unknown sessionId — Not Found (404)

```bash
curl -s -X PUT "$BASE_URL/v1/exams/1970-01-01T00%3A00%3A00.000Z%23ffff" \
  -H "Content-Type: application/json" \
  -d '{"result":"pass"}' | jq .
```

Expected: `{"error": "session not found"}`

### 4. Invalid examType — Bad Request (400)

```bash
curl -s -X POST "$BASE_URL/v1/exams" \
  -H "Content-Type: application/json" \
  -d '{"examType":"INVALID"}' | jq .
```

Expected: `{"error": "examType must be one of: TESTING"}`

### 5. Missing result on PUT — Bad Request (400)

```bash
ENCODED_ID=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SESSION_ID'))")
curl -s -X PUT "$BASE_URL/v1/exams/$ENCODED_ID" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

Expected: `{"error": "result must be one of: pass, fail"}`

### 6. Abandoned Session — Verify No Finish Attributes

Start a session but do not call PUT. Inspect via AWS CLI:
```bash
aws dynamodb get-item \
  --table-name statistics \
  --key '{"PK":{"S":"EXAM_STATS"},"SK":{"S":"'"$SESSION_ID"'"}}' \
  --region us-east-1 | jq .
```

Expected: item has `PK`, `SK`, `user`, `examType`, `initialDatetime` — but NO `finishDatetime`, `timeSeconds`, or `result`.
