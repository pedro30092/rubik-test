---
applyTo: '**'
---

AWS Free Tier is the non-negotiable cost constraint for this project. Always design, suggest, and implement with the goal of staying within the AWS Free Tier limits.

Always prefer HTTP API (API Gateway v2) over REST API (v1). HTTP API is cheaper and sufficient for this project's needs.

Always use DynamoDB on-demand capacity mode (PAY_PER_REQUEST) unless explicitly told otherwise. Never provision capacity units.

Never suggest services outside the AWS Free Tier for this project (e.g. no RDS, no ElastiCache, no NAT Gateways, no ECS).

When suggesting a DynamoDB schema or access pattern, prefer designs that minimize read and write operations — e.g. avoid read-before-write unless the operation strictly requires it.

When suggesting Lambda configurations, keep memory at 128 MB unless a higher value is justified. Prefer esbuild bundles over webpack to minimize cold start times and bundle size.

If a proposed solution would risk exceeding Free Tier thresholds, say so explicitly and offer a cheaper alternative before proceeding.
