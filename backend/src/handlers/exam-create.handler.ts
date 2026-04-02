import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { VALID_EXAM_TYPES } from '../models/exam-session.model';
import { createSession } from '../services/exam.service';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON body' }) };
  }

  const { examType } = body;
  if (!examType || !VALID_EXAM_TYPES.includes(examType as never)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `examType must be one of: ${VALID_EXAM_TYPES.join(', ')}` }),
    };
  }

  const initialDatetime = new Date().toISOString();
  const shortId = randomUUID().replace(/-/g, '').slice(0, 4);
  const sessionId = `${initialDatetime}#${shortId}`;

  try {
    await createSession(examType as (typeof VALID_EXAM_TYPES)[number], sessionId, initialDatetime);
    return {
      statusCode: 201,
      body: JSON.stringify({ sessionId }),
    };
  } catch (err) {
    console.error('createSession error', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) };
  }
}
