export type ExamType = 'TESTING';
export type ExamResult = 'pass' | 'fail';

export const VALID_EXAM_TYPES: ExamType[] = ['TESTING'];
export const VALID_RESULTS: ExamResult[] = ['pass', 'fail'];

export interface ExamSession {
  PK: string;
  SK: string;
  user: string;
  examType: ExamType;
  initialDatetime: string;
  finishDatetime?: string;
  timeSeconds?: number;
  result?: ExamResult;
}
