import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { VALID_RESULTS } from '../models/exam-session.model';
import { finishSession, getSession } from '../services/exam.service';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const sessionId = event.pathParameters?.sessionId;
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing sessionId' }) };
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid JSON body' }) };
  }

  const { result } = body;
  if (!result || !VALID_RESULTS.includes(result as never)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: `result must be one of: ${VALID_RESULTS.join(', ')}` }),
    };
  }

  try {
    const item = await getSession(sessionId);
    if (!item) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Session not found' }) };
    }

    const finishDatetime = new Date().toISOString();
    const timeSeconds = Math.floor(
      (new Date(finishDatetime).getTime() - new Date(item.initialDatetime).getTime()) / 1000
    );

    await finishSession(
      sessionId,
      finishDatetime,
      timeSeconds,
      result as (typeof VALID_RESULTS)[number]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'updated' }),
    };
  } catch (err) {
    console.error('finishSession error', err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) };
  }
}
