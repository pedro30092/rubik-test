import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ExamResult, ExamSession, ExamType } from '../models/exam-session.model';

const TABLE_NAME = process.env.TABLE_NAME ?? 'statistics';
const PARTITION_KEY = 'EXAM_STATS';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function createSession(
  examType: ExamType,
  sessionId: string,
  initialDatetime: string
): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: PARTITION_KEY,
        SK: sessionId,
        user: 'default@user.me',
        examType,
        initialDatetime,
      },
    })
  );
}

export async function getSession(sessionId: string): Promise<ExamSession | undefined> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: PARTITION_KEY,
        SK: sessionId,
      },
    })
  );
  return response.Item as ExamSession | undefined;
}

export async function finishSession(
  sessionId: string,
  finishDatetime: string,
  timeSeconds: number,
  result: ExamResult
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: PARTITION_KEY,
        SK: sessionId,
      },
      UpdateExpression:
        'SET finishDatetime = :fd, timeSeconds = :ts, #res = :r',
      ExpressionAttributeNames: {
        '#res': 'result',
      },
      ExpressionAttributeValues: {
        ':fd': finishDatetime,
        ':ts': timeSeconds,
        ':r': result,
      },
    })
  );
}
