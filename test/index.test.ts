import { describe, test, expect } from '@jest/globals';
import * as nock from 'nock';
import path from 'path';
import {
  addLabelToIssue,
  removeLabelFromIssue,
  closeIssue,
  reopenIssue,
  getIssues,
  issueDateCompare,
  isPr,
  Issue,
  getIssueLabelTimeline,
  Timeline,
  getIssueLabelDate,
} from '../src/github';
import * as issueData from './data/issue.json';
import * as prData from './data/pr.json';
import timelineData from './data/timeline.json';

const RECORD_TESTS = !!process.env.RECORD || false;

const recordopts = { enable_reqheaders_recording: true, output_objects: true };
const describeif = (condition: unknown) => {
  if (condition) {
    return describe;
  } else {
    console.error('Set process.env.TestToken to record tests.');
    return describe.skip;
  }
};

describeif(!RECORD_TESTS || (!!process.env.TestToken && RECORD_TESTS))('stale-issue-cleanup', () => {
  const env = process.env;
  const TestToken = env.TestToken || 'ghs_000000000000000000000000000000000001';

  beforeAll(() => {
    if (!RECORD_TESTS) nock.back.setMode('lockdown');
    jest.resetModules();
    nock.back.fixtures = path.join(__dirname, 'fixtures');
  });

  beforeEach(() => {
    if (RECORD_TESTS) nock.back.setMode('update');
    process.env = { ...env };
    process.env.GITHUB_REPOSITORY = 'kellertk/aws-github-test';
  });

  afterEach(() => {
    process.env = env;
    if (RECORD_TESTS) nock.back.setMode('wild');
    nock.cleanAll();
  });

  afterAll(nock.restore);

  test('adds a label', async () => {
    const { nockDone } = await nock.back('add-label.json', { recorder: recordopts });
    const response = await addLabelToIssue(1, ['bug', 'documentation', 'duplicate'], TestToken);
    expect(response.status).toBe(200);
    expect(response);
    nockDone();
  });

  test('removes a label', async () => {
    const { nockDone } = await nock.back('remove-label.json', { recorder: recordopts });
    const response = await removeLabelFromIssue(1, ['bug', 'documentation', 'duplicate'], TestToken);
    response.forEach(res => expect(res.status).toBe(200));
    nockDone();
  });

  test('can close issues', async () => {
    const { nockDone } = await nock.back('close-issue.json', { recorder: recordopts });
    const response = await closeIssue(1, env.TestToken!);
    expect(response.status).toBe(200);
    nockDone();
  });

  test('can reopen issues', async () => {
    const { nockDone } = await nock.back('reopen-issue.json', { recorder: recordopts });
    const response = await reopenIssue(1, env.TestToken!);
    expect(response.status).toBe(200);
    nockDone();
  });

  test('get list of issues', async () => {
    const { nockDone } = await nock.back('get-issues.json', { recorder: recordopts });
    const response = await getIssues([], env.TestToken!);
    expect(response.length).toBeGreaterThanOrEqual(1);
    nockDone();
  });

  test('get issue timeline', async () => {
    const { nockDone } = await nock.back('get-issue-timeline.json', { recorder: recordopts });
    const response = await getIssueLabelTimeline(1, env.TestToken!);
    expect(response.length).toBeGreaterThanOrEqual(1);
    nockDone();
  });

  test('get last label time from timeline', () => {
    console.log(getIssueLabelDate(timelineData as unknown as Timeline, 'enhancement'));
  });

  test('issueDateCompare', () => {
    const result = issueDateCompare(new Date(Date.now()).toISOString(), 45);
    expect(result).toBe(false);
  });

  test('isPr', () => {
    expect(isPr(prData as Issue)).toBe(true);
    expect(isPr(issueData as Issue)).toBe(false);
  });
});
